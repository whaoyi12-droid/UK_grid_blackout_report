/** Exact teaching-model port of ZIP v2. Do not reinterpret thresholds as RoCoF relays. */
export const PARAMS = { f0: 50, S: 35e9, D: 600e6, K: 900e6, Tg: 15, initialLoss: 1378e6, extraLoss: 600e6, shedLoad: 1000e6, extraThreshold: 49.5, lfddThreshold: 48.8, dt: .02 };
export const PRESETS = [
  { id: '20', share: 20, H: 4 / (1 - .37) * (1 - .20), label: '较高惯量' },
  { id: '37', share: 37, H: 4, label: '基准情景' },
  { id: '56', share: 56, H: 4 / (1 - .37) * (1 - .56), label: '较低惯量' },
] as const;
export interface ModelEvent { time: number; kind: 'initial_loss' | 'extra_loss' | 'load_shed'; label: string }
export interface Simulation { H: number; time: number[]; frequency: number[]; rocof: number[]; imbalance_mw: number[]; events: ModelEvent[]; minimum: number; maxRocof: number; nadirTime: number; loadShedTime: number | null }
export function simulate(H = 4, duration = 200, dt = .02): Simulation {
  if (![H, duration, dt].every(Number.isFinite) || H <= 0 || duration <= 0 || dt <= 0) throw new Error('模型参数须为正的有限数');
  const steps = Math.round(duration / dt);
  if (steps < 1 || steps > 1e6) throw new Error('仿真步数超出范围');
  const step = duration / steps;
  const time = Array.from({ length: steps + 1 }, (_, i) => i * step);
  const frequency = new Array<number>(steps + 1), rocof = new Array<number>(steps + 1), imbalance_mw = new Array<number>(steps + 1);
  frequency[0] = 50; rocof[0] = 0; imbalance_mw[0] = -1378;
  let df = 0, governor = 0, imbalance = -PARAMS.initialLoss, extra = false, shed = false;
  const events: ModelEvent[] = [{ time: 0, kind: 'initial_loss', label: '初始缺额 1378 MW' }];
  const coefficient = PARAMS.f0 / (2 * H * PARAMS.S);
  for (let i = 0; i < steps; i++) {
    if (!extra && frequency[i] < PARAMS.extraThreshold) { imbalance -= PARAMS.extraLoss; extra = true; events.push({ time: time[i], kind: 'extra_loss', label: '假设额外脱网 600 MW' }); }
    if (!shed && frequency[i] < PARAMS.lfddThreshold) { imbalance += PARAMS.shedLoad; shed = true; events.push({ time: time[i], kind: 'load_shed', label: '假设减载 1000 MW' }); }
    governor += (-PARAMS.K * df - governor) / PARAMS.Tg * step;
    rocof[i + 1] = coefficient * (imbalance - PARAMS.D * df + governor);
    df += rocof[i + 1] * step;
    frequency[i + 1] = PARAMS.f0 + df;
    imbalance_mw[i + 1] = imbalance / 1e6;
  }
  const minimum = Math.min(...frequency);
  return { H, time, frequency, rocof, imbalance_mw, events, minimum, maxRocof: Math.max(...rocof.map(Math.abs)), nadirTime: time[frequency.indexOf(minimum)], loadShedTime: events.find(e => e.kind === 'load_shed')?.time ?? null };
}
export const BASELINE = simulate();
export const COMPARISONS = PRESETS.map(p => simulate(p.H));
