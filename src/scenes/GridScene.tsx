import { useEffect, useId, useState, type CSSProperties } from 'react';
import { PHASES, type DeviceId, type SceneStyle } from './sceneData';
import type { EventSceneState } from '../incidentTimeline';

export const SCENE_CSS = `
.grid-scene{--ink:#d8e4eb;--dim:#60788b;--fill:#102b3e;--ground:#102739;--soft:#254357;--light:#fff0b0;background:#0a1e2f;color:var(--ink)}
.grid-scene .outline{fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.grid-scene .metal{fill:var(--fill);stroke:var(--ink);stroke-width:2;stroke-linejoin:round}
.grid-scene .detail{fill:none;stroke:var(--dim);stroke-width:1.2}
.grid-scene .solid{fill:var(--ink);stroke:none}.grid-scene .muted-solid{fill:var(--dim);stroke:none}
.grid-scene .land{fill:var(--ground)}.grid-scene .skyline{fill:var(--soft);opacity:.35}
.grid-scene .wire{fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round;transition:opacity .8s}
.grid-scene .feeder{fill:none;stroke:var(--ink);stroke-width:2;opacity:.8;transition:opacity .8s}
.grid-scene .flow{fill:none;stroke:#fff;stroke-width:2.5;stroke-dasharray:4 24;animation:power-flow 2.5s linear infinite;opacity:.65}
.grid-scene .disconnected .flow,.grid-scene .disconnected.flow{opacity:0!important;animation:none!important}.grid-scene .disconnected .feeder{opacity:.22}
.grid-scene .reduced-feed .flow{opacity:0!important;animation:none!important}.grid-scene .reduced-feed .feeder{opacity:.36}
.grid-scene .rotor{animation:rotor-turn 10s linear infinite}.grid-scene .rotor-slow{animation-duration:15s}
.grid-scene .device{cursor:pointer;outline:none}.grid-scene .device:focus-visible>.hit,.grid-scene .device:hover>.hit{fill:#ffffff08;stroke:#ffffff75;stroke-width:1;stroke-dasharray:4 5}
.grid-scene .hit{fill:transparent;stroke:transparent;rx:8}
.grid-scene text{font-family:'Microsoft YaHei','PingFang SC',sans-serif;fill:var(--ink);font-size:14px;letter-spacing:.3px}
.grid-scene .sub-label{fill:#8fa6b7;font-size:11px}.grid-scene .equipment-label{font-size:12px;fill:#d0dce5}
.grid-scene .window{fill:#294254;stroke:#7892a340;stroke-width:.6;transition:fill 1s,opacity 1s;opacity:.5}
.grid-scene .powered .window{fill:var(--light);stroke:none;opacity:1}
.grid-scene .lamp-light{fill:#ffe6a6;opacity:0;transition:opacity 1s}
.grid-scene .powered .lamp-light{opacity:.95}.grid-scene .lamp-halo{fill:#ffe6a6;opacity:0;transition:opacity 1.2s}
.grid-scene .powered .lamp-halo{opacity:.07}
.grid-scene .switch-arm{stroke:var(--ink);stroke-width:3;transform-box:fill-box;transform-origin:0 50%;transition:transform .65s cubic-bezier(.3,.7,.3,1)}
.grid-scene .switch-open .switch-arm{transform:rotate(-34deg)}
.grid-scene .trip-indicator{fill:#465c6a;transition:fill .5s}.grid-scene .relay-active .trip-indicator{fill:#fff0b0}
.grid-scene .relay-ring{fill:none;stroke:#fff0b0;stroke-width:2;opacity:0}.grid-scene .relay-active .relay-ring{animation:relay-ping 1.8s ease-out 2}
.grid-scene .fault-flash{opacity:0;animation:fault-flash 1.25s ease-out 1}
.grid-scene .fault-wire{animation:wire-jolt .8s ease-out 1;transform-origin:center}
.grid-scene .restore-lights.powered .window{animation:light-restore 1.5s both;animation-delay:var(--light-delay,0s)}
.grid-scene .flicker.powered .window{animation:load-flicker 1.7s ease-out 1}
.grid-scene .response-on{animation:response-light 2s ease-in-out infinite}
.grid-scene .support-status{fill:#526c7e}.grid-scene .responding .support-status{fill:#cce8d7}
.grid-scene .outline-cloud{fill:none;stroke:var(--dim);stroke-width:1;opacity:.5}
.grid-scene .horizon-detail{display:none}.grid-scene .label-back{fill:#0a1e2fcc}
.grid-scene.scene-pixel{--ink:#e0e5e7;--dim:#7a858f;--fill:#d6dce0;--ground:#111e29;--soft:#5b6874;--light:#fff6c5;background:#0c1926;shape-rendering:crispEdges}
.scene-pixel .metal{stroke:#e0e5e7;stroke-width:2;stroke-linejoin:miter}.scene-pixel .outline{stroke-linejoin:miter;stroke-linecap:square;stroke-width:3}
.scene-pixel .detail{stroke:#2e3c49;stroke-width:2}.scene-pixel .window{fill:#152737;opacity:1;stroke:none}.scene-pixel .powered .window{fill:#ffeab6}
.scene-pixel .rotor{animation-timing-function:steps(18)}.scene-pixel .flow{stroke-dasharray:7 22;animation-timing-function:steps(20)}
.scene-pixel .lamp-halo{display:none}.scene-pixel .switch-arm{stroke:#fff;stroke-width:4}.scene-pixel .label-back{fill:#0c1926}
.grid-scene.scene-layered{--ink:#c4d2dc;--dim:#75899a;--fill:#334b5d;--ground:#172f41;--soft:#385064;--light:#ffe4a4;background:#0c2031}
.scene-layered .metal{stroke:#718c9e;stroke-width:1.2}.scene-layered .outline{stroke-width:1.6}.scene-layered .skyline{opacity:.65}.scene-layered .horizon-detail{display:block}
.scene-layered .powered .window{filter:drop-shadow(0 0 3px #ffe4a4)}.scene-layered .powered .lamp-halo{opacity:.13}
.grid-scene.scene-hybrid{--ink:#dce9f1;--dim:#8197a8;--fill:#163145;--ground:#122b3d;--soft:#365066;--light:#ffe8ad;background:#0b2235}
.scene-hybrid .horizon-detail{display:block}.scene-hybrid .skyline{opacity:.53}.scene-hybrid .metal{stroke-width:2.2}.scene-hybrid .powered .window{filter:drop-shadow(0 0 2px #ffe4a480)}.scene-hybrid .powered .lamp-halo{opacity:.12}
.grid-scene .line-isolated .wire{stroke:#596b7b;opacity:.45}.grid-scene .line-isolated .flow{animation:none!important;opacity:0!important}.grid-scene .wire{transition:opacity .8s,stroke .8s}
.grid-scene .gas-trip-ring{fill:#0a1e2f99;stroke:#ffe8ad;stroke-width:3;opacity:0}.grid-scene .gas-trip .gas-trip-ring{animation:gas-focus 2.8s ease-out both}
.grid-scene .gas-trip .switch-arm{stroke:#fff0bd;stroke-width:5}.grid-scene .trip-label{fill:#ffe8ad;font-size:17px;font-weight:600}
.grid-scene .gas-trip .trip-label{animation:gas-label 3s ease-out both}
.grid-scene .frequency-recovery .wire{animation:frequency-recover 3s ease-in-out 1}.grid-scene .frequency-recovery .flow{stroke:#fff4c6;stroke-width:3.5}
.grid-scene .support-aura{fill:none;stroke:#f1edcb;stroke-width:3;opacity:0}.grid-scene .stability-recovery .support-aura{animation:support-recover 3s ease-out 1}
.grid-scene .stability-recovery .support-status{animation:support-signal 3s ease-out 1;fill:#fff3bf}
.grid-scene .recovery-caption{fill:#d9eee9;font-size:17px;animation:gas-label 3.5s ease-out both}
.grid-scene.scene-inactive *{animation-play-state:paused!important}
.grid-scene .remote-grid .wire{stroke:#9db8ca;opacity:.7;stroke-width:1.6}.grid-scene .remote-grid .flow{stroke:#d1e8f3;opacity:.8;stroke-width:2;stroke-dasharray:4 19}
.grid-scene .remote-towers{opacity:.56}.grid-scene .remote-source{opacity:.8}.grid-scene .remote-label{fill:#aec9d9;font-size:15px}
.grid-scene .remote-grid.frequency-recovery .wire{animation:frequency-recover 3s ease-in-out 1}.grid-scene .remote-grid.frequency-recovery .flow{stroke:#fff4c6;stroke-width:3}
.grid-scene .gas-unit-states .unit-on{fill:#abc6c2;stroke:#d5ebe6;stroke-width:1}.grid-scene .gas-unit-states .unit-off{fill:#142a3a;stroke:#4b6275;stroke-width:1}
.grid-scene .gas-unit-states text{font-size:12px;fill:#0b2235}.grid-scene .gas-unit-states [data-online="false"] text{fill:#718d9e}
.grid-scene .equipment-pulse{fill:none;stroke:#ffe8ad;stroke-width:3;animation:gas-focus 3s ease-out both}.grid-scene .unit-highlight rect{stroke:#fff0b8;stroke-width:3;animation:support-recover 3s ease-out 1}.grid-scene .unit-highlight text{fill:#e7e4c5!important}
@keyframes gas-focus{0%{opacity:0;stroke-width:1}18%,42%,68%{opacity:1;stroke-width:4}30%,55%{opacity:.45;stroke-width:2}85%,100%{opacity:.8;stroke-width:2}}
@keyframes gas-label{0%{opacity:0}15%,82%{opacity:1}100%{opacity:.65}}
@keyframes frequency-recover{0%{stroke:#728c9f;opacity:.5}25%{stroke:#f3f7df;opacity:1;stroke-width:4}50%{stroke:#a6c7d7;stroke-width:2}70%{stroke:#f3f7df;opacity:1;stroke-width:3.5}100%{stroke:var(--ink);opacity:1;stroke-width:2}}
@keyframes support-recover{0%{opacity:0}20%,65%{opacity:.9}40%{opacity:.25}100%{opacity:0}}
@keyframes support-signal{0%{fill:#526c7e}20%,60%,100%{fill:#fff3bf}40%,80%{fill:#acc8bd}}
.grid-scene.no-motion *{animation:none!important;transition:none!important}.grid-scene.no-motion .fault-flash{opacity:.65}
@keyframes power-flow{to{stroke-dashoffset:-56}}@keyframes rotor-turn{to{transform:rotate(360deg)}}
@keyframes fault-flash{0%{opacity:0}8%{opacity:1}14%{opacity:.1}20%{opacity:1}30%,100%{opacity:0}}
@keyframes wire-jolt{0%,100%{transform:translateY(0)}12%{transform:translateY(-4px)}26%{transform:translateY(3px)}42%{transform:translateY(-2px)}65%{transform:translateY(1px)}}
@keyframes relay-ping{0%{opacity:.8;stroke-width:3}100%{opacity:0;stroke-width:14}}
@keyframes light-restore{0%,20%{fill:#294254;opacity:.4}45%{fill:#fff7d5;opacity:.9}60%{opacity:.5}100%{fill:var(--light);opacity:1}}
@keyframes load-flicker{0%,100%{opacity:1}25%{opacity:.45}40%{opacity:.9}60%{opacity:.6}}
@keyframes response-light{0%,100%{opacity:.5}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){.grid-scene *{animation:none!important;transition:none!important}.grid-scene .fault-flash{opacity:.5}}
`;

