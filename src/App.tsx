import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, Download, Expand, FileText, GitBranch, Pause, Play, RotateCcw, SlidersHorizontal, X, Zap } from 'lucide-react';
import { ANALYSIS, GRAPH_NODES, REVIEWS, SOURCES, TIMELINE } from './data';
import { BASELINE, PARAMS, PRESETS, simulate } from './model';
import Chart from './Chart';
import Graph from './Graph';
import GridScene from './scenes/GridScene';
import { usePptScene } from './pptTimeline';
import { DEVICES, type DeviceId } from './scenes/sceneData';
import RollingClock, { formatEventTime } from './RollingClock';
import { SceneSwap, usePresentation, SLIDES } from './Presentation';

type Panel = 'model' | 'review' | 'sources' | 'help' | 'device' | null;
type Verification = { status: string; matlabVersion: string; frequencyMaxDifference: number; minimum: number; matlabRocof: number; pythonRocof: number; eventTimes: number[]; samples: { time: number; python: number; matlab: number }[] };
const fmt = (v: number, digits = 3) => v.toFixed(digits);

function SectionTitle({ number, english, title, children }: { number: string; english: string; title: string; children?: React.ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow"><span>{number}</span> {english}</p><h2>{title}</h2></div></div>;
}
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = dialog.current; const prior = document.activeElement as HTMLElement; el?.showModal(); const before = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { el?.close(); document.body.style.overflow = before; prior?.focus(); }; }, []);
  return <dialog ref={dialog} aria-label={title} className="modal" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="modal-inner"><div className="modal-heading"><div><p className="eyebrow">RESEARCH NOTES</p><h2>{title}</h2></div><button onClick={close} className="icon-button" aria-label="关闭面板" autoFocus><X /></button></div>{children}</div></dialog>;
}

