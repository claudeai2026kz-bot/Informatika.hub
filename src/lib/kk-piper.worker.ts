/// <reference lib="webworker" />
/**
 * Роботтың жаңа қазақша дауысы — ISSAI KazakhTTS2 (Piper, «kk_KZ-issai-high», 3-диктор, әйел).
 * Алдын ала жазылмаған сөздерді браузердің өзінде дыбысқа айналдырады.
 * Модель бір рет жүктеліп (~128 МБ), браузердің Cache Storage-інде сақталады.
 * Лицензия: CC-BY-4.0 (ISSAI, Назарбаев университеті).
 */
import * as ort from "onnxruntime-web";

const ORT_VERSION = "1.20.1";
ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
ort.env.wasm.numThreads = 1;

const VOICE = {
  model: "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx",
  speaker: 2, // ISSAI_KazakhTTS2_F3 — пайдаланушы таңдаған 3-дауыс
  sampleRate: 22050,
  scales: [0.667, 1, 0.8], // noise_scale, length_scale (жылдамдық: 1 = қалыпты), noise_w
};
// Қазақ мәтінін дыбыс таңбаларына айналдыратын бөлік (espeak-ng, Piper)
const PHONEMIZE_JS = "https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.4/dist/piper-o91UDS6e.js";
const PHONEMIZE_WASM = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";

type PhonemizeModule = { callMain(args: string[]): void };
type CreatePhonemize = (o: {
  print: (d: string) => void;
  printErr: (e: string) => void;
  locateFile: (u: string) => string;
}) => Promise<PhonemizeModule>;

let createPhonemize: Promise<CreatePhonemize> | null = null;
let session: Promise<ort.InferenceSession> | null = null;
let latest = 0;

async function modelBytes(): Promise<ArrayBuffer> {
  try {
    const cache = await caches.open("ihub-voice-issai");
    const hit = await cache.match(VOICE.model);
    if (hit) return await hit.arrayBuffer();
    const r = await fetch(VOICE.model);
    if (!r.ok) throw new Error("model");
    void cache.put(VOICE.model, r.clone()).catch(() => {});
    return await r.arrayBuffer();
  } catch {
    const r = await fetch(VOICE.model);
    if (!r.ok) throw new Error("model");
    return await r.arrayBuffer();
  }
}

function load() {
  createPhonemize ??= import(/* webpackIgnore: true */ PHONEMIZE_JS).then((m) => m.createPiperPhonemize as CreatePhonemize);
  session ??= modelBytes().then((b) => ort.InferenceSession.create(b, { executionProviders: ["wasm"] }));
  createPhonemize.catch(() => { createPhonemize = null; });
  session.catch(() => { session = null; });
  return Promise.all([createPhonemize, session]);
}

async function phonemize(create: CreatePhonemize, text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    create({
      print: (d) => { try { resolve(JSON.parse(d).phoneme_ids); } catch (e) { reject(e); } },
      printErr: () => {},
      locateFile: (u) => (u.endsWith(".wasm") ? `${PHONEMIZE_WASM}.wasm` : u.endsWith(".data") ? `${PHONEMIZE_WASM}.data` : u),
    })
      .then((m) => m.callMain(["-l", "kk", "--input", JSON.stringify([{ text }]), "--espeak_data", "/espeak-ng-data"]))
      .catch(reject);
  });
}

type Msg = { type: "load" } | { type: "synth"; id: number; idx: number; text: string } | { type: "cancel"; id: number };

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  if (m.type === "cancel") { latest = Math.max(latest, m.id + 1); return; }
  try {
    const [create, s] = await load();
    if (m.type === "load") return;
    if (m.id < latest) return; // бұл сөз тоқтатылған
    const ids = await phonemize(create, m.text);
    if (m.id < latest) return;
    const res = await s.run({
      input: new ort.Tensor("int64", BigInt64Array.from(ids.map((x) => BigInt(x))), [1, ids.length]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor("float32", Float32Array.from(VOICE.scales), [3]),
      sid: new ort.Tensor("int64", BigInt64Array.from([BigInt(VOICE.speaker)]), [1]),
    });
    const pcm = new Float32Array(res.output.data as Float32Array);
    self.postMessage({ type: "pcm", id: m.id, idx: m.idx, pcm, rate: VOICE.sampleRate }, { transfer: [pcm.buffer] });
  } catch (err) {
    if (m.type === "synth") self.postMessage({ type: "error", id: m.id, idx: m.idx, message: String(err) });
  }
};
