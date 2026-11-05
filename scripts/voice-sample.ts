// Тексеру үшін: мәтіннің алдын ала жазылған бөліктерін бір mp3 файлға жинайды.
import fs from "node:fs";
import path from "node:path";
import { chunksKk } from "../src/lib/kk-normalize";
const dir = path.join(__dirname, "..", "public", "tts", "kaz");
const map: Record<string, string> = JSON.parse(fs.readFileSync(path.join(dir, "clips.json"), "utf8"));
const [out, ...texts] = process.argv.slice(2);
const parts: Buffer[] = [];
for (const t of texts) for (const c of chunksKk(t)) {
  const f = map[c.text];
  console.log(f ? "✓" : "✗", c.text);
  if (f) parts.push(fs.readFileSync(path.join(dir, "clips", f)));
}
fs.writeFileSync(out, Buffer.concat(parts));
