from pathlib import Path
import json, hashlib
import numpy as np

root = Path(__file__).resolve().parents[1]
baseline = json.loads((root / 'validation/python-baselines.json').read_text(encoding='utf-8'))[1]
matlab = json.loads((root / 'validation/matlab-baseline.json').read_text(encoding='utf-8'))
n = len(matlab['frequency'])
error = float(np.max(np.abs(np.array(matlab['frequency']) - np.array(baseline['frequency'][:n]))))
summary = {'status': 'verified', 'matlabVersion': matlab['version'], 'frequencyMaxDifference': error,
           'minimum': matlab['minimum'], 'matlabRocof': matlab['maxRocof'],
           'pythonRocof': max(map(abs, baseline['rocof'][:n])), 'eventTimes': matlab['event_times'],
           'samples': [{'time': t, 'python': baseline['frequency'][round(t/.02)], 'matlab': matlab['frequency'][round(t/.02)]} for t in [0, 1, 2.32, 5.2, 10, 20, 60, 120]]}
assert n == 6001 and error <= 1e-6
(root / 'public/data/validation-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
original = json.loads((root / 'validation/original-sha256.json').read_text(encoding='utf-8'))
checks = {name: hashlib.sha256((root.parent / name).read_bytes()).hexdigest() == digest for name,digest in original.items()}
assert all(checks.values())
(root / 'validation/original-integrity.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
