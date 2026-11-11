# 失衡的 50 Hz · 英国 8·9 大停电

电气工程基础翻转课堂的本地交互网站草稿。内容以小组 PPT 为主，仿真严格对照 ZIP 第二版 Python，原始成果保持不变。

## 从仓库启动

首次下载后运行 `npm ci`、`npm run build`，再运行 `node scripts/serve-local.mjs`，访问 http://127.0.0.1:4173/ 。仓库不包含 node_modules 和 dist，需本地构建；模型检查所需 Python 数值基准已随仓库保留。

展示顺序：首页 → 事故回放 → 惯量仿真实验 → 故障传播 → 原因与对策 → 资料与说明。

## 直接演示

双击本目录的 **启动网站.cmd**。窗口出现 `http://127.0.0.1:4173/` 后会自动打开默认浏览器。

- 保持命令窗口开启；结束后按 Ctrl+C 停止。
- 本机已安装 Node.js，演示构建版不需要 npm install，不需要 MATLAB / Python 同时运行。
- 另一台电脑需要 Node.js 和本目录的 `dist/`、`scripts/serve-local.mjs`、`启动网站.cmd`。不要双击 `dist/index.html`，浏览器的 file 协议会阻止模块和数据请求。
- localhost 地址只供本机访问，不是公共网址。当前未部署，也未执行校园网实测。
- 完整操作说明：`public/使用说明.html`，可直接双击阅读；站内资料末页也可打开简要指南。

## 开发与检查

```powershell
npm ci
npm run dev
npm run build
npm run test:model
node scripts/serve-local.mjs
# 保持服务器开启，在另一终端运行：
npm run test:browser
```

浏览器测试使用本机 Microsoft Edge 的无头模式。它保存桌面/手机截图，并阻断外部请求以验证核心功能无 CDN 依赖。`validation/browser/report.json` 记录结果。

## 数值复现

`scripts/reproduce.py` 从上级原始文件和 ZIP 中选择必要源码，复制到 `validation/reproduction/` 后运行。不会覆盖上级输入。Python 环境需 NumPy、Matplotlib、NetworkX（第一版需要）。

```powershell
python scripts/reproduce.py
& 'D:/matlab/bin/matlab.exe' -batch "run('完整项目路径/scripts/matlab_verify.m')"
python scripts/finalize-evidence.py
npm run test:model
npm run build
```

正确的 MATLAB 验证入口使用下划线 `matlab_verify.m`。早期 `matlab-verify.m` 文件保留作过程记录，不执行它；MATLAB 不支持连字符脚本名。

两版 Python 的频率和 RoCoF 数组一致，第二版修正了事件记录与初始不平衡功率。网页保持第二版的更新顺序。默认计算 200 s，前 120 s 与基准一致。原始 MATLAB 120 s 的频率曲线与 Python 逐点最大差为 0 Hz；其 RoCoF 由 gradient 得到，与 Python 离散更新导数不同。

## 内容边界

- 三情景为 20%、37%、56% 的既有教学映射，不直接表示事故瞬时真实电源结构。
- 49.5 Hz 触发额外脱网是教学简化，不是实际 RoCoF 继电器逻辑。
- 仅模拟惯量、一次调频、负荷阻尼和门槛事件，不模拟二次调频与完整复电。
- `草稿差异清单.md` 和站内审阅面板保留未确认口径。删除审阅标记前须逐项确认，不能把不同意或未核实的结论悄悄改掉。
- ANSYS 已做安装与工程目录只读检查，未新增设备仿真。Simulink 仅展示模型结构图。

## 文件组织

- `src/`：页面、SVG 传播图、ECharts 图表、等价 TypeScript 模型。
- `public/results/`：原程序独立副本运行得到的图与可下载源码。
- `public/data/`：Python 摘要、MATLAB 交叉验证摘要。
- `validation/`：完整数值基准、原始文件 SHA-256、浏览器测试及截图。
- `dist/`：可迁移静态网站；之后可交给 Netlify 等托管平台。
- `WORK_STATUS.md`：当前完成状态与后续工作。

## 后续公开访问

当前不绑定 Sites，不含任何登录、Firebase、AI 接口或运行时外部 CDN。公开发布时可手动上传 `dist/` 到 Netlify，并将访问权限明确设为 Public，不需要公开整个源代码仓库。平台免费子域名不是独立域名。

发布前确认草稿内容、免费额度与平台权限，使用未登录窗口、关闭 VPN 的校园网及手机流量实际验证。静态资源全部同源，不代表平台域名在所有网络上必然畅通。若无法访问，改选托管入口；课堂仍可用本地版演示。不配置自动付费，不未经确认部署。

## 2026-11-10 展示改版

主流程改为整屏翻页，导航同步高亮；桌面滚轮、PageUp/PageDown、右下角按钮均可翻页。短屏/手机先滚动当前屏内容，不截断。时间点、原因切换先淡出再分元素淡入；系统减少动态效果设置优先。仿真图改为三类曲线标签切换，算法与数值不变。资料和验证集中末页。最新 UI 检查见 validation/presentation/report.json，旧 browser 目录保留第一版证据。第5点2D场景要求记录于 NEXT_2D_SCENE.md，待讨论和预览选择，未开始生成。

## 2D 场景预览

启动网站后打开 http://127.0.0.1:4173/scene.html 。三种风格共七个阶段，能播放、重放当前动作、点设备、三案同屏、背景试放和导出SVG。独立模型与说明在 public/scene-models，打包文件 grid-scene-models.zip。`node scripts/test-scenes.mjs` 检查场景状态与交互，`node scripts/export-scenes.mjs` 从运行中的本地预览导出21份模型。主站01页现已采用用户选择的A+C组合，原三案保留作对比。

## A+C整合

直接打开 /#timeline 查看：右侧电网、底部横排事件、燃气跳闸高亮、线路故障停流置灰和频率恢复光脉冲。可重放和放大。新资料副本的秒级时间线提取见 补充时间线核对.md，现有六个主讲节点未擅自改写。

## 最新主讲口径（2026-11-11）

当前01页为BEFORE加v3 PPT第7页四阶段；宽度恢复1264px居中留白。详细调查节点保留在资料，不逐项展示。各阶段内部按报告因果关系驱动开关、支路和灯光；第四阶段将17:06–17:37压缩为分批复电动画。灰线完全停流，额外网架始终带电。`scripts/test-ppt-replay.mjs`检查新口径和供电路径。旧的细时间线测试脚本/记录仅保留作历史证据，以当前专项和主回归为准。
