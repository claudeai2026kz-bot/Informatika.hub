import os, json, torch
from transformers import VitsModel, AutoTokenizer
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'web'); os.makedirs(out, exist_ok=True)
m = VitsModel.from_pretrained("facebook/mms-tts-kaz").eval()
t = AutoTokenizer.from_pretrained("facebook/mms-tts-kaz")

class W(torch.nn.Module):
    def __init__(s, m): super().__init__(); s.m = m
    def forward(s, input_ids, attention_mask):
        return s.m(input_ids=input_ids, attention_mask=attention_mask).waveform

ids = t("сәлем ұстаз", return_tensors="pt")
torch.onnx.export(W(m), (ids.input_ids, ids.attention_mask), os.path.join(out, 'model.onnx'),
    input_names=['input_ids', 'attention_mask'], output_names=['waveform'],
    dynamic_axes={'input_ids': {0: 'b', 1: 'n'}, 'attention_mask': {0: 'b', 1: 'n'}, 'waveform': {0: 'b', 1: 'samples'}},
    opset_version=17, dynamo=False)
print('exported', os.path.getsize(os.path.join(out, 'model.onnx')))

from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic(os.path.join(out, 'model.onnx'), os.path.join(out, 'model_q8.onnx'), weight_type=QuantType.QUInt8)
print('quantized', os.path.getsize(os.path.join(out, 'model_q8.onnx')))

vocab = t.get_vocab()
json.dump({'vocab': vocab, 'pad_id': t.pad_token_id, 'add_blank': bool(t.add_blank), 'sampling_rate': m.config.sampling_rate,
           'noise_scale': m.config.noise_scale, 'speaking_rate': m.config.speaking_rate},
          open(os.path.join(out, 'tokenizer.json'), 'w', encoding='utf-8'), ensure_ascii=False)

# check with onnxruntime
import onnxruntime as ort, numpy as np, scipy.io.wavfile as wav
s = ort.InferenceSession(os.path.join(out, 'model_q8.onnx'))
ids = t("сәлем ұстаз мен сіздің көмекшіңізбін", return_tensors="np")
y = s.run(None, {'input_ids': ids['input_ids'].astype(np.int64), 'attention_mask': ids['attention_mask'].astype(np.int64)})[0]
wav.write(os.path.join(here, 'onnx_q8.wav'), 16000, y[0])
print('ort ok', y.shape, 'pad', t.pad_token_id, 'blank', t.add_blank, 'first ids', ids['input_ids'][0][:12])
