export type SceneStyle = 'line' | 'pixel' | 'layered' | 'hybrid';
export const STYLES = [
  { id: 'line' as const, code: 'A', name: '工业线稿', subtitle: '设备清晰 · 因果直接', description: '细白线与少量光照，线路和开关最容易讲清楚。适合叠在时间线后方。' },
  { id: 'pixel' as const, code: 'B', name: '像素剪影', subtitle: '黑白像素 · 小恐龙气质', description: '阶梯边缘、块状设备与逐格运动，更有辨识度，适合独立事件场景。' },
  { id: 'layered' as const, code: 'C', name: '分层夜景', subtitle: '远近层次 · 灯光叙事', description: '远景城市、近景电网与灯光渐隐，更接近首页气质，适合全幅背景。' },
];
export const PHASES = [
  { id: 'normal', time: '事故前', name: '正常运行', title: '发电与负荷，保持平衡', description: '风电、燃气和其余电源向网络供电，三个示意支路亮灯。先认识设备和能量路径。', focus: '全景', supply: '正常供电', a: true, b: true, generation: 'normal', response: false },
  { id: 'fault', time: '16:52:00', name: '扰动发生', title: '雷击线路，电源出现异常响应', description: '短时雷击与线路振动强调扰动位置，随后线路恢复。风电并网出力骤降，燃气机组出力损失。', focus: '架空线路 / 电源', supply: '电源损失', a: true, b: true, generation: 'loss', response: false },
  { id: 'cascade', time: '16:53:00', name: '缺额扩大', title: '损失叠加，频率继续承压', description: '分布式电源脱网扩大缺额，剩余电源与频率响应资源参与支撑。灯光轻微波动只作紧迫感示意。', focus: '电源 / 调频支撑', supply: '频率下降', a: true, b: true, generation: 'loss', response: true },
  { id: 'defence', time: '16:53:49', name: '低频减载', title: '切除部分负荷，阻止继续下跌', description: '低频减载柜发出动作提示，两条示意支路的开关断开、灯光熄灭；保留供电支路仍然亮着。', focus: 'LFDD / 负荷支路', supply: '部分负荷切除', a: false, b: false, generation: 'loss', response: true },
  { id: 'stable', time: '16:57:00', name: '频率恢复', title: '系统趋稳，用户尚未全部复电', description: '主网与频率支撑保持工作，已切除的支路暂不接回。系统稳定和用户复电是两件不同的事。', focus: '主网保持 / 等待复电', supply: '频率已恢复', a: false, b: false, generation: 'loss', response: true },
  { id: 'restore', time: '17:06:00', name: '开始复电', title: '按支路，逐步恢复供电', description: '示意支路 A 的开关闭合，路灯和建筑依次点亮；支路 B 仍等待恢复。A/B 顺序仅用于教学表达。', focus: '复电支路 A', supply: '有序复电', a: true, b: false, generation: 'loss', response: true },
  { id: 'restored', time: '17:37:00', name: '供电恢复', title: '用户供电恢复，电网重新平衡', description: '两条减载支路重新亮起。画面不假定故障电厂此时已全部恢复出力，由其余电源与调度支撑供电。', focus: '全部用户支路', supply: '供电恢复', a: true, b: true, generation: 'loss', response: true },
] as const;
export type DeviceId = 'wind' | 'gas' | 'line' | 'substation' | 'support' | 'dg' | 'loads';
export const DEVICES: Record<DeviceId, { title: string; description: string }> = {
  wind: { title: '风电场与变流器', description: '近处支路表示 Hornsea 受影响的737 MW出力，变灰后完全停止流动。报告记录仍有62 MW余留出力，归入远处未脱网电源的等效网络；不是把全场出力画成零。风轮机械转动不表示仍在送电。变流器为功能示意。' },
  gas: { title: '燃气电站', description: '近处开关代表Little Barford的ST1C出口；ST1C、GT1A、GT1B按报告先后退出，状态格分别标示。灰色出口不送电。图标表示机组出力，不表示厂用电或UPS全部失效。' },
  line: { title: '架空输电线路', description: '保护在70–74ms内切除故障，16:52:53重合。近处图形是受影响电源的抽象送出路径，不是Hornsea真实接线。重合表示线路可用，不表示被损失的电源出力恢复；无输入时仍停流。远处多回线路单独连接母线，持续供应未切除负荷。' },
  substation: { title: '变电与低频减载', description: '变压器、母线、开关和 LFDD 柜帮助识别防御动作。低频减载发生在配电负荷支路；不把它归为逆变器断开全部电网。' },
  support: { title: '其余电源与频率支撑', description: '近处柜组表示调频支撑与储能等，响应启动后才显示送出。远处电厂和多回线路表示其余网架，始终向母线供电。光流仅表示路径有供电，不表示实际潮流大小或拓扑。' },
  dg: { title: '分布式电源', description: '用屋顶电源与接入装置代表配电侧嵌入式发电。场景表达额外脱网扩大缺额，不把屋顶光伏指定为全部实际脱网电源。' },
  loads: { title: '保留供电与减载支路', description: '一条支路一直亮，两条示意减载支路先暗后亮。建筑数量、面积和 A/B 复电顺序不按真实规模或地址对应；照明变化用于教学表达。' },
};