function Hotspot({ id, x, y, width, height, children, select, layoutTransform }: { id: DeviceId; x: number; y: number; width: number; height: number; children: React.ReactNode; select?: (id: DeviceId) => void; layoutTransform?: string }) {
  return <g transform={layoutTransform} className="device" role={select ? 'button' : undefined} tabIndex={select ? 0 : undefined} aria-label={`查看${{wind:'风电场与变流器',gas:'燃气电站',line:'架空输电线路',substation:'变电与低频减载',support:'其余电源与频率支撑',dg:'分布式电源',loads:'负荷支路'}[id]}`} onClick={() => select?.(id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select?.(id); } }}>
    <rect className="hit" x={x} y={y} width={width} height={height}/>{children}
  </g>;
}
function Turbine({ x, y, h, slow, pixel }: { x: number; y: number; h: number; slow: boolean; pixel: boolean }) {
  return <g transform={`translate(${x} ${y})`}><path className="metal" d={`M-5 0 L-2 ${-h} H2 L5 0 Z`}/><path className="detail" d="M-16 2 H16 M-12 9 H12"/>
    <g transform={`translate(0 ${-h})`}><g className={`rotor ${slow?'rotor-slow':''}`}>
      {[0,120,240].map(angle => <path key={angle} transform={`rotate(${angle})`} className="metal" d={pixel ? 'M-3 -4 V-18 H-1 V-40 H2 V-66 H6 V-38 H5 V-15 H3 V-4 Z' : 'M-3 -4 C-3 -26 0 -51 5 -72 L7 -62 L5 -20 L2 -3 Z'}/>)}<circle className="metal" r="6"/>
    </g></g></g>;
}
function Tower({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${small ? .83 : 1})`}><path className="outline" d="M-40 0 L-14 -115 L-8 -190 H8 L14 -115 L40 0 M-28 -40 H28 M-22 -75 H22 M-15 -110 H15 M-12 -145 H12 M-8 -182 H8 M-36 -3 L25 -43 L-22 -75 L15 -110 L-12 -145 L8 -181 M36 -3 L-25 -43 L22 -75 L-15 -110 L12 -145 L-8 -181 M-48 -138 H48 M-38 -170 H38 M-48 -138 L-10 -156 M48 -138 L10 -156 M-38 -170 L-8 -184 M38 -170 L8 -184"/>
    {[-45,-32,32,45].map((v,i)=><g key={v} transform={`translate(${v} ${i%2?-170:-138})`}><path className="outline" d="M0 0 V18"/><path className="detail" d="M-4 4 H4 M-4 9 H4 M-4 14 H4"/></g>)}<path className="metal" d="M-47 0 H-29 V7 H-47 Z M29 0 H47 V7 H29 Z"/></g>;
}
function Windows({ x, y, cols=4, rows=3, size=7, gap=12 }: { x: number; y: number; cols?: number; rows?: number; size?: number; gap?: number }) {
  return <>{Array.from({length:rows*cols},(_,i)=><rect key={i} className="window" x={x+(i%cols)*gap} y={y+Math.floor(i/cols)*gap} width={size} height={size+2} style={{'--light-delay':`${(i%5)*.12}s`} as CSSProperties}/>)}</>;
}
function LoadGroup({ x,y,kind,on,restore,flicker,label }: {x:number;y:number;kind:'city'|'homes'|'workshop';on:boolean;restore:boolean;flicker:boolean;label:string}) {
  return <g transform={`translate(${x} ${y})`} className={`${on?'powered':''} ${restore?'restore-lights':''} ${flicker?'flicker':''}`} data-load={kind} data-powered={on}>
    {kind==='city'?<><path className="metal" d="M0 0 V-60 H22 V-80 H42 V-60 H64 V0 Z M76 0 V-105 H139 V0 Z M154 0 V-48 H191 V0 Z"/><path className="detail" d="M84 -105 V-116 H130 V-105 M106 -116 V-135 M0 0 H195"/><Windows x={10} y={-51} cols={4} rows={3}/><Windows x={87} y={-94} cols={4} rows={6}/><Windows x={163} y={-38} cols={2} rows={2}/></>:kind==='homes'?<><path className="metal" d="M0 0 V-55 L34 -82 L68 -55 V0 Z M91 0 V-55 L125 -82 L159 -55 V0 Z"/><path className="detail" d="M-7 -55 L34 -90 L75 -55 M84 -55 L125 -90 L166 -55 M26 0 V-28 H42 V0 M117 0 V-28 H133 V0 M52 -66 V-86 H61 V-59"/><Windows x={11} y={-47} cols={3} rows={1} gap={18}/><Windows x={102} y={-47} cols={3} rows={1} gap={18}/><rect className="window" x="29" y="-68" width="10" height="10"/><rect className="window" x="120" y="-68" width="10" height="10"/></>:<><path className="metal" d="M0 0 V-54 L36 -77 V-54 L74 -77 V-54 H173 V0 Z"/><path className="detail" d="M120 0 V-36 H153 V0 M128 -54 V-105 H142 V-54 M0 -14 H110"/><Windows x={10} y={-41} cols={8} rows={1} gap={13}/></>}
    <g transform="translate(207 0)"><path className="outline" d="M0 0 V-80 Q0 -88 8 -88 H18"/><path className="metal" d="M12 -88 H29 L33 -80 H8 Z"/><circle className="lamp-halo" cx="20" cy="-70" r="33"/><ellipse className="lamp-light" cx="20" cy="-79" rx="10" ry="2"/></g>
    <text x="95" y="23" textAnchor="middle" className="equipment-label">{label}</text>
  </g>;
}
function Switch({ x,y,open, device }: {x:number;y:number;open:boolean;device?:string}) {
  return <g transform={`translate(${x} ${y})`} className={open?'switch-open':''} data-switch-open={open} data-switch-device={device}><circle cx="0" cy="0" r="3" className="metal"/><circle cx="31" cy="0" r="3" className="metal"/><path className="switch-arm" d="M0 0 H31"/></g>;
}

export default function GridScene({ variant, phase, labels = true, motion = true, replay = 0, active = true, select, eventState, eventKey, integrated = false }: { variant: SceneStyle; phase: number; labels?: boolean; motion?: boolean; replay?: number; active?: boolean; select?: (id: DeviceId) => void; eventState?: EventSceneState; eventKey?: string; integrated?: boolean }) {
  const unitDy=integrated?450:0,lineDy=integrated?300:0,stationDy=integrated?320:0,remoteDy=integrated?130:0;
  const cityDy=integrated?180:0,homeDy=integrated?320:0,workshopDy=integrated?450:0;
  const windX=integrated?409.25:395,windY=integrated?498.4:416;
  const uid=useId().replace(/[^a-zA-Z0-9]/g,'');
  const state=PHASES[phase];
  const windLost=eventState?.windLost ?? phase>0, dgLoss=eventState?.embeddedLost ?? phase>=2;
  const loadA=eventState?.loadA ?? state.a,loadB=eventState?.loadB ?? state.b;
  const response=eventState?.response ?? state.response;
  const [legacyLineFault,setLineFault]=useState(phase===1),[legacyGasOpen,setGasOpen]=useState(phase>1);
  const lineFault=eventState?.lineOpen ?? legacyLineFault,gasOpen=eventState?.steamLost ?? legacyGasOpen;
  const gtAOpen=eventState?.gtALost ?? phase>=2,gtBOpen=eventState?.gtBLost ?? phase>=3;
  const frontPower=!lineFault&&(!windLost||!gasOpen);
  const tripped=!loadA||!loadB;
  const action=eventState?.action ?? (phase===1?'lightning':phase===4?'stable':phase===5?'restore':phase===6?'restored':'none');
  const recovery=action==='stable'||action==='dispatch';
  const gasHighlight=action==='steam'||(!eventState&&phase===1&&gasOpen);
  const frame=`${eventKey??phase}-${replay}-${active}`;
  useEffect(()=>{
    if(eventState)return;
    if(phase!==1||!active){setLineFault(false);setGasOpen(phase>0);return;}
    setLineFault(true);setGasOpen(false);
    const openTimer=setTimeout(()=>setGasOpen(true),350);
    const clearTimer=setTimeout(()=>setLineFault(false),3000);
    return()=>{clearTimeout(openTimer);clearTimeout(clearTimer);};
  },[phase,replay,active,eventState]);
  const feeder=(d:string,on:boolean,key:string)=> <g key={key} data-path={key} data-powered={on} className={on?'live-feed':'disconnected'}><path className="feeder" d={d}/><path className="flow" d={d}/></g>;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={integrated?"0 80 1400 1050":"0 0 1400 660"} preserveAspectRatio={integrated?"xMidYMin meet":"xMidYMid meet"} className={`grid-scene scene-${variant} ${motion?'':'no-motion'} ${active?'':'scene-inactive'}`} role="img" aria-label={`${variant}风格，${state.name}：电网设备教学示意`} data-phase={state.id} data-variant={variant} data-line-fault={lineFault} data-event={eventKey} data-front-powered={frontPower}>
    <title>{state.name} · 电网设备教学示意</title><desc>风电、燃气、分布式电源和其余电源接入输电及配电网络，三个负荷支路显示供电变化。非真实接线或规模比例。</desc>
    <style>{SCENE_CSS}</style>
    <defs><linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#91a7b6" stopOpacity=".06"/><stop offset="1" stopColor="#91a7b6" stopOpacity="0"/></linearGradient></defs>
    <rect width="1400" height="660" fill={`url(#${uid}sky)`}/>
    <g className="skyline"><path d="M0 420 L0 395 L55 395 L55 368 L90 368 L90 390 L130 390 L130 355 L155 355 L155 395 L180 395 L180 365 L218 365 L218 410 L270 410 L290 380 L305 380 L305 415 H1400 V660 H0Z"/><path className="horizon-detail" d="M940 350 V225 H960 V190 H984 V225 H1008 V310 H1030 V245 H1075 V195 H1092 V260 H1110 V220 H1150 V315 H1180 V210 H1220 V280 H1240 V180 H1260 V210 H1280 V295 H1300 V250 H1340 V310 H1400 V360Z"/></g>
    <path className="land" d="M0 436 Q170 423 330 458 Q460 426 640 448 Q830 458 1010 430 L1400 417 V660 H0Z"/>
    <g className="detail" opacity=".45"><path d="M12 420 H320 M45 431 H170 M204 440 H318 M27 451 H103 M110 456 H260 M40 466 H270"/><path d="M445 512 H782 M455 518 H510 M680 526 H795 M1050 584 H1370"/></g>
    <g opacity=".5" transform="translate(0 -22)"><path className="outline-cloud" d="M455 117 Q441 100 459 86 Q470 61 495 75 Q510 47 535 72 Q565 60 577 91 Q604 101 587 120 Z"/><path className="outline-cloud" d="M1010 103 Q995 87 1012 79 Q1028 51 1054 77 Q1087 67 1095 93 Q1118 102 1105 112 H1020"/></g>
    <g transform={`translate(0 ${remoteDy})`} className={`remote-grid ${recovery?'frequency-recovery':''}`} data-path="remote-corridor" data-powered="true" key={`remote-${frame}`}>
      <g className="remote-source"><path className="metal" d="M419 219 V172 H437 V155 H450 V172 H479 V219Z"/><path className="detail" d="M427 180 H469 M427 188 H469"/><circle className="metal" cx="450" cy="205" r="10"/><text x="450" y="209" textAnchor="middle" className="sub-label">G</text></g>
      <g className="remote-towers"><g transform="translate(285 140) scale(.5)"><Tower x={570} y={280}/></g><g transform="translate(352.5 130) scale(.5)"><Tower x={705} y={260}/></g><g transform="translate(420 140) scale(.5)"><Tower x={840} y={280}/></g></g>
      <path className="wire" d={`M479 195 H553 Q620 226 688 175 Q765 216 823 195 H916 V${430+stationDy-remoteDy} H943 M479 210 H548 Q620 244 682 191 Q765 235 818 210 H932 V${430+stationDy-remoteDy} H943`}/>
      <path className="flow" d={`M479 195 H553 Q620 226 688 175 Q765 216 823 195 H916 V${430+stationDy-remoteDy} H943`}/>
      <path className="flow" d={`M479 210 H548 Q620 244 682 191 Q765 235 818 210 H932 V${430+stationDy-remoteDy} H943`}/>
      <circle className="solid" cx="943" cy={430+stationDy-remoteDy} r="4"/>
      {labels&&<><text x="713" y="106" textAnchor="middle" className="remote-label">其他网架 · 持续供电</text><text x="713" y="127" textAnchor="middle" className="sub-label">其余电源与未脱网出力{windLost?' · 含 Hornsea 余留出力':''}</text></>}
    </g>
    <g transform={`translate(0 ${lineDy})`}><g data-path="affected-corridor" data-powered={frontPower} data-line-available={!lineFault} className={`${action==='lightning'?'fault-wire':''} ${!frontPower?'line-isolated':''}`} key={`wires-${frame}`}>
      <path className="wire" d="M435 360 Q562 402 645 343 Q734 368 806 360 M448 328 Q558 370 657 310 Q737 342 820 340 M512 328 Q610 365 722 310 Q780 330 841 340 M525 360 Q605 400 736 343 Q790 360 854 360"/>
      <path className="flow" d="M525 360 Q605 400 736 343 Q790 360 854 360"/>
    </g>
    </g>
    <g key={`event-${frame}`}>
      {action==='lightning' && <g className="fault-flash"><path fill="#f9f5e3" d={integrated?"M527 108 L488 350 H517 L467 631 L550 340 H520 L566 108Z":"M527 108 L478 218 H511 L467 331 L550 200 H517 L566 108Z"}/><circle cx="478" cy={329+lineDy} r="29" fill="#fff" opacity=".08"/><path transform={`translate(0 ${lineDy})`} className="outline" d="M455 312 L444 300 M494 310 L506 296 M461 345 L447 354 M495 345 L509 353"/></g>}
    </g>
    <Hotspot layoutTransform={integrated?'translate(-45 20) scale(1.15)':undefined} id="wind" x={70} y={125} width={340} height={312} select={select}>
      <Turbine x={125} y={404} h={139} slow={windLost} pixel={variant==='pixel'}/><Turbine x={228} y={395} h={188} slow={windLost} pixel={variant==='pixel'}/><Turbine x={318} y={409} h={118} slow={windLost} pixel={variant==='pixel'}/>
      <path className="detail" d="M125 406 V425 H346 M228 399 V425 M318 411 V425"/>
      <g transform="translate(347 390)"><rect className="metal" width="47" height="54" rx={variant==='pixel'?0:3}/><path className="detail" d="M4 29 L42 5 M8 13 H20 M8 17 H20 M28 38 Q32 29 36 38 T43 38"/><circle className="trip-indicator" cx="9" cy="45" r="2"/></g>
      {labels && <><text x="213" y="110" textAnchor="middle">{windLost?'Hornsea 受影响支路':'Hornsea 风电场'}</text><text x="371" y="463" textAnchor="middle" className="sub-label">变流器</text></>}
      {action==='wind'&&<g key={`wind-action-${frame}`}><rect className="equipment-pulse" x="340" y="382" width="62" height="70" rx="4"/><text className="trip-label" x="213" y="448" textAnchor="middle">出力损失 737 MW</text></g>}
    </Hotspot>
    {feeder(`M${windX} ${windY} H430 V${448+lineDy} H480`,!windLost&&!lineFault,'wind-feed')}
    <Hotspot layoutTransform={`translate(0 ${lineDy})`} id="line" x={422} y={274} width={347} height={230} select={select}><Tower x={480} y={498}/><Tower x={690} y={474} small/>{labels&&<><text x="584" y="253" textAnchor="middle">受影响电源送出路径</text><text x="584" y="274" textAnchor="middle" className="sub-label">{lineFault?'线路保护断开':frontPower?'供电中 · 拓扑示意':'线路可用 / 电源送出未恢复'}</text></>}</Hotspot>
    <Hotspot layoutTransform={`translate(0 ${unitDy})`} id="gas" x={66} y={468} width={254} height={155} select={select}>
      <path className="metal" d="M83 577 V512 H145 V488 H228 V522 H292 V577Z M102 512 V474 H116 V512 M126 512 V462 H139 V512"/>
      <path className="detail" d="M157 498 H218 M157 505 H218 M157 512 H218 M243 530 H280 M243 538 H280 M83 577 H304 M153 575 V536 H218 V575"/>
      <g><Windows x={91} y={529} cols={4} rows={2} gap={13}/><circle className="metal" cx="184" cy="554" r="15"/><text x="184" y="559" textAnchor="middle" className="sub-label">G</text></g>
      {labels&&<text x="190" y="598" textAnchor="middle">{action==='gasA'?'GT1A 跳闸 · −210 MW':action==='gasB'?'GT1B 停机 · −187 MW':'Little Barford'}</text>}
      <g className="gas-unit-states">{[['ST1C',gasOpen],['GT1A',gtAOpen],['GT1B',gtBOpen]].map(([name,off],i)=><g key={String(name)} className={(name==='GT1A'&&action==='gasA')||(name==='GT1B'&&action==='gasB')?'unit-highlight':''} transform={`translate(${81+i*75} 613)`} data-unit={String(name)} data-online={!off}><rect className={off?'unit-off':'unit-on'} width="67" height="22" rx="2"/><text x="33" y="15" textAnchor="middle">{name}</text></g>)}</g>
    </Hotspot>
    {feeder(`M293 ${551+unitDy} H323 M354 ${551+unitDy} H480 V${469+lineDy}`,!gasOpen&&!lineFault,'gas-feed')}
    <g transform={`translate(0 ${unitDy})`} className={gasHighlight?'gas-trip':''} key={`gas-${frame}`}>
      {gasHighlight&&<><ellipse className="gas-trip-ring" cx="338" cy="544" rx="46" ry="38"/><path className="detail" d="M338 506 V486"/><text className="trip-label" x="338" y="477" textAnchor="middle">{action==='gasA'?'GT1A 退出':action==='gasB'?'GT1B 退出':'ST1C 出口跳闸'}</text></>}
      <Switch x={323} y={551} open={gasOpen} device="gas"/>
    </g>
    <Hotspot layoutTransform={`translate(0 ${unitDy})`} id="dg" x={370} y={526} width={158} height={119} select={select}>
      <path className="metal" d="M386 610 V568 L427 537 L470 568 V610Z"/><path className="metal" d="M390 561 L414 543 H447 L463 561Z"/><path className="detail" d="M402 552 H455 M414 543 L407 561 M430 543 V561 M445 543 L451 561 M417 610 V584 H433 V610"/>
      <g className={dgLoss?'':'powered'}><rect className="window" x="393" y="580" width="11" height="15"/><rect className="window" x="444" y="580" width="11" height="15"/></g>
      {labels&&<text x="427" y="635" textAnchor="middle" className="equipment-label">受影响分布式电源</text>}
    </Hotspot>
    {feeder(`M470 ${586+unitDy} H488 M519 ${586+unitDy} H554 V${495+stationDy} H818`,!dgLoss,'dg-feed')}<Switch x={488} y={586+unitDy} open={dgLoss}/>
    <Hotspot layoutTransform={`translate(0 ${unitDy})`} id="support" x={580} y={514} width={210} height={128} select={select}>
      <g className={`${response?'responding':''} ${recovery?'stability-recovery':''}`} key={`support-${frame}`}>
      {recovery&&<><rect className="support-aura" x="584" y="535" width="151" height="80" rx="8"/><text className="recovery-caption" x="662" y="523" textAnchor="middle">频率支撑 · 系统趋稳</text></>}
      {[0,1,2].map(i=><g key={i} transform={`translate(${595+i*45} 548)`}><rect className="metal" width="35" height="56" rx={variant==='pixel'?0:3}/><path className="detail" d="M6 15 H29 M6 24 H29 M6 33 H29 M9 0 V-5 H26 V0"/><rect className={`support-status ${response?'response-on':''}`} x="6" y="42" width="23" height="5"/></g>)}<path className="detail" d="M612 605 V615 H731 V572 H770"/></g>
      {labels&&<text x="674" y="635" textAnchor="middle" className="equipment-label">调频支撑 / 储能等</text>}
    </Hotspot>
    {feeder(`M730 ${574+unitDy} H773 V${476+stationDy} H820`,response,'support-feed')}
    <Hotspot layoutTransform={`translate(0 ${stationDy})`} id="substation" x={788} y={325} width={218} height={239} select={select}>
      <path className="outline" d="M806 453 V340 H868 V453 M798 340 H878 M820 453 V358 H854 V453"/><path className="detail" d="M803 354 H813 M803 360 H813 M803 366 H813 M863 354 H873 M863 360 H873 M863 366 H873"/>
      <rect className="metal" x="802" y="453" width="70" height="51" rx={variant==='pixel'?0:5}/><path className="detail" d="M811 461 V496 M820 461 V496 M829 461 V496 M838 461 V496 M847 461 V496 M856 461 V496"/>
      <path className="outline" d="M875 430 H943 M881 430 V505 M891 430 V505 M903 430 V505 M943 300 V558"/>
      <g className={tripped?'relay-active':''}><rect className="metal" x="908" y="476" width="43" height="61" rx={variant==='pixel'?0:3}/><rect className="detail" x="914" y="484" width="31" height="16"/><path className="detail" d="M916 493 H923 L927 489 L932 495 L940 489"/><circle className="trip-indicator" cx="920" cy="513" r="4"/><circle className="relay-ring" cx="920" cy="513" r="8"/><text x="929" y="531" textAnchor="middle" className="sub-label">LFDD</text></g>
      <path className="detail" d="M791 545 H984 M797 545 V526 M811 545 V526 M825 545 V526 M839 545 V526 M853 545 V526 M867 545 V526 M881 545 V526 M895 545 V526 M963 545 V526 M978 545 V526"/>
      {labels&&<><text x="872" y="323" textAnchor="middle">变电站 / 配电母线</text><text x="929" y="584" textAnchor="middle" className="sub-label">低频减载柜</text></>}
    </Hotspot>
    {feeder(`M944 ${300+stationDy} H963 V${300+cityDy} H979 M1010 ${300+cityDy} H1082`,true,'retained')}<Switch x={979} y={300+cityDy} open={false}/>
    {feeder(`M944 ${430+stationDy} H963 V${430+homeDy} H979 M1010 ${430+homeDy} H1082`,loadA,'feeder-a')}<Switch x={979} y={430+homeDy} open={!loadA}/>
    {feeder(`M944 ${558+stationDy} H963 V${558+workshopDy} H979 M1010 ${558+workshopDy} H1082`,loadB,'feeder-b')}<Switch x={979} y={558+workshopDy} open={!loadB}/>
    <Hotspot key={`loads-${replay}`} id="loads" x={1064} y={145} width={288} height={476+workshopDy} select={select}>
      <LoadGroup x={1082} y={300+cityDy} kind="city" on restore={false} flicker={action==='gasA'||action==='steam'} label={labels?'保留供电支路':''}/>
      <LoadGroup x={1082} y={430+homeDy} kind="homes" on={loadA} restore={action==='restore'||action==='restored'} flicker={action==='gasA'||action==='steam'} label={labels?'示意减载支路 A':''}/>
      <LoadGroup x={1082} y={558+workshopDy} kind="workshop" on={loadB} restore={action==='restored'} flicker={action==='gasA'||action==='steam'} label={labels?'示意减载支路 B':''}/>
    </Hotspot>
    {labels&&<text x="52" y="54" className="sub-label">发电侧</text>}{labels&&<text x="645" y="54" className="sub-label">输电与变电</text>}{labels&&<text x="1132" y="54" className="sub-label">用户负荷</text>}
  </svg>;
}
