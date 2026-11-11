/** Factual replay, separate from the unchanged teaching simulation.
 * Source: ESO final technical report, table 1 (printed pp.13–14),
 * cross-checked with the user-supplied updated Word copy.
 * Spatial routes and A/B load groups remain illustrative, not an actual single-line diagram.
 */
export interface EventSceneState {
  lineOpen: boolean;
  windLost: boolean;
  steamLost: boolean;
  gtALost: boolean;
  gtBLost: boolean;
  embeddedLost: boolean;
  response: boolean;
  loadA: boolean;
  loadB: boolean;
  action: 'none' | 'lightning' | 'clear' | 'wind' | 'steam' | 'response' | 'reclose' | 'gasA' | 'shed' | 'gasB' | 'dispatch' | 'stable' | 'restore' | 'restored';
}
const normal: EventSceneState = { lineOpen:false,windLost:false,steamLost:false,gtALost:false,gtBLost:false,embeddedLost:false,response:false,loadA:true,loadB:true,action:'none' };
const fault = {...normal,lineOpen:true};
const loss = {...fault,windLost:true,steamLost:true,embeddedLost:true,response:true};
const reclosed = {...loss,lineOpen:false};
const gasA = {...reclosed,gtALost:true};
const shed = {...gasA,loadA:false,loadB:false};
const gasB = {...shed,gtBLost:true};
const src = 'ESO 最终技术报告 · 表 1 / 表 2；新增资料汇编副本';
const event = (id:string,time:string,phase:string,title:string,body:string,graph:number,scenePhase:number,scene:EventSceneState,sourceTime=time) => ({id,time,phase,title,body,graph,scenePhase,scene,sourceTime,source:src});
export const INCIDENT_TIMELINE = [
  event('before','16:52:26','BEFORE','扰动之前，系统正常运行','系统频率为 50.0 Hz，ESO 为最大单一 1000 MW 功率损失预留响应。近处电源和远处其他网架共同供电。',0,0,normal),
  event('lightning','16:52:33','雷击线路','一次单相接地故障，触发扰动','16:52:33.490，Eaton Socon–Wymondley 400 kV 线路发生单相接地故障。受影响通道停流，远处其他网架仍保持供电。',0,1,{...fault,action:'lightning'},'16:52:33.490'),
  event('clear','16:52:33','保护切除','70–74 ms，线路保护切除故障','线路两端分别于 16:52:33.560 与 .564 打开。故障已被切除，但线路尚未重合；灰色通道继续停流。',1,1,{...fault,embeddedLost:true,action:'clear'},'16:52:33.560–16:52:33.564'),
  event('wind','16:52:33','风电降出力','Hornsea 出力，从 799 降至 62 MW','16:52:33.728 开始降出力，.835 稳定于 62 MW。图中近处风电支路代表受影响部分，余留出力归入仍在供电的网络。',1,1,{...fault,windLost:true,embeddedLost:true,action:'wind'},'16:52:33.728–16:52:33.835'),
  event('steam','16:52:34','多源脱网','汽轮机跳闸，分布式电源进一步退出','Little Barford 的 ST1C 失去 244 MW；另约 350 MW 分布式发电因 RoCoF 保护退出。ESO 口径累计损失达到 1481 MW，频率响应开始投入。',3,2,{...loss,action:'steam'}),
  event('response650','16:52:44','响应投入','至少 650 MW 响应，开始支撑频率','频率响应在十秒内交付至少 650 MW。其他网架与调频资源继续向负荷送电，不能把系统画成全面失电。',3,2,{...loss,action:'response'}),
  event('reclose','16:52:53','线路重合','线路恢复接通，电源损失仍然存在','故障线路延时自动重合闸成功。恢复线路结构不等于恢复电源出力；近处受影响电源的送出路径仍不显示功率流动。',3,2,{...reclosed,action:'reclose'}),
  event('firstNadir','16:52:58','首次止跌','频率止跌于 49.1 Hz','已投入的频率响应遏制了第一次下跌。系统仍低于正常运行范围，后续电源损失会再次加重缺额。',3,2,{...reclosed,action:'response'}),
  event('response900','16:53:04','响应增至 900 MW','更多频率响应，抵消部分缺额','频率响应交付达到 900 MW。图中远处网架持续送电，支撑资源亮起，表达供需失衡正在被部分补偿。',3,2,{...reclosed,action:'response'}),
  event('rebound','16:53:18','短暂回升','频率回到约 49.2 Hz，尚未恢复正常','频率响应使系统短暂回升至约 49.2 Hz。剩余裕度仍然有限，此时不提前显示全部恢复。',3,2,{...reclosed,action:'none'}),
  event('gasA','16:53:31','GT1A 跳闸','又损失 210 MW，频率再次下探','Little Barford 的 GT1A 跳闸，ESO 口径累计发电损失增至 1691 MW。机组状态灯逐台熄灭，保持远处其他电源供电。',3,2,{...gasA,action:'gasA'}),
  event('shed','16:53:49','低频减载','跌破 48.8 Hz，自动切除部分负荷','16:53:49.398，LFDD 第一级触发，报告记录切除约 931 MW 需求。两条示意减载支路熄灭，未切除的用户仍有电。',4,3,{...shed,action:'shed'},'16:53:49.398'),
  event('gasB','16:53:58','GT1B 停机','第三台机组退出，由减载与支撑吸收影响','Little Barford 的 GT1B 失去 187 MW，报告说明其为运行人员手动停机。ESO 口径累计发电损失为 1878 MW；供电没有因此全部中断。',4,3,{...gasB,action:'gasB'}),
  event('dispatch','16:54:20','调度增发','调度员下达增发与恢复备用指令','控制室开始调度额外电源，恢复频率和响应能力。远处电源与网架继续承担供电，已减载支路仍等待恢复。',4,3,{...gasB,action:'dispatch'}),
  event('stable','16:57:15','频率恢复','系统回到 50 Hz，用户尚未全部复电','频率响应与调度措施使频率恢复至 50 Hz。光脉冲沿持续供电的网架通过；被切除的用户支路继续保持断开。',5,4,{...gasB,action:'stable'}),
  event('restore','16:58:00','逐步复电','16:58–17:16，逐步下达复电许可','ESO 在这一时间窗口逐步通知 DNO 可以恢复负荷。画面按 A、B 支路示意分批恢复，不对应某地区的精确恢复顺序。',5,5,{...gasB,loadA:true,action:'restore'},'16:58–17:16（许可窗口，非单一精确时刻）'),
  event('restored','17:37:00','供电恢复','各配电网确认，用户供电恢复完成','各 DNO 确认负荷恢复完成。用户恢复供电不要求故障机组已经全部修复，也不代表交通等社会影响同时结束。',5,6,{...gasB,loadA:true,loadB:true,action:'restored'},'17:37（原报告为分钟精度）'),
];
