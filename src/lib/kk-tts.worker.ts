/// <reference lib="webworker" />
/**
 * Қазақша дауыс жұмысшысы: алдын ала жазылмаған бөліктерді браузердің өзінде дыбысқа айналдырады.
 * Модель бір рет жүктеледі (ашық MMS-TTS kaz, ~38 МБ, браузер кэшінде сақталады).
 */
import * as ort from "onnxruntime-web";
import { synth, type KkTokenizer } from "./kk-tts-core";

const ORT_VERSION = "1.20.1";
ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
ort.env.wasm.numThreads = 1;

let ready: Promise<{ session: ort.InferenceSession; tok: KkTokenizer }> | null = null;
let latest = 0;

function load() {
  ready ??= (async () => {
    const [tok, model] = await Promise.all([
      fetch("/tts/kaz/tokenizer.json").then((r) => r.json() as Promise<KkTokenizer>),
      fetch("/tts/kaz/model_q8.onnx").then((r) => { if (!r.ok) throw new Error("model"); return r.arrayBuffer(); }),
    ]);
    const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
    return { session, tok };
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

type Msg = { type: "load" } | { type: "synth"; id: number; idx: number; text: string } | { type: "cancel"; id: number };

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  if (m.type === "cancel") { latest = Math.max(latest, m.id + 1); return; }
  try {
    const { session, tok } = await load();
    if (m.type === "load") return;
    if (m.id < latest) return; // бұл сөз тоқтатылған
    const pcm = await synth(session as never, ort.Tensor as never, tok, m.text);
    self.postMessage({ type: "pcm", id: m.id, idx: m.idx, pcm, rate: tok.sampling_rate }, { transfer: [pcm.buffer] });
  } catch (err) {
    if (m.type === "synth") self.postMessage({ type: "error", id: m.id, idx: m.idx, message: String(err) });
  }
};
