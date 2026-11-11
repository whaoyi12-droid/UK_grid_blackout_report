import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Download, Eye, Layers, Pause, Play, RotateCcw, X } from 'lucide-react';
import '@fontsource/barlow-condensed/latin-600.css';
import GridScene from './GridScene';
import { DEVICES, PHASES, STYLES, type DeviceId, type SceneStyle } from './sceneData';
import './scene.css';

function Preview() {
  const [variant,setVariant]=useState<SceneStyle>('line'),[phase,setPhase]=useState(0),[playing,setPlaying]=useState(false);
  const [labels,setLabels]=useState(true),[motion,setMotion]=useState(true),[compare,setCompare]=useState(false),[background,setBackground]=useState(false),[replay,setReplay]=useState(0);
  const [selected,setSelected]=useState<DeviceId|null>(null),[notes,setNotes]=useState(false),[notice,setNotice]=useState('');
  const canvasHost=useRef<HTMLDivElement>(null),guide=useRef<HTMLDialogElement>(null);
  const state=PHASES[phase],style=STYLES.find(s=>s.id===variant)!;
  useEffect(()=>{ if(!playing) return; const timer=setInterval(()=>setPhase(p=>{if(p>=PHASES.length-1){setPlaying(false);return p;}return p+1;}),5600);return()=>clearInterval(timer);},[playing]);
  useEffect(()=>{const pause=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
  useEffect(()=>{if(notes)guide.current?.showModal();else guide.current?.close();},[notes]);
  function pickPhase(next:number){setPlaying(false);if(next===phase)setReplay(r=>r+1);setPhase(next);}
  function download() {
    const svg=canvasHost.current?.querySelector<SVGSVGElement>('svg.grid-scene');if(!svg)return;
    const clone=svg.cloneNode(true) as SVGSVGElement;clone.setAttribute('width','1400');clone.setAttribute('height','660');
    clone.querySelectorAll('[tabindex]').forEach(el=>{el.removeAttribute('tabindex');el.removeAttribute('role');});
    const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`grid-${variant}-${state.id}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice('SVG 已导出，可在浏览器打开；包含当前阶段的示意动画。');
  }
  return <div className="preview-app"><header className="preview-header"><a href="./index.html#timeline" className="back"><ArrowLeft size={17}/> 返回事故回放</a><a href="./scene.html" className="preview-brand"><Activity size={20}/> GRID / SCENES</a><button onClick={()=>setNotes(true)}>设计与资料依据 <ArrowRight size={15}/></button></header>
    <main><div className="preview-heading"><div><p className="kicker">2D GRID STUDY / THREE DIRECTIONS</p><h1>让事故阶段，<span>一眼可见。</span></h1></div><p>同一套设备与事件逻辑，三种视觉表达。<br/>保留原三案对比，主站采用 A+C。</p></div>
      <div className="style-options" role="tablist" aria-label="视觉方案">{STYLES.map(s=><button key={s.id} role="tab" aria-selected={variant===s.id} onClick={()=>{setVariant(s.id);setReplay(r=>r+1);setNotice('');}} className={variant===s.id?'chosen':''}><span className="option-code">{s.code}</span><span><strong>{s.name}</strong><small>{s.subtitle}</small></span><span className="option-dot">{variant===s.id&&<Check size={13}/>}</span></button>)}</div>
      <div className="preview-toolbar"><div className="stage-name"><span className="stage-dot"/><span>{state.time}</span><strong>{state.name}</strong></div><div className="toolbar-actions"><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/>设备名称</label><label><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/>场景动效</label><button className={background?'selected':''} onClick={()=>{setBackground(!background);setCompare(false);}}><Eye size={15}/>背景试放</button><button className={compare?'selected':''} onClick={()=>{setCompare(!compare);setBackground(false);}}><Layers size={15}/>三案同屏</button></div></div>
      {compare?<div className="compare-grid">{STYLES.map(s=><article key={s.id}><div className="compare-caption"><strong>{s.code} / {s.name}</strong><button onClick={()=>{setVariant(s.id);setCompare(false);}}>单独查看 <ArrowRight size={14}/></button></div><GridScene variant={s.id} phase={phase} motion={motion} labels={false} replay={replay}/><p>{s.description}</p></article>)}</div>:<div className={`scene-canvas ${background?'as-background':''}`} ref={canvasHost}>
        <GridScene key={variant} variant={variant} phase={phase} motion={motion} labels={labels&&!background} replay={replay} select={background?undefined:setSelected}/>
        {background&&<div className="background-caption"><p>01 / THE EVENT</p><strong className="overlay-clock">{state.time==='事故前'?'50 Hz':state.time}</strong><h2>{state.title}</h2><p>{state.description}</p></div>}
        <div className="scene-caption"><span>{style.code} / {style.name}</span><span>教学示意 · 非真实接线与规模比例</span></div>
      </div>}
      <div className="stage-controls"><div className="play-controls"><button aria-label="上一阶段" disabled={phase===0} onClick={()=>pickPhase(phase-1)}><ChevronLeft size={18}/></button><button className="play-button" onClick={()=>{if(!playing&&phase===6)setPhase(0);setPlaying(!playing);}}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'暂停演示':'播放全过程'}</button><button aria-label="下一阶段" disabled={phase===6} onClick={()=>pickPhase(phase+1)}><ChevronRight size={18}/></button><button onClick={()=>{setPlaying(false);setReplay(r=>r+1);}}><RotateCcw size={15}/>重放当前动作</button></div><button onClick={download} disabled={compare}><Download size={15}/>导出当前 SVG</button></div>
      <div className="phase-selector" aria-label="事故阶段">{PHASES.map((p,i)=><button key={p.id} className={phase===i?'selected':''} aria-pressed={phase===i} onClick={()=>pickPhase(i)}><span>{i===0?'BEFORE':p.time}</span><strong>{p.name}</strong></button>)}</div>
      <div className="scene-explanation" aria-live="polite"><div><p className="kicker">{selected?'DEVICE DETAIL':'WHAT CHANGES'}</p><h2>{selected?DEVICES[selected].title:state.title}</h2></div><p>{selected?DEVICES[selected].description:state.description}</p>{selected?<button onClick={()=>setSelected(null)} aria-label="关闭设备说明"><X size={18}/></button>:<div className="lighting-key"><span><i className="lit-key"/>供电</span><span><i/>切除</span></div>}</div>
      {notice&&<p role="status" className="download-notice">{notice}</p>}
      <div className="design-comment"><p><strong>{style.name}</strong> / {style.description}</p><p>可点击设备查看含义。所有方案在本机实现，无需额外专业软件。</p></div>
    </main>
    <footer><span>GRID / 50 · 独立方案预览</span><span>原三案对比 · 主站采用 A+C，数值模型未变更。</span><a href="./index.html#timeline">返回网站 <ArrowRight size={14}/></a></footer>
    <dialog ref={guide} onCancel={e=>{e.preventDefault();setNotes(false);}} onClick={e=>{if(e.target===e.currentTarget)setNotes(false);}}><div className="notes-header"><h2>场景设计与资料依据</h2><button onClick={()=>setNotes(false)} aria-label="关闭资料说明"><X/></button></div><p>三个方案均为可控 SVG 分层模型。线稿重在结构，像素重在识别，夜景重在氛围。采用相同事件状态，便于直接比较。</p><h3>设备与阶段</h3><ul><li>风电场、变流器、燃气电站、分布式电源、架空输电线路、变电站、母线、开关和负荷支路。</li><li>雷击后线路故障由保护快速清除，约 20 秒后恢复运行。画面压缩为一次短时扰动动画。</li><li>风电出力损失不等于风轮瞬时停转；因此风轮保持旋转，并网通道减弱。</li><li>低频减载用配电支路断开表现，保留供电的支路一直点亮。</li><li>16:57 系统趋稳时，减载支路仍保持熄灭；17:06 逐步亮起，17:37 用户供电恢复。</li></ul><h3>哪些是示意</h3><p>线路振动、灯光波动、设备布置、建筑比例和 A/B 恢复顺序均为教学表达，不是实测或真实接线。线路振动不代表发生断线。没有加入无依据的抢修人员、倒塔、设备爆炸或特定逆变器操作。</p><p>风电支路保留弱输出，表示出力骤降而非全场物理消失。燃气机组和分布式电源以聚合图标表示。末态不假设故障电源均已修复，供电可由剩余电源与调度支撑。</p><p>分钟级时间补 :00 是统一显示格式；秒级节点沿用草稿资料，仍属于原网站待核对项。</p><h3>原始资料</h3><a href="https://www.ofgem.gov.uk/sites/default/files/docs/2019/09/eso_technical_report_-_final.pdf" target="_blank" rel="noreferrer">National Grid ESO · 9 August 2019 Technical Report ↗</a><p>参考报告摘要及事故过程章节（PDF 第 3–4 页与第 10–15 页），结合本组既有时间线。原报告里的失电规模与阶段细节不由插画比例表达。</p><h3>操作</h3><p>选择 A/B/C；点选阶段；用“重放当前动作”观察雷击或复电。勾选“场景动效”可暂停持续运动。背景试放用于比较原三案的文字融合位置；正式回放已采用 A+C 组合。SVG 导出保存当前方案与阶段，可直接在浏览器打开。</p></dialog>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Preview/></React.StrictMode>);
