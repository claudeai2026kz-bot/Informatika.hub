import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Таза қазақша дауыс (Azure Speech, kk-KZ нейрондық дауыс).
 * Баптау: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (мысалы, westeurope),
 * қаласаңыз AZURE_SPEECH_VOICE (әдепкісі kk-KZ-AigulNeural, ер дауыс: kk-KZ-DauletNeural).
 * Кілт болмаса 501 қайтарады, сонда браузер өз дауысын қолданады.
 */
const body = z.object({ text: z.string().trim().min(1).max(700) });

const cache = new Map<string, ArrayBuffer>();
const CACHE_MAX = 200;

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return NextResponse.json({ error: "tts-not-configured" }, { status: 501 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  const text = parsed.data.text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const voice = process.env.AZURE_SPEECH_VOICE || "kk-KZ-AigulNeural";
  const ck = `${voice}|${text}`;
  const hit = cache.get(ck);
  if (hit) return audio(hit);

  if (!(await rateLimit("tts", 40, 60))) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  const ssml = `<speak version="1.0" xml:lang="kk-KZ"><voice name="${esc(voice)}"><prosody rate="-4%">${esc(text)}</prosody></voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "informatika-hub",
    },
    body: ssml,
  }).catch(() => null);
  if (!r || !r.ok) return NextResponse.json({ error: "tts-failed" }, { status: 502 });

  const buf = await r.arrayBuffer();
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(ck, buf);
  return audio(buf);
}

function audio(buf: ArrayBuffer) {
  return new NextResponse(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=604800, immutable" } });
}
