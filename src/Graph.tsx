import { GRAPH_NODES } from './data';
const EDGES = [
  { from: 0, to: 1, d: 'M184 211 H202 V98 H222', stage: 1 },
  { from: 0, to: 2, d: 'M184 211 H222', stage: 1 },
  { from: 0, to: 3, d: 'M184 211 H202 V324 H222', stage: 1 },
  { from: 1, to: 4, d: 'M382 98 H404 V211 H426', stage: 2 },
  { from: 2, to: 4, d: 'M382 211 H426', stage: 2 },
  { from: 3, to: 4, d: 'M382 324 H404 V211 H426', stage: 2 },
  { from: 4, to: 5, d: 'M586 211 H630', stage: 2 },
  { from: 5, to: 6, d: 'M710 175 V108', stage: 3 },
  { from: 6, to: 4, d: 'M630 72 H506 V175', stage: 3, feedback: true },
  { from: 5, to: 7, d: 'M790 211 H828', stage: 4 },
  { from: 7, to: 8, d: 'M908 247 V288', stage: 5 },
];
export default function Graph({ stage, selected, onSelect }: { stage: number; selected: string; onSelect: (id: string) => void }) {
  return <div className="graph-scroll"><svg viewBox="0 0 1012 402" className="graph" aria-label="可交互故障传播概念图，不是实际电网拓扑">
    <defs><marker id="arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#56ccf2" /></marker><marker id="arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#365267" /></marker></defs>
    <text x="24" y="28" className="graph-column">触发</text><text x="222" y="28" className="graph-column">电源响应</text><text x="426" y="28" className="graph-column">系统影响</text><text x="828" y="28" className="graph-column">防御</text>
    {EDGES.map((e, i) => <path key={i} d={e.d} fill="none" stroke={stage >= e.stage ? '#56ccf2' : '#365267'} strokeWidth={e.feedback ? 2 : 1.5} strokeDasharray={e.feedback ? '6 5' : undefined} markerEnd={`url(#arrow-${stage >= e.stage ? 'lit' : 'dim'})`} className={stage >= e.stage ? 'edge-lit' : ''} />)}
    <text x="540" y="59" className="feedback-label">缺额放大</text>
    {GRAPH_NODES.map(n => <g key={n.id} transform={`translate(${n.x},${n.y})`} tabIndex={0} role="button" aria-label={`${n.label}：查看解释`} aria-pressed={selected === n.id} onClick={() => onSelect(n.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(n.id); } }} className={`graph-node ${stage >= n.stage ? 'lit' : ''} ${selected === n.id ? 'selected' : ''}`}>
      <rect width="160" height="72" rx="5" /><text x="80" y="30" textAnchor="middle" className="node-title">{n.label}</text><text x="80" y="51" textAnchor="middle" className="node-sub">{n.sub}</text>
    </g>)}

  </svg></div>;
}
