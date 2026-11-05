# Робот дауыстарын қайта жазу (жаңа материал қосылғанда):
#  1) python scripts/voice-export-model.py   -> web/model.onnx (MMS-TTS kaz, CC-BY-NC 4.0)
#  2) npx tsx scripts/voice-texts.ts chunks.json
#  3) python scripts/voice-gen.py           (onnxruntime, lameenc керек)
# Жолдарды өз компьютеріңізге қарай өзгертіңіз.
import os, json, hashlib, time, numpy as np, onnxruntime as ort, lameenc
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "public", "tts", "kaz", "clips")
os.makedirs(out, exist_ok=True)
tok = json.load(open(os.path.join(here, 'web', 'tokenizer.json'), encoding='utf-8'))
chunks = json.load(open(os.path.join(here, 'chunks.json'), encoding='utf-8'))
so = ort.SessionOptions(); so.intra_op_num_threads = 4
s = ort.InferenceSession(os.path.join(here, 'web', 'model.onnx'), so)
manifest_path = os.path.join(out, '..', 'clips.json')
manifest = json.load(open(manifest_path, encoding='utf-8')) if os.path.exists(manifest_path) else {}
def ids(t):
    v = [tok['vocab'][c] for c in t.lower() if c in tok['vocab']]; o = [0]
    for x in v: o += [x, 0]
    return np.array([o], dtype=np.int64)
t0 = time.time(); done = 0
for i, text in enumerate(chunks):
    name = hashlib.sha1(text.encode('utf-8')).hexdigest()[:16] + '.mp3'
    if text in manifest and os.path.exists(os.path.join(out, name)): continue
    x = ids(text)
    if x.shape[1] < 3: continue
    np.random.seed(0)
    y = s.run(None, {'input_ids': x, 'attention_mask': np.ones_like(x)})[0][0]
    pcm = (np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()
    enc = lameenc.Encoder(); enc.set_bit_rate(32); enc.set_in_sample_rate(16000); enc.set_channels(1); enc.set_quality(2)
    open(os.path.join(out, name), 'wb').write(enc.encode(pcm) + enc.flush())
    manifest[text] = name; done += 1
    if done % 50 == 0:
        json.dump(manifest, open(manifest_path, 'w', encoding='utf-8'), ensure_ascii=False)
        print(i + 1, '/', len(chunks), round(time.time() - t0), 's', flush=True)
json.dump(manifest, open(manifest_path, 'w', encoding='utf-8'), ensure_ascii=False)
print('DONE', len(manifest), 'clips', round(time.time() - t0), 's', flush=True)
