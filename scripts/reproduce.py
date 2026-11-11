"""Reproduce supplied sources in isolated copies; never edit original inputs."""
from pathlib import Path
import hashlib, json, shutil, zipfile, runpy, contextlib, io, urllib.request
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent
VALID = ROOT / 'validation'
PUBLIC = ROOT / 'public'
for p in [VALID, PUBLIC / 'data', PUBLIC / 'assets', PUBLIC / 'results']:
    p.mkdir(parents=True, exist_ok=True)
manifest = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in SOURCE.iterdir() if p.is_file()}
(VALID / 'original-sha256.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
copies = {}
for version in ['v1', 'v2']:
    folder = VALID / 'reproduction' / version
    folder.mkdir(parents=True, exist_ok=True)
    if version == 'v1':
        for name in ['blackout_analysis.py', 'draw_simulink.py', 'uk_blackout_freq.m']:
            shutil.copy2(SOURCE / name, folder / name)
    else:
        with zipfile.ZipFile(SOURCE / '程序源码.zip') as z:
            for name in ['blackout_analysis.py', 'draw_simulink.py', 'README.md']:
                member = next(n for n in z.namelist() if len(n.split('/')) == 2 and n.endswith('/' + name) and not n.startswith('__MACOSX'))
                (folder / name).write_bytes(z.read(member))
    log = io.StringIO()
    with contextlib.redirect_stdout(log):
        runpy.run_path(str(folder / 'blackout_analysis.py'), run_name='__main__')
        runpy.run_path(str(folder / 'draw_simulink.py'), run_name='__main__')
    (folder / 'run.log').write_text(log.getvalue(), encoding='utf-8')
    copies[version] = runpy.run_path(str(folder / 'blackout_analysis.py'))

cases = []
for h in [4 / .63 * .8, 4, 4 / .63 * .44, 2, 6.5]:
    r = copies['v2']['simulate'](H=h, duration=200)
    cases.append({k: v.tolist() if isinstance(v, np.ndarray) else v for k, v in r.items()})
(VALID / 'python-baselines.json').write_text(json.dumps(cases, ensure_ascii=False), encoding='utf-8')
summary = []
for r in cases[:3]:
    summary.append({'H': r['H'], 'minimum': min(r['frequency']), 'maxRocof': max(map(abs, r['rocof'])), 'final': r['frequency'][-1], 'events': r['events']})
(PUBLIC / 'data' / 'python-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
for p in (VALID / 'reproduction' / 'v2' / '运行结果').glob('*.png'):
    shutil.copy2(p, PUBLIC / 'results' / p.name)
for name in ['blackout_analysis.py', 'draw_simulink.py']:
    shutil.copy2(VALID / 'reproduction' / 'v2' / name, PUBLIC / 'results' / name)
shutil.copy2(SOURCE / 'uk_blackout_freq.m', PUBLIC / 'results' / 'uk_blackout_freq.m')
old = copies['v1']['simulate']()
new = copies['v2']['simulate']()
comparison = {'frequency_max_difference': float(np.max(np.abs(old[1] - new['frequency']))), 'rocof_max_difference': float(np.max(np.abs(old[2] - new['rocof']))), 'v1_events': old[4], 'v2_events': new['events'], 'initial_imbalance_v1': float(old[3][0]), 'initial_imbalance_v2': float(new['imbalance_mw'][0])}
(VALID / 'version-comparison.json').write_text(json.dumps(comparison, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
