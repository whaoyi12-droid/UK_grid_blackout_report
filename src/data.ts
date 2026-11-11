export const SOURCES = [
  { name: '新增秒级时间线核对', detail: '摘自用户提供的资料汇编副本；含新增节点与现有六阶段的差异，原件未改动。', url: './补充时间线核对.md' },
  { name: '新版小组汇报 PPT（v3）', detail: '主讲按第7页四阶段；第6页两条电厂事件时间与第7页及报告冲突，未采纳。原件未修改。', url: '' },
  { name: 'ESO 最终技术报告', detail: '事故过程、发电损失与频率响应的原始报告。', url: 'https://www.ofgem.gov.uk/sites/default/files/docs/2019/09/eso_technical_report_-_final.pdf' },
  { name: 'E3C 事故审查', detail: '整体时间线、供电恢复与跨行业影响。', url: 'https://www.gov.uk/government/publications/great-britain-power-system-disruption-review' },
  { name: 'Ofgem 调查报告入口', detail: '监管调查与设备、运行环节的责任分析。', url: 'https://www.ofgem.gov.uk/publications/investigation-9-august-2019-power-outage' },
];
export { PPT_TIMELINE as TIMELINE } from './pptTimeline';
export const GRAPH_NODES = [
  { id: 'lightning', x: 24, y: 175, label: '雷击线路', sub: '外部扰动', stage: 0, detail: '线路故障是触发事件。概念传播图用于说明因果关系，不是实际电网拓扑。' },
  { id: 'wind', x: 222, y: 62, label: '风电出力骤降', sub: 'Hornsea', stage: 1, detail: '风电场控制响应异常带来非预期出力损失。设备表现需要与系统频率防御一起分析。' },
  { id: 'gas', x: 222, y: 175, label: '燃气电站脱网', sub: 'Little Barford', stage: 1, detail: '燃气电站机组相继跳闸。原教学模型将多项损失合并为初始功率缺额，并不逐台复现。' },
  { id: 'dg', x: 222, y: 288, label: '分布式电源脱网', sub: '失网保护等', stage: 1, detail: '分布式发电的保护动作可能增加发电损失。频率与频率变化率是不同判据，不能混为一谈。' },
  { id: 'deficit', x: 426, y: 175, label: '有功功率缺额', sub: '发电 < 用电', stage: 2, detail: '模型初始缺额 1378 MW，额外脱网后为 1978 MW；这些是教学模型输入，不是所有真实阶段的统计总量。' },
  { id: 'frequency', x: 630, y: 175, label: '系统频率下降', sub: '50 Hz → 低频', stage: 2, detail: '由摆动方程描述：同等缺额下，惯量越小，频率初期变化越快。一次调频和负荷阻尼共同影响后续变化。' },
  { id: 'cascade', x: 630, y: 36, label: '额外电源脱网', sub: '缺额进一步扩大', stage: 3, detail: '教学模型用 f < 49.5 Hz 触发额外 600 MW 脱网。这是简化情景，不是真实 RoCoF 保护实现。' },
  { id: 'lfdd', x: 828, y: 175, label: '低频减载', sub: '切除部分负荷', stage: 4, detail: '教学模型在 f < 48.8 Hz 后切除 1000 MW 负荷。缺额减小，频率开始止跌。' },
  { id: 'recovery', x: 828, y: 288, label: '频率止跌与回升', sub: '随后有序复电', stage: 5, detail: '原模型仅含一次调频，稳态仍有频差；实际事故后续调度与复电不在该模型中。' },
];
export const REVIEWS = [
  { title: '49.5 Hz 与 RoCoF 不是同一种判据', original: 'PPT 16 页将频率低于 49.5 Hz 写为 RoCoF / 反孤岛动作。', finding: '第二版明确其为教学用频率触发门槛；±0.125 Hz/s 仅是图上参考线，程序没有用它触发脱网。', treatment: '草稿保留原结论的讨论入口，模型区使用第二版说明。正式口径待确认。' },
  { title: '频率回升，不等于恢复至 50 Hz', original: '资料汇编描述恢复到 49.7 Hz 以上；PPT 16 页简写为“恢复”。', finding: '基准模型 120 s 末约 49.348 Hz，200 s 末仍约 49.348 Hz，未包含二次调频与复电过程。', treatment: '网页忠实绘制程序输出，实际事故恢复单独放在时间线。' },
  { title: '情景占比不等同于事故瞬时工况', original: 'PPT 17 页以 37%（英国）和 56%（西班牙）标注情景。', finding: 'H = Hsync × (1 − α) 是简化映射，年度发电占比不能直接证明事故时刻等效惯量。', treatment: '保留 20% / 37% / 56% 数值与换算，标注教学情景，不宣传为实测工况。' },
  { title: '两版事件记时相差 0.02 s', original: '第一版基准减载事件记录为 5.22 s。', finding: '相同频率曲线在第二版记为 5.20 s，变化来自事件在步初还是步末记时。第一版功率数组首值也为 0，第二版为 −1378 MW。', treatment: '网页对齐第二版；原始代码和图件保留，不覆盖。' },
  { title: 'MATLAB“最大缺额”的打印值有口径问题', original: '脚本以循环结束时的 Pimb 打印“最大缺额”。', finding: '它输出 978 MW，即减载后的残余缺额；教学事件序列的最大缺额为 1978 MW。RoCoF 使用 gradient，也与 Python 直接离散导数不同。', treatment: '对照展示频率误差和各自 RoCoF，明确区别，不修改 MATLAB 原脚本。' },
  { title: '敏感性结论需要限定范围', original: '资料汇编称占比每提高约 17 个百分点，RoCoF 近乎翻倍。', finding: '三组运行值约 0.230、0.293、0.422 Hz/s，相邻组没有翻倍。', treatment: '显示原始计算数字与相对基准变化，待确认后再统一文字。' },
  { title: '事故数量、时间与软件工作量待统一', original: 'PPT、资料汇编中的功率损失、切负荷口径和部分秒级时间不完全一致。', finding: 'MATLAB 脚本已提供，Simulink 仅有框图；未见本次事故的 ANSYS 雷击或绝缘工程。', treatment: '时间线以 PPT 分钟节点为主；不把模型的 1378/600/1000 MW 冒充逐秒实测。正式发布前核对事实口径，未完成软件不作已完成展示。' },
];
export const ANALYSIS = [
  { title: '直接诱因', english: 'THE TRIGGER', heading: '多项电源损失，打破有功平衡', body: '雷击触发扰动，风电与燃气电站的非预期响应叠加。关注故障后的设备行为，才能解释为何一次局部扰动产生系统影响。', measures: ['核验设备故障穿越能力与控制响应', '以组合事件检查频率响应裕度'], graph: 1 },
  { title: '系统隐患', english: 'THE AMPLIFIER', heading: '响应时间与保护协调，影响传播规模', body: '惯量影响初期变化速度，频率响应资源影响后续恢复。分布式电源保护与系统防御之间的协调，也是避免缺额扩大的关键。', measures: ['评估惯量与快速频率响应需求', '协调分布式电源保护和并网要求'], graph: 3 },
  { title: '防御短板', english: 'THE DEFENCE', heading: '切负荷止跌，也留下了改进空间', body: '低频减载帮助遏制频率下跌。系统安全还需要设备验证、风险校核和有序复电的配合，不能把全部责任归于某一种能源。', measures: ['检查低频减载分级与执行效果', '加强调度、配电及重要用户恢复协同'], graph: 4 },
];
