/**
 * MMS-TTS (қазақша) моделінің ортақ бөлігі: токенизация және бір бөлікті дыбысқа айналдыру.
 * Браузерде (Web Worker) де, Node-та да (алдын ала жазу үшін) қолданылады.
 */
export type KkTokenizer = { vocab: Record<string, number>; pad_id: number; add_blank: boolean; sampling_rate: number };

export function tokenize(text: string, tok: KkTokenizer): number[] {
  const ids: number[] = [];
  for (const ch of text.toLowerCase()) {
    const id = tok.vocab[ch];
    if (id !== undefined) ids.push(id);
  }
  if (!tok.add_blank) return ids;
  const out: number[] = [tok.pad_id];
  for (const id of ids) out.push(id, tok.pad_id);
  return out;
}

type Tensor = { data: unknown };
type Session = { run(feeds: Record<string, unknown>): Promise<Record<string, Tensor>> };
type TensorCtor = new (type: "int64", data: BigInt64Array, dims: number[]) => unknown;

export async function synth(session: Session, Tensor: TensorCtor, tok: KkTokenizer, text: string): Promise<Float32Array> {
  const ids = tokenize(text, tok);
  if (ids.length < 3) return new Float32Array(0);
  const input = new BigInt64Array(ids.map((x) => BigInt(x)));
  const mask = new BigInt64Array(ids.length).fill(1n);
  const res = await session.run({
    input_ids: new Tensor("int64", input, [1, ids.length]),
    attention_mask: new Tensor("int64", mask, [1, ids.length]),
  });
  return res.waveform.data as Float32Array;
}
