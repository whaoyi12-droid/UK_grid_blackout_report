import { useEffect, useState } from 'react';
import type { EventSceneState } from './incidentTimeline';

// Presentation scale follows v3 slide 7. Detailed report times remain in the source notes.
const normal: EventSceneState = { lineOpen:false,windLost:false,steamLost:false,gtALost:false,gtBLost:false,embeddedLost:false,response:false,loadA:true,loadB:true,action:'none' };
const disturbed: EventSceneState = {...normal,windLost:true,steamLost:true,embeddedLost:true,response:true};
const shed: EventSceneState = {...disturbed,gtALost:true,gtBLost:true,loadA:false,loadB:false,action:'shed'};
const source = '英国8·9大停电汇报_v3.pptx · 第7页四阶段；动作顺序参考ESO报告';
export const PPT_TIMELINE = [
  {id:'before',time:'16:52:00',phase:'BEFORE',title:'故障之前，电网保持平衡',body:'各电源与网络正常运行。近处电源路径和远处其他网架共同供电，用户负荷保持点亮。',graph:0,scenePhase:0,scene:normal,source,sourceTime:'事故前状态；显示按PPT分钟尺度，非新增秒级记录'},
  {id:'fault',time:'16:52:00',phase:'故障与机组脱网',title:'雷击线路，电源相继退出',body:'输电线路遭受雷击，燃气与风电机组相继损失出力，系统出现功率缺口。受影响支路停流，其他网架继续供电。',graph:1,scenePhase:1,scene:disturbed,source,sourceTime:'PPT第7页：16时52分（分钟级概括）'},
  {id:'shedding',time:'16:53:00',phase:'频率跌落与减载',title:'频率下降，低频减载介入',body:'系统频率跌破49.5 Hz，继续下探至48.8 Hz附近，触发低频减载。部分用户支路被切除，以遏制频率继续下降。',graph:4,scenePhase:3,scene:shed,source,sourceTime:'PPT第7页：16时53分（分钟级概括）'},
  {id:'frequency',time:'16:57:00',phase:'频率恢复',title:'频率恢复，用户尚未全部复电',body:'紧急调控使系统频率回到正常范围。其余电源与网架继续支撑，已经切除的负荷仍等待恢复。',graph:5,scenePhase:4,scene:{...shed,action:'stable'} as EventSceneState,source,sourceTime:'PPT第7页：16时57分；报告的精确恢复点为16:57:15'},
  {id:'restoration',time:'17:06:00',endTime:'17:37:00',phase:'恢复供电',title:'分批恢复，直到全部用户复电',body:'17:06开始逐步恢复供电，至17:37全部用户恢复。画面按支路依次合闸、亮灯，故障电源并不因此自动恢复出力。',graph:5,scenePhase:5,scene:{...shed,action:'restore'} as EventSceneState,source,sourceTime:'PPT第7页：17时06分至17时37分，区间压缩演示'},
];

/** Coarse PPT beats contain a short sequence; never restores lost generation just to light loads. */
export function usePptScene(index: number, replay: number, active: boolean) {
  const [progress,setProgress]=useState({index,replay,tick:0});
  const tick=progress.index===index&&progress.replay===replay?progress.tick:0;
  useEffect(()=>{
    setProgress({index,replay,tick:0});
    if(!active)return;
    const timings=index===1?[500,2400,3600]:index===2?[1050,3000]:index===4?[650,3200]:[];
    const timers=timings.map((time,i)=>setTimeout(()=>setProgress({index,replay,tick:i+1}),time));
    return()=>timers.forEach(clearTimeout);
  },[index,replay,active]);
  const entry=PPT_TIMELINE[index];
  let scene={...entry.scene};
  if(index===1)scene={...disturbed,lineOpen:tick<3,steamLost:tick>=1,response:tick>=2,action:tick===0?'lightning':tick===1?'steam':tick===2?'response':'reclose'};
  if(index===2)scene={...shed,gtALost:true,gtBLost:tick>=2,loadA:tick>=1?false:true,loadB:tick>=1?false:true,action:tick===0?'gasA':tick===1?'shed':'gasB'};
  if(index===4)scene={...shed,loadA:tick>=1,loadB:tick>=2,action:tick>=2?'restored':'restore'};
  return {scene,scenePhase:index===4&&tick>=2?6:entry.scenePhase,time:index===4&&tick>=2?'17:37:00':entry.time};
}