export default function App() {
  const [panel, setPanel] = useState<Panel>(null), [intro, setIntro] = useState(true);
  const [sceneReplay,setSceneReplay] = useState(0), [sceneDevice,setSceneDevice] = useState<DeviceId>('line');
  const [event, setEvent] = useState(0), [timelinePlaying, setTimelinePlaying] = useState(false);
  const [graphStage, setGraphStage] = useState(0), [node, setNode] = useState('lightning');
  const [share, setShare] = useState(37), [preset, setPreset] = useState('37'), [compare, setCompare] = useState(false);
  const [cursor, setCursor] = useState(0), [playing, setPlaying] = useState(false), [windowSeconds, setWindowSeconds] = useState(20);
  const [analysis, setAnalysis] = useState(0), [verification, setVerification] = useState<Verification | null>(null), [verificationError, setVerificationError] = useState(false);
  const [imageView, setImageView] = useState<string | null>(null);
  const labRef = useRef<HTMLElement>(null);
  const timelineRail = useRef<HTMLDivElement>(null);
  const { deck, active, go } = usePresentation(Boolean(panel || imageView));
  const replayScene=usePptScene(event,sceneReplay,active==='timeline');
  const [metric, setMetric] = useState<'frequency' | 'rocof' | 'imbalance_mw'>('frequency');
  const H = 4 / (1 - .37) * (1 - share / 100);
  const result = useMemo(() => simulate(H), [H]);
  const index = Math.min(result.time.length - 1, Math.round(cursor / PARAMS.dt));
  const activeNode = GRAPH_NODES.find(n => n.id === node)!;
  const difference = (result.maxRocof / BASELINE.maxRocof - 1) * 100;
  useEffect(() => { const timer = window.setTimeout(() => setIntro(false), 1100); return () => clearTimeout(timer); }, []);
  useEffect(() => { fetch('./data/validation-summary.json').then(r => { if (!r.ok) throw new Error('missing'); return r.json(); }).then(setVerification).catch(() => setVerificationError(true)); }, []);
  useEffect(() => {
    if (!timelinePlaying) return;
    const timer = window.setInterval(() => setEvent(previous => { if (previous >= TIMELINE.length - 1) { setTimelinePlaying(false); return previous; } return previous + 1; }), 5600);
    return () => clearInterval(timer);
  }, [timelinePlaying]);
  useEffect(() => { setGraphStage(TIMELINE[event].graph); }, [event]);
  useEffect(() => {
    const rail=timelineRail.current;
    const button=rail?.querySelector<HTMLElement>(`[data-event-id="${TIMELINE[event].id}"]`);
    if(rail&&button){const left=button.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft-(rail.clientWidth-button.clientWidth)/2;rail.scrollTo({left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  },[event]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setCursor(t => { const next = Math.min(windowSeconds, t + (windowSeconds === 20 ? .1 : 1)); if (next >= windowSeconds) setPlaying(false); return next; }), 100);
    return () => clearInterval(timer);
  }, [playing, windowSeconds]);
  useEffect(() => {
    const listener = () => { if (document.hidden) { setPlaying(false); setTimelinePlaying(false); } };
    document.addEventListener('visibilitychange', listener); return () => document.removeEventListener('visibilitychange', listener);
  }, []);
  function selectEvent(n: number) { setTimelinePlaying(false); if(n===event)setSceneReplay(r=>r+1); setEvent(n); }
  function selectShare(value: number) { setShare(value); setPreset(PRESETS.find(p => p.share === value)?.id ?? 'custom'); setPlaying(false); setCursor(0); }
  function resetLab() { selectShare(37); setCompare(false); setWindowSeconds(20); setMetric('frequency'); }
  function exportCsv() {
    const rows = ['time_s,frequency_Hz,rocof_Hz_s,imbalance_MW', ...result.time.map((t, i) => `${t},${result.frequency[i]},${result.rocof[i]},${result.imbalance_mw[i]}`)];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `teaching-H${H.toFixed(2)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function openPanel(p: Panel) { setPlaying(false); setTimelinePlaying(false); setPanel(p); }
  useEffect(() => { if (active !== 'timeline') setTimelinePlaying(false); if (active !== 'lab') setPlaying(false); }, [active]);
  return <>
    <a href="#timeline" className="skip-link">跳到主要内容</a>
    {intro && <div className="intro-mask"><button onClick={() => setIntro(false)}>跳过开场 <ArrowRight size={15} /></button></div>}
    <header className="site-header"><a href="#top" className="brand" aria-label="失衡的50赫兹 首页"><Activity size={23} /><span>GRID<span className="brand-light"> / 50</span></span></a><nav aria-label="主要导航">{[["timeline","事故回放"],["lab","仿真实验"],["propagation","故障传播"],["analysis","原因与对策"]].map(([id,label]) => <a key={id} href={`#${id}`} className={active === id ? "nav-active" : ""} aria-current={active === id ? "page" : undefined}>{label}</a>)}</nav><a href="#resources" className={`nav-notes ${active === "resources" ? "nav-active" : ""}`} aria-current={active === "resources" ? "page" : undefined}><BookOpen size={16}/><span>资料与说明</span></a></header>
    <main ref={deck} className="presentation-deck" aria-label="整屏演示">
      <section className="hero slide is-active" id="top">
        <div className="hero-photo" /><div className="hero-shade" />
        <div className="hero-content wrap"><div className="hero-kicker"><span className="live-dot" /> 电气工程基础 · 翻转课堂 <span className="hero-case">CASE STUDY / 2019.08.09</span></div>
          <p className="eyebrow hero-eyebrow">THE FRAGILE BALANCE</p>
          <h1>当 <span className="hero-number">50<span className="hz">Hz</span></span><br/>失去平衡。</h1>
          <p className="hero-subtitle">是谁按下了英国的“暂停键”？</p><p className="hero-description">从一次雷击，走进电力系统的频率防线。<br/>复盘事故，观察传播，亲手改变惯量。</p>
          <div className="hero-actions"><a className="primary-button" href="#timeline">开始复盘 <ArrowRight size={18}/></a><a className="text-button" href="#lab">进入仿真实验 <ArrowUpRight size={18}/></a></div>

        </div>
        <div className="hero-index"><span>UK BLACKOUT</span><strong>08 / 09</strong><span>2019 · GREAT BRITAIN</span></div>
        <div className="hero-bottom wrap"><div><span className="stat-label">额定系统频率</span><strong>50<small> Hz</small></strong></div><div><span className="stat-label">低频减载门槛</span><strong>48.8<small> Hz</small></strong></div><div><span className="stat-label">事故复盘时间跨度</span><strong>45<small> min</small></strong></div><a href="#timeline" className="scroll-cue">探索事故全过程 <ArrowDown size={17}/></a></div>
      </section>

      <section className="section slide" id="timeline"><div className="slide-body wrap">
        <SectionTitle number="01" english="THE EVENT" title="45 分钟，逐幕复盘。">先看发生了什么。<br/>再问：一个局部故障，如何影响整个系统？</SectionTitle>
        <div className="timeline-layout"><div className="timeline-main"><RollingClock time={replayScene.time}/><SceneSwap value={event} className="event-content">{shown => <><p className="event-phase"><span className="live-dot"/>{TIMELINE[shown].phase}</p><h3>{TIMELINE[shown].title}</h3><p className="event-body">{TIMELINE[shown].body}</p></>}</SceneSwap><div className="playback"><button className="icon-button" disabled={event === 0} aria-label="上一事件" onClick={() => selectEvent(event - 1)}><ChevronLeft size={18}/></button><button className="outline-button" onClick={() => { if (!timelinePlaying && event === TIMELINE.length - 1) setEvent(0); setTimelinePlaying(!timelinePlaying); }}>{timelinePlaying ? <Pause size={16}/> : <Play size={16}/>} {timelinePlaying ? '暂停回放' : '播放事故'}</button><button className="icon-button" disabled={event === TIMELINE.length - 1} aria-label="下一事件" onClick={() => selectEvent(event + 1)}><ChevronRight size={18}/></button><button className="icon-button" aria-label="重置事故回放" onClick={() => selectEvent(0)}><RotateCcw size={16}/></button></div></div>
          <div className="timeline-scene"><GridScene variant="hybrid" phase={replayScene.scenePhase} eventState={replayScene.scene} eventKey={TIMELINE[event].id} integrated active={active==='timeline'} replay={sceneReplay} select={id=>{setSceneDevice(id);openPanel('device');}}/></div>
        </div>
        <div className="timeline-list">
          <button className={`timeline-item before-item ${event===0?'active':''}`} data-event-id="before" aria-pressed={event===0} onClick={()=>selectEvent(0)}><span className="timeline-time">BEFORE</span><span className="timeline-label">事故前 · 50 Hz</span></button>
          <div className="timeline-event-rail" ref={timelineRail} data-horizontal-scroll>{TIMELINE.slice(1).map((e,index)=>{const i=index+1;return <button key={e.id} data-event-id={e.id} title={e.sourceTime} onClick={()=>selectEvent(i)} className={`timeline-item ${event===i?'active':''} ${i<event?'past':''}`} aria-pressed={event===i}><span className="timeline-time">{e.endTime?`${e.time}–${e.endTime}`:formatEventTime(e.time)}</span><span className="timeline-label">{e.phase}</span></button>;})}</div>
        </div>
      </div></section>

      <section className="section lab-section slide" id="lab" ref={labRef}><div className="slide-body wrap">
        <SectionTitle number="02" english="THE FREQUENCY LAB" title="改变占比，观察频率。">同样的功率缺额，不同的响应速度。<br/>调节新能源占比，观察惯量与频率响应。</SectionTitle>
        <div className="lab-layout"><aside className="lab-controls"><h3>选择一组工况</h3><div className="preset-list">{PRESETS.map(p => <button key={p.id} className={`preset ${preset === p.id ? 'selected' : ''}`} onClick={() => selectShare(p.share)} aria-pressed={preset === p.id}><span><strong>{p.share}<small>%</small></strong><span>{p.label}</span></span><span className="preset-h">H = {p.H.toFixed(2)} s</span></button>)}</div>
          <div className="inertia-control"><label htmlFor="renewable-share">新能源占比 <span>{preset === 'custom' ? '自定义' : '预设'}</span></label><div className="inertia-value"><output htmlFor="renewable-share" data-testid="share-value">{share.toFixed(0)}</output><span>%</span></div><input id="renewable-share" type="range" min="0" max="70" step="1" value={share} onChange={e => selectShare(Number(e.target.value))} aria-valuetext={`${share}%`}/><div className="range-endpoints"><span>0%</span><span>70%</span></div><div className="derived-inertia">对应 H = <output data-testid="inertia-value">{H.toFixed(2)}</output> s</div></div>
          <label className="toggle"><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}/><span className="toggle-track"/><span>叠加三组原始情景</span></label><button className="reset-button" onClick={resetLab}><RotateCcw size={14}/> 恢复基准</button>
        </aside><div className="lab-output"><div className="metrics"><div><span>最低频率</span><strong data-testid="minimum">{fmt(result.minimum)}<small> Hz</small></strong><em>t = {result.nadirTime.toFixed(2)} s</em></div><div><span>最大 |RoCoF|</span><strong data-testid="rocof">{fmt(result.maxRocof)}<small> Hz/s</small></strong><em>{Math.abs(difference) < .001 ? '基准情景' : `较基准 ${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`}</em></div><div><span>低频减载时刻</span><strong data-testid="shed-time">{result.loadShedTime === null ? '未触发' : result.loadShedTime.toFixed(2)}<small>{result.loadShedTime === null ? '' : ' s'}</small></strong><em>门槛 f &lt; 48.8 Hz</em></div></div>
          <div className="chart-heading"><div className="metric-tabs" role="tablist" aria-label="曲线类型">{([['frequency','频率'],['rocof','RoCoF'],['imbalance_mw','功率缺额']] as const).map(([id,label]) => <button key={id} role="tab" aria-selected={metric === id} onClick={() => setMetric(id)} className={metric === id ? 'active' : ''}>{label}</button>)}</div><div className="chart-tools"><button className={windowSeconds === 20 ? 'active' : ''} onClick={() => { setWindowSeconds(20); setCursor(0); setPlaying(false); }}>前 20 秒</button><button className={windowSeconds === 200 ? 'active' : ''} onClick={() => { setWindowSeconds(200); setPlaying(false); }}>完整 200 秒</button><button aria-label="展开仿真区域" onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else labRef.current?.requestFullscreen?.().catch(() => {}); }}><Expand size={15}/></button></div></div>
          {compare && metric === 'frequency' && <div className="comparison-legend"><span>··· 20% 情景</span><span>— — 37% 情景</span><span>··· 56% 情景</span><span className="accent">━ 当前 H</span></div>}
          <Chart result={result} compare={compare} cursor={cursor} windowSeconds={windowSeconds} metric={metric}/>
          <div className="chart-playback"><button className="icon-button" aria-label={playing ? '暂停仿真回放' : '播放仿真回放'} onClick={() => { if (!playing && cursor >= windowSeconds) setCursor(0); setPlaying(!playing); }}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button><input type="range" aria-label="仿真时间" min="0" max={windowSeconds} step="0.02" value={cursor} onChange={e => { setPlaying(false); setCursor(Number(e.target.value)); }}/><output data-testid="cursor-time">{cursor.toFixed(2)} s</output></div>
          <div className="cursor-readings"><span>光标读数</span><strong>{fmt(result.frequency[index])}<small> Hz</small></strong><strong>{fmt(result.rocof[index])}<small> Hz/s</small></strong><strong>{result.imbalance_mw[index].toFixed(0)}<small> MW</small></strong></div>
          <div className="model-events">{result.events.map(e => <button key={e.kind} onClick={() => { setCursor(e.time); setPlaying(false); }}><span>{e.time.toFixed(2)} s</span>{e.label}</button>)}</div>
          <div className="chart-bottom"><button onClick={exportCsv}><Download size={14}/> 导出当前数据</button></div>
        </div></div>
      </div></section>

      <section className="section section-tinted slide" id="propagation"><div className="slide-body wrap">
        <SectionTitle number="03" english="THE CASCADE" title="故障，如何被放大？">沿着有功功率的失衡追踪传播。<br/>点击节点，查看背后的电气机理。</SectionTitle>
        <div className="graph-toolbar"><div className="stage-buttons" aria-label="传播阶段">{['触发', '电源损失', '频率下降', '级联放大', '减载', '止跌'].map((name, i) => <button key={name} onClick={() => setGraphStage(i)} aria-pressed={graphStage === i} className={graphStage === i ? 'active' : ''}><span>0{i + 1}</span>{name}</button>)}</div></div>
        <Graph stage={graphStage} selected={node} onSelect={setNode}/>
        <SceneSwap value={node} className="node-detail">{shown => <><GitBranch size={20}/><strong>{GRAPH_NODES.find(n => n.id === shown)!.label}</strong><p>{GRAPH_NODES.find(n => n.id === shown)!.detail}</p></>}</SceneSwap>
      </div></section>

      <section className="section slide" id="analysis"><div className="slide-body wrap"><SectionTitle number="04" english="LESSONS & DEFENCES" title="看清原因，才知道如何防范。">把事故拆成三个层次，<br/>将每个问题落到对应的防御措施。</SectionTitle><div className="analysis-layout"><div className="analysis-tabs" role="tablist" aria-label="原因层次">{ANALYSIS.map((a, i) => <button key={a.title} role="tab" aria-selected={analysis === i} aria-controls="analysis-content" id={`analysis-tab-${i}`} onClick={() => setAnalysis(i)} className={analysis === i ? 'active' : ''}><span>0{i + 1}</span>{a.title}<ArrowUpRight size={20}/></button>)}</div><div role="tabpanel" id="analysis-content" aria-labelledby={`analysis-tab-${analysis}`}><SceneSwap value={analysis} className="analysis-content">{shown => <><p className="eyebrow">{ANALYSIS[shown].english}</p><h3>{ANALYSIS[shown].heading}</h3><p>{ANALYSIS[shown].body}</p><div className="measure-list">{ANALYSIS[shown].measures.map(m => <div key={m}><span><Check size={15}/></span>{m}</div>)}</div><a href="#propagation" className="text-button" onClick={() => setGraphStage(ANALYSIS[shown].graph)}>回到对应传播环节 <ArrowRight size={16}/></a></>}</SceneSwap></div></div></div></section>

      <section className="section slide resources-slide" id="resources"><div className="slide-body wrap">
        <p className="eyebrow">FURTHER EXPLORATION</p><h2>守住每一赫兹，<br/><span>也守住日常。</span></h2>
        <div className="resource-links">
          <button onClick={() => openPanel('model')}><Activity/><strong>模型与 MATLAB</strong><ArrowUpRight size={18}/></button>
          <button onClick={() => openPanel('sources')}><FileText/><strong>资料与成果</strong><ArrowUpRight size={18}/></button>
          <button onClick={() => openPanel('help')}><BookOpen/><strong>使用说明</strong><ArrowUpRight size={18}/></button>
          <button onClick={() => openPanel('review')}><GitBranch/><strong>草稿核对</strong><ArrowUpRight size={18}/></button>
        </div>
        <footer><a className="brand" href="#top"><Activity size={18}/> GRID / 50</a><span>电气工程基础 · 第 17 / 18 组课题</span><a href="#top" className="text-button">返回首页 <ArrowUpRight size={16}/></a></footer>
      </div></section>
    </main>
    <div className="page-controls" aria-label="翻页控制"><button className="icon-button" aria-label="上一屏" disabled={active === 'top'} onClick={() => go(SLIDES[Math.max(0,SLIDES.indexOf(active)-1)])}><ChevronLeft size={17}/></button><span>{String(SLIDES.indexOf(active)+1).padStart(2,'0')} / 06</span><button className="icon-button" aria-label="下一屏" disabled={active === 'resources'} onClick={() => go(SLIDES[Math.min(5,SLIDES.indexOf(active)+1)])}><ChevronRight size={17}/></button></div>

    {panel && <Modal title={{ model: '模型与交叉验证', review: '草稿核对清单', sources: '资料与成果来源', help: '主讲操作说明', device: DEVICES[sceneDevice].title }[panel]} close={() => setPanel(null)}>
      {panel === 'device' && <p className="modal-lead">{DEVICES[sceneDevice].description}</p>}
      {panel === 'review' && <><p className="modal-lead">原文件保持不变。以下差异在草稿阶段显式标出，正式展示前由小组确认口径。移除审阅标记不等于移除模型假设说明。</p>{REVIEWS.map((r, i) => <article className="review-item" key={r.title}><span className="eyebrow">REVIEW 0{i + 1}</span><h3>{r.title}</h3><dl><dt>原成果</dt><dd>{r.original}</dd><dt>核对发现</dt><dd>{r.finding}</dd><dt>草稿处理</dt><dd>{r.treatment}</dd></dl></article>)}</>}
      {panel === 'sources' && <><p className="modal-lead">主讲回放按新版PPT第7页四阶段呈现，报告细节保留在核对资料中。时钟按PPT分钟尺度补 :00；恢复供电阶段将17:06至17:37压缩为一次亮灯演示，非实时录像。原教学模型单独保留。外部原文需联网，网站核心操作不依赖这些链接。</p><div className="source-list">{SOURCES.map(s => <article key={s.name}><FileText size={20}/><div><h3>{s.name}</h3><p>{s.detail}</p></div>{s.url && <a href={s.url} target="_blank" rel="noreferrer" aria-label={`打开${s.name}`}><ArrowUpRight size={20}/></a>}</article>)}</div><h3>程序与复算图</h3><div className="download-grid">{[['blackout_analysis.py','第二版 Python 源码'],['uk_blackout_freq.m','原始 MATLAB 脚本'],['simulation.png','Python 仿真图'],['sensitivity.png','敏感性分析图'],['timeline.png','第二版时间线图'],['propagation.png','第二版传播图'],['simulink_block.png','模型结构示意'],['matlab-frequency.png','MATLAB 实际复算图']].map(([file, label]) => <a href={`./results/${file}`} key={file} download><Download size={16}/>{label}</a>)}</div><h3>图片与字体</h3><p>风电与输电设施图片来自 Unsplash，均为主题配图，不表示英国事故现场。图片已随站点保存。数字字体 Barlow Condensed 以 OFL 许可随站点打包，中文采用本地系统字体。</p><a className="text-button" href="./素材与来源.md" target="_blank">查看素材来源记录 <ArrowUpRight size={14}/></a></>}
      {panel === 'help' && <><p className="modal-lead">建议主讲先完成下面的六步，再让同学自由探索。无需登录，数据在浏览器本地计算。</p><ol className="help-steps"><li><strong>复盘事件</strong><p>点击时间节点，或播放逐步回放。暂停后解释当前阶段；真实事故时钟与实验时间不共用。</p></li><li><strong>追踪传播</strong><p>依次选择传播阶段，点击“有功功率缺额”“额外电源脱网”“低频减载”，说明放大与止跌两条路径。</p></li><li><strong>比较三组情景</strong><p>先看 37% 基准，再切到 20% 和 56%。注意 RoCoF 与触发减载用时变化；百分比是教学映射。</p></li><li><strong>调整新能源占比</strong><p>拖动新能源占比滑块，H 按原模型关系自动换算：H = 4 / 0.63 × (1 − 占比)。该关系为教学假设，其他模型参数不变。打开“三组原始情景”叠加，使用时间滑块读取频率、变化率和功率。</p></li><li><strong>展示验证依据</strong><p>到末页打开“模型与 MATLAB”，展示方程、参数、独立复算曲线与误差。框图是结构示意。</p></li><li><strong>回到对策</strong><p>按直接诱因、系统隐患、防御短板切换讲解。最后点击“恢复基准”，方便下一位同学操作。</p></li></ol><a className="outline-button" href="./使用说明.html" target="_blank" rel="noreferrer">打开完整使用说明 <ArrowUpRight size={16}/></a><p className="muted">手机上的传播图可横向滑动。所有操作支持鼠标或触控；按钮可用 Tab 定位、Enter 激活，弹窗按 Esc 关闭。关闭页面不会保存实验状态。</p></>}
      {panel === 'model' && <><p className="modal-lead">把系统等值为单机频率响应模型。它用于解释功率缺额、惯量、一次调频与减载的关系，不是对真实事故逐秒轨迹的拟合。</p><div className="equations"><p><span>摆动方程</span><strong>(2HS / f₀) · dΔf/dt = P<sub>imb</sub> − DΔf + P<sub>gov</sub></strong></p><p><span>一次调频</span><strong>dP<sub>gov</sub>/dt = (−KΔf − P<sub>gov</sub>) / T<sub>g</sub></strong></p></div><div className="parameter-grid">{[['f₀','50 Hz'],['S','35 GW'],['D','600 MW/Hz'],['K','900 MW/Hz'],['Tg','15 s'],['dt','0.02 s'],['初始缺额','1378 MW'],['额外脱网','600 MW'],['减载量','1000 MW'],['默认 H','4.0 s']].map(([k,v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><p>每一步先判断事件，再更新调速器，最后计算 RoCoF 和频率。49.5 Hz 触发额外脱网、48.8 Hz 触发减载；图上的 ±0.125 Hz/s 不参与事件判断。</p>
        <h3 className="subheading">Python × MATLAB：真实运行对照</h3>{verification ? <><div className="validation-badge"><Check size={17}/>已复算 · MATLAB {verification.matlabVersion}</div><div className="verification-table"><table><thead><tr><th>比较项</th><th>Python</th><th>MATLAB</th></tr></thead><tbody><tr><td>最低频率 / Hz</td><td>{BASELINE.minimum.toFixed(9)}</td><td>{verification.minimum.toFixed(9)}</td></tr><tr><td>最大 |RoCoF| / Hz/s</td><td>{verification.pythonRocof.toFixed(6)}</td><td>{verification.matlabRocof.toFixed(6)}</td></tr><tr><td>频率逐点最大差 / Hz</td><td colSpan={2}>{verification.frequencyMaxDifference.toExponential(3)}</td></tr></tbody></table></div><p className="muted">频率对照为 0–120 s、6001 个采样点。MATLAB 用 gradient 求 RoCoF，Python 记录离散更新导数，二者不宜直接要求逐点完全相同。同模型一致性不是实测验证。</p></> : <p>{verificationError ? '未能加载验证文件，请查看 validation 目录。' : '读取验证记录中…'}</p>}
        <div className="figure-grid"><button onClick={() => setImageView('matlab-frequency.png')}><img src="./results/matlab-frequency.png" alt="原始 MATLAB 脚本实际运行得到的频率曲线"/><span>MATLAB 原脚本复算 <Expand size={14}/></span></button><button onClick={() => setImageView('simulink_block.png')}><img src="./results/simulink_block.png" alt="由原程序绘制的模型结构框图，不是已运行的Simulink模型"/><span>模型结构示意 · 非 Simulink 运行结果 <Expand size={14}/></span></button></div><details><summary>查看原程序复算图与数值表</summary><img className="full-figure" src="./results/sensitivity.png" alt="原第二版程序绘制的敏感性分析图，包含待核对的历史标签"/><p className="muted">原图未改动，保留了“英国／西班牙”的情景标签。其适用边界见草稿核对清单。</p>{verification && <table><thead><tr><th>时间 / s</th><th>Python / Hz</th><th>MATLAB / Hz</th></tr></thead><tbody>{verification.samples.map(s => <tr key={s.time}><td>{s.time}</td><td>{s.python.toFixed(6)}</td><td>{s.matlab.toFixed(6)}</td></tr>)}</tbody></table>}</details><details><summary>模型边界与 ANSYS 检查</summary><p>未模拟网络潮流、线路热过载、真实继电器延时、二次调频或用户复电。保护级联是频率门槛驱动的教学情景。</p><p>本机已找到 ANSYS Electronics Desktop / Maxwell 环境及其他电磁工程；本次成果中未提供有对应雷击波形、材料和边界条件的事故工程，因此未新增设备仿真。软件安装不等于完成验证。</p></details><button className="text-button" onClick={() => { setPanel('review'); }}>查看需要确认的结果口径 <ArrowRight size={15}/></button></>}
    </Modal>}
    {imageView && <Modal title="原程序输出图" close={() => setImageView(null)}><img className="full-figure" src={`./results/${imageView}`} alt="原程序运行输出，点击关闭返回模型验证"/></Modal>}
  </>;
}
