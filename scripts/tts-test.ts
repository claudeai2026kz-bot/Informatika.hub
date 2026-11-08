// Жергілікті тексеру: мәтінді қазақша дауысқа айналдырып, WAV файл жазады.
// npx tsx scripts/tts-test.ts "<шығыс бума>"
import fs from "node:fs";
import path from "node:path";
import * as ort from "onnxruntime-web";
import { chunksKk } from "../src/lib/kk-normalize";
import { synth, type KkTokenizer } from "../src/lib/kk-tts-core";

const outDir = process.argv[2] ?? ".";
const root = path.join(__dirname, "..", "public", "tts", "kaz");
const tok: KkTokenizer = JSON.parse(fs.readFileSync(path.join(root, "tokenizer.json"), "utf8"));

function wav(samples: Float32Array, sr: number) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  return b;
}

const TEXTS: Record<string, string> = {
  welcome: "Сәлеметсіз бе! Informatika Hub сайтына қош келдіңіз! Бұл сайт информатика мұғалімдеріне арналған. Мұнда 5–11 сыныптарға дайын презентация, ҚМЖ, тапсырма, БЖБ мен ТЖБ бар.",
  search: "Таптым! 7-сынып, II тоқсан, «Python программалау» бөлімінен 3 презентация бар.",
};

(async () => {
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(fs.readFileSync(path.join(root, "model_q8.onnx")));
  for (const [name, text] of Object.entries(TEXTS)) {
    const parts: Float32Array[] = [];
    for (const c of chunksKk(text)) {
      console.log(name, "|", c.text);
      parts.push(await synth(session as never, ort.Tensor as never, tok, c.text), new Float32Array(Math.round(tok.sampling_rate * c.pause / 1000)));
    }
    const all = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
    fs.writeFileSync(path.join(outDir, `${name}.wav`), wav(all, tok.sampling_rate));
  }
  console.log("done");
})();
