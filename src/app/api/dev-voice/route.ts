/**
 * УАҚЫТША, ТЕК ӘЗІРЛЕУ РЕЖИМІНДЕ (npm run dev): роботтың дауыстарын алдын ала жазып сақтау.
 * Браузер жазған әр сөйлемнің mp3 дыбысын public/tts/kk-issai/_parts ішіне сақтайды,
 * соңында бәрін бір clips.bin файлына және clips.json мазмұнына жинайды.
 * Интернеттегі сайтта (production) мүлде жұмыс істемейді (404). Жұмыс біткен соң бұл папканы өшіруге болады.
 */
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "tts", "kk-issai");
const PARTS = path.join(DIR, "_parts");
const off = () => process.env.NODE_ENV === "production";
const name = (i: number) => path.join(PARTS, `${String(i).padStart(4, "0")}.mp3`);

export async function GET() {
  if (off()) return new NextResponse(null, { status: 404 });
  await fs.mkdir(PARTS, { recursive: true });
  const have = (await fs.readdir(PARTS)).filter((f) => f.endsWith(".mp3")).map((f) => parseInt(f, 10));
  return NextResponse.json({ have });
}

export async function POST(req: Request) {
  if (off()) return new NextResponse(null, { status: 404 });
  const url = new URL(req.url);
  await fs.mkdir(PARTS, { recursive: true });
  if (url.searchParams.get("build") === "1") {
    const phrases = JSON.parse(await fs.readFile(path.join(DIR, "phrases.json"), "utf8")) as string[];
    const bufs: Buffer[] = [];
    const map: Record<string, [number, number]> = {};
    let pos = 0;
    for (let i = 0; i < phrases.length; i++) {
      const b = await fs.readFile(name(i)).catch(() => null);
      if (!b || !b.length) continue;
      map[phrases[i]] = [pos, b.length];
      bufs.push(b);
      pos += b.length;
    }
    await fs.writeFile(path.join(DIR, "clips.bin"), Buffer.concat(bufs));
    await fs.writeFile(path.join(DIR, "clips.json"), JSON.stringify(map));
    return NextResponse.json({ clips: Object.keys(map).length, of: phrases.length, bytes: pos });
  }
  const i = Number(url.searchParams.get("i"));
  if (!Number.isInteger(i) || i < 0 || i > 100000) return NextResponse.json({ ok: false }, { status: 400 });
  const body = Buffer.from(await req.arrayBuffer());
  if (!body.length || body.length > 2_000_000) return NextResponse.json({ ok: false }, { status: 400 });
  await fs.writeFile(name(i), body);
  return NextResponse.json({ ok: true });
}
