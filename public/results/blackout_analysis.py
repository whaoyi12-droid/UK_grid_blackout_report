# -*- coding: utf-8 -*-
"""英国 8·9 大停电汇报用的教学仿真和配图。

运行方式：Windows 双击 run_all.bat；macOS 双击 run_all.command；Linux 执行 sh run_all.sh。
需要 Python 3.7 或更新版本。首次启动需要联网安装依赖，结果写入本目录的“运行结果”。

本程序做三件事：
1) 用等效单机摆动方程演示频率如何响应功率缺额；
2) 绘制事故全程时间线和逻辑传播图；
3) 比较不同新能源占比假设下的频率响应。

讲解顺序：先看 simulate() 的参数和事件，再看每个时间步如何更新调速器、
RoCoF 与频率；最后 main 区域调用绘图函数并打印结果。
注意：模型里的保护阈值、额外脱网功率和切负荷量是教学情景假设，
不是官方报告的逐秒实测值；事故事实时间线与模型曲线分开呈现。
依赖：numpy、matplotlib。
"""

import os
import platform
import numpy as np
import matplotlib
matplotlib.use("Agg")  # 无 GUI 环境直接保存图片
import matplotlib.pyplot as plt
from matplotlib import font_manager

# 只用 Matplotlib 自带的字体查找功能，兼容旧版 Matplotlib。
FONT_CANDIDATES = {
    "Windows": ["SimHei", "Microsoft YaHei"],
    # Names actually used by macOS font catalogues; Heiti SC/PingFang SC
    # are not present on every macOS release.
    "Darwin": ["Songti SC", "Heiti TC", "AppleGothic", "Arial Unicode MS"],
    "Linux": ["WenQuanYi Micro Hei", "Noto Sans CJK SC"],
}.get(platform.system(), ["SimHei", "DejaVu Sans"])
font_selected = False
for font_name in FONT_CANDIDATES:
    try:
        font_manager.findfont(font_name, fallback_to_default=False)
        plt.rcParams["font.sans-serif"] = [font_name]
        font_selected = True
        break
    except ValueError:
        continue
if not font_selected:
    print("提示：未检测到中文字体，图表中文可能显示为方框。请安装任一中文字体后重运行。")
plt.rcParams["axes.unicode_minus"] = False

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "运行结果")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 仿真参数集中放置，便于课堂演示时改参数做对比。
F0 = 50.0                 # 额定频率 (Hz)
BASE_POWER = 35e9          # 系统基准容量 (W)
LOAD_DAMPING = 600e6       # 负荷频率阻尼系数 (W/Hz)
GOVERNOR_GAIN = 900e6      # 一次调频等效增益 (W/Hz)
GOVERNOR_TIME = 15.0       # 调速器响应时间常数 (s)
INITIAL_LOSS = 1378e6      # 初始发电功率缺额 (W)，教学模型输入
EXTRA_LOSS = 600e6         # 频率越限后假设的额外脱网 (W)
SHED_LOAD = 1000e6         # 低频减载假设切除负荷 (W)
EXTRA_LOSS_THRESHOLD = 49.5  # 教学情景触发频率 (Hz)
LFDD_THRESHOLD = 48.8        # 教学情景低频减载门槛 (Hz)
H_SYNCHRONOUS = 4.0 / (1 - 0.37)  # 使 37% 情景对应 H=4s 的假设同步机惯量


# ======================================================================
# 1. 事故演化逻辑模型 —— 系统频率响应（等效单机摆动方程）的离散仿真
#    微分方程：2H·S/f0 · dΔf/dt = P_imb - D·Δf + P_gov
#    P_imb = P_gen - P_load 为不平衡功率（缺额时为负）
#    P_gov  为一次调频（调速器）出力，一阶滞后：dP_gov/dt = (-K·Δf - P_gov)/Tg
# ======================================================================
def simulate(H=4.0, duration=120.0, dt=0.02):
    """离散仿真并返回统一结果字典；功率数组统一以 MW 输出。"""
    if H <= 0 or duration <= 0 or dt <= 0:
        raise ValueError("H、duration 和 dt 都必须大于 0")

    steps = int(round(duration / dt))
    if steps < 1:
        raise ValueError("duration 必须至少包含一个仿真步长")
    step = duration / steps  # 保证最后一个采样点恰好等于 duration
    time = np.linspace(0.0, duration, steps + 1)
    frequency = np.empty(steps + 1)
    rocof = np.empty(steps + 1)
    imbalance_mw = np.empty(steps + 1)

    # 状态量：频率偏差、调速器增量和系统净功率不平衡。
    df, p_governor = 0.0, 0.0
    p_imbalance = -INITIAL_LOSS
    frequency[0], rocof[0] = F0, 0.0
    imbalance_mw[0] = p_imbalance / 1e6
    events = [(0.0, "initial_loss", "初始缺额约 1378 MW")]
    extra_loss_applied = False
    load_shed_applied = False

    # 摆动方程：df/dt = f0/(2HS) × (功率不平衡 - 负荷阻尼 + 调速器出力)
    hz_per_watt = F0 / (2.0 * H * BASE_POWER)
    for i in range(steps):
        current_time = time[i]

        # 教学情景：用频率门槛简化表示级联脱网，不代表真实 RoCoF 保护逻辑。
        if not extra_loss_applied and frequency[i] < EXTRA_LOSS_THRESHOLD:
            p_imbalance -= EXTRA_LOSS
            extra_loss_applied = True
            events.append((current_time, "extra_loss", "假设额外脱网 600 MW"))

        if not load_shed_applied and frequency[i] < LFDD_THRESHOLD:
            p_imbalance += SHED_LOAD
            load_shed_applied = True
            events.append((current_time, "load_shed", "假设低频减载 1000 MW"))

        # 显式 Euler 更新：先更新调速器，再计算 RoCoF 和下一时刻频率。
        p_governor += (-GOVERNOR_GAIN * df - p_governor) / GOVERNOR_TIME * step
        rocof[i + 1] = hz_per_watt * (
            p_imbalance - LOAD_DAMPING * df + p_governor
        )
        df += rocof[i + 1] * step
        frequency[i + 1] = F0 + df
        imbalance_mw[i + 1] = p_imbalance / 1e6

    return {
        "time": time,
        "frequency": frequency,
        "rocof": rocof,
        "imbalance_mw": imbalance_mw,
        "events": events,
        "H": H,
        "dt": step,
    }


# ======================================================================
# 2. 事故时序图（以时间线为主）
# ======================================================================
def plot_timeline():
    # 主讲优先：呈现事故全程（官方报告时间），而不是把 120 s 仿真误作 45 min。
    fig, ax = plt.subplots(figsize=(13, 5.8))
    start, end = 16 * 60 + 52, 17 * 60 + 37
    ax.set_xlim(0, end - start)
    ax.set_ylim(-1.55, 1.8)
    ax.axhline(0, color="#52616b", lw=2, zorder=1)
    milestones = [
        (0, "16:52", "雷击导致输电线路跳闸；\n燃气机组与 Hornsea 风电场相继脱网", "#c0392b", 1),
        (1, "16:53", "系统频率快速下降；\n低频减载动作", "#d35400", -1),
        (5, "16:57", "频率恢复至正常范围", "#2874a6", 1),
        (14, "17:06", "开始恢复用户供电", "#2874a6", -1),
        (45, "17:37", "全部用户恢复供电", "#1e8449", 1),
    ]
    for minute, clock, label, color, side in milestones:
        ax.scatter(minute, 0, s=100, color=color, edgecolor="white", linewidth=1.2, zorder=3)
        ax.vlines(minute, 0, side * 0.48, color=color, lw=1.5)
        ax.text(minute, side * 0.56, clock, ha="center", va="bottom" if side > 0 else "top",
                fontsize=11, color=color, fontweight="bold")
        ax.text(minute, side * 0.86, label, ha="center", va="bottom" if side > 0 else "top",
                fontsize=9, color="#263238", linespacing=1.4)
    # 分开设置刻度与标签，兼容较旧的 Matplotlib。
    ax.set_xticks([0, 5, 14, 25, 35, 45])
    ax.set_xticklabels(["16:52", "16:57", "17:06", "17:17", "17:27", "17:37"])
    ax.set_yticks([])
    ax.set_xlabel("当地时间（事故发生至全部恢复供电，约 45 分钟）")
    ax.set_title("英国 2019 年 8 月 9 日大停电：事故时间线", fontsize=15, pad=14)
    ax.text(0.01, 0.03, "注：时间节点据官方事故报告整理；频率响应细节见 simulation.png（简化模型，非实测曲线）。",
            transform=ax.transAxes, fontsize=8, color="#59636e")
    for spine in ("left", "right", "top"):
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color("#aab2b8")
    ax.grid(axis="x", alpha=0.15)
    fig.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, "timeline.png"), dpi=150)
    plt.close(fig)


# ======================================================================
# 3. 故障传播链路图（事故演化逻辑模型的图形化）
# ======================================================================
def plot_propagation():
    # 布局是固定的，直接用 Matplotlib 画箭头即可，不需要通用图网络库。
    nodes = {
        "lightning": ("雷击", (0.0, 4.0), "#f4d03f"),
        "line": ("Eaton Socon-Wymondley\n线路跳闸", (0.0, 3.0), "#e67e22"),
        "gas": ("Little Barford\n燃气电站跳闸", (3.0, 3.0), "#e67e22"),
        "wind": ("Hornsea\n海上风电场脱网", (-3.0, 3.0), "#e67e22"),
        "dg_first": ("分布式发电脱网\n≈500 MW", (0.0, 2.0), "#e59866"),
        "deficit": ("功率缺额\n≈1378 MW", (0.0, 1.0), "#c0392b"),
        "frequency": ("系统频率跌落\n50→48.8 Hz", (0.0, 0.0), "#922b21"),
        "protection": ("保护/控制响应\n（模型简化）", (3.0, -1.0), "#8e44ad"),
        "dg_more": ("假设额外脱网\n≈600 MW", (3.0, -2.0), "#8e44ad"),
        "lfdd": ("假设低频减载\n≈1000 MW", (-3.0, -1.0), "#1e8449"),
        "recovery": ("频率回升", (0.0, -3.0), "#27ae60"),
    }
    edges = [
        ("lightning", "line", None), ("line", "dg_first", None),
        ("gas", "deficit", None), ("wind", "deficit", None),
        ("dg_first", "deficit", None), ("deficit", "frequency", None),
        ("frequency", "protection", None), ("protection", "dg_more", None),
        ("dg_more", "deficit", "arc3,rad=-0.35"),
        ("frequency", "lfdd", None), ("lfdd", "recovery", None),
    ]

    fig, ax = plt.subplots(figsize=(13, 8.5))
    ax.axis("off")
    ax.set_xlim(-5.0, 5.0)
    ax.set_ylim(-3.8, 4.8)
    positions = {key: item[1] for key, item in nodes.items()}
    # 先画连线再画节点，让箭头自然藏在节点下方。
    for source, target, curve in edges:
        feedback = curve is not None
        arrow = {"arrowstyle": "-|>", "color": "#e74c3c" if feedback else "#5d6d7e",
                 "lw": 1.8 if feedback else 1.4, "shrinkA": 32, "shrinkB": 32}
        if curve:
            arrow["connectionstyle"] = curve
        ax.annotate("", xy=positions[target], xytext=positions[source],
                    arrowprops=arrow, zorder=1)

    for label, (x, y), color in nodes.values():
        ax.text(x, y, label, ha="center", va="center", fontsize=9,
                color="white", zorder=4, fontweight="bold",
                bbox={"boxstyle": "round,pad=0.45", "facecolor": color,
                      "edgecolor": "white", "linewidth": 1.2})

    ax.text(0.0, 4.7, "触发源", ha="center", fontsize=10, color="#7f8c8d")
    ax.text(0.0, 1.0, "核心缺额", ha="center", fontsize=10, color="#7f8c8d")
    ax.set_title("英国 8·9 大停电 —— 故障传播逻辑（红色虚线为正反馈；模型环节为教学假设）", fontsize=13)
    fig.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, "propagation.png"), dpi=150)
    plt.close(fig)


# ======================================================================
# 4. 简单系统故障扩散仿真图（频率 / RoCoF / 不平衡功率）
# ======================================================================
def plot_simulation(result):
    """把 simulate() 的同一份结果画成频率、RoCoF 和功率三幅子图。"""
    t = result["time"]
    f = result["frequency"]
    rocof = result["rocof"]
    pimb = result["imbalance_mw"]
    events = result["events"]
    fig, axes = plt.subplots(3, 1, figsize=(11, 8), sharex=True)

    axes[0].plot(t / 60.0, f, lw=2, color="#c0392b")
    axes[0].axhline(50, ls="--", color="gray", lw=1)
    axes[0].axhline(48.8, ls=":", color="purple", lw=1)
    axes[0].set_ylabel("频率 (Hz)")
    axes[0].set_title("教学情景仿真：频率跌落与假设的低频减载响应", fontsize=12)
    axes[0].grid(alpha=0.25)

    axes[1].plot(t / 60.0, rocof, lw=1.8, color="#8e44ad")
    axes[1].axhline(0.125, ls="--", color="orange", lw=1)
    axes[1].axhline(-0.125, ls="--", color="orange", lw=1)
    axes[1].set_ylabel("RoCoF (Hz/s)")
    axes[1].text(t[-1] / 60.0 * 0.99, 0.14, "参考线：±0.125 Hz/s（非本模型触发条件）",
                 ha="right", fontsize=8, color="orange")
    axes[1].grid(alpha=0.25)

    axes[2].plot(t / 60.0, pimb, lw=1.8, color="#1f618d")
    axes[2].axhline(0, ls="--", color="gray", lw=1)
    axes[2].set_ylabel("不平衡功率\n(缺额 MW)")
    axes[2].set_xlabel("时间 (min)")
    axes[2].grid(alpha=0.25)

    for te, _, _ in events:
        for ax in axes:
            ax.axvline(te / 60.0, ls="-", lw=0.7, color="steelblue", alpha=0.55)

    fig.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, "simulation.png"), dpi=150)
    plt.close(fig)


# ======================================================================
# 5. 敏感性分析：新能源占比 -> 系统等效惯量 -> 频率跌落速度/深度
# ======================================================================
def sensitivity():
    """2019 年并网新能源均为跟网型（grid-following），不提供惯量，
    因此系统等效惯量 H 随同步机占比线性下降：
        H = H_sync * (1 - 新能源占比)
    取 H_sync 使 37% 占比对应 H=4.0s（与主仿真一致）。
    """
    H_sync = H_SYNCHRONOUS
    shares = [0.20, 0.37, 0.56]        # 20% / 英国2019 37% / 西班牙 56%
    colors = ["#1f618d", "#c0392b", "#7d3c98"]
    labels = ["新能源 20%", "新能源 37%（英国2019）", "新能源 56%（西班牙）"]

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10.5, 8.2))

    fmin_list, rocof_list, tlf_list = [], [], []
    for share, color, label in zip(shares, colors, labels):
        H = H_sync * (1 - share)
        result = simulate(H=H, duration=200.0)
        t = result["time"]
        f = result["frequency"]
        rocof = result["rocof"]
        fmin = f.min()
        rmax = np.abs(rocof).max()
        t_lfdd = next((te for te, kind, _ in result["events"] if kind == "load_shed"), None)
        fmin_list.append(fmin)
        rocof_list.append(rmax)
        tlf_list.append(t_lfdd if t_lfdd is not None else float("nan"))

        ax1.plot(t / 60.0, f, lw=2, color=color, label=label)
        i_min = int(np.argmin(f))
        ax1.annotate(f"{fmin:.2f}Hz", xy=(t[i_min] / 60.0, fmin),
                     xytext=(t[i_min] / 60.0 + 8, fmin - 0.03),
                     color=color, fontsize=9,
                     arrowprops=dict(arrowstyle="->", color=color, lw=0.7))

    ax1.axhline(50.0, ls="--", color="gray", lw=1)
    ax1.axhline(48.8, ls=":", color="purple", lw=1, label="低频减载线 48.8Hz")
    ax1.set_xlabel("时间 (min)")
    ax1.set_ylabel("系统频率 (Hz)")
    ax1.set_title("敏感性分析：新能源占比越高 → 等效惯量越低 → 频率跌落越快越深", fontsize=12)
    ax1.legend(fontsize=9, loc="lower right")
    ax1.grid(alpha=0.25)

    x = np.arange(len(shares))
    ax2b = ax2.twinx()
    ax2.bar(x - 0.18, rocof_list, width=0.36, color="#8e44ad", label="RoCoF 峰值 (Hz/s)")
    ax2b.bar(x + 0.18, tlf_list, width=0.36, color="#1f618d", label="跌至48.8Hz用时 (s)")
    ax2.axhline(0.125, ls="--", color="orange", lw=1)
    ax2.text(2.45, 0.135, "参考 RoCoF 线 0.125Hz/s（不是模型触发条件）", fontsize=8, color="orange", ha="right")
    ax2.set_xticks(x)
    ax2.set_xticklabels(labels)
    ax2.set_ylabel("RoCoF 峰值 (Hz/s)")
    ax2b.set_ylabel("跌至 48.8Hz 用时 (s)")
    ax2.set_title("教学模型对比：占比↑ → RoCoF↑、越过频率阈值更快", fontsize=11)
    h1, l1 = ax2.get_legend_handles_labels()
    h2, l2 = ax2b.get_legend_handles_labels()
    ax2.legend(h1 + h2, l1 + l2, fontsize=9, loc="upper left")
    ax2.grid(alpha=0.25, axis="y")

    fig.subplots_adjust(left=0.08, right=0.85, top=0.92, bottom=0.07, hspace=0.38)
    fig.savefig(os.path.join(OUTPUT_DIR, "sensitivity.png"), dpi=150)
    plt.close(fig)
    return list(zip(shares, fmin_list, rocof_list, tlf_list))


if __name__ == "__main__":
    # 主程序就是运行路线：单次仿真 -> 生成图 -> 改新能源占比重跑 -> 打印摘要。
    result = simulate()
    plot_timeline()
    plot_propagation()
    plot_simulation(result)

    # 敏感性分析：新能源占比 -> 惯量 -> 频率跌落
    print("\n== 敏感性分析（新能源占比 → 等效惯量 → 频率跌落）==")
    sens = sensitivity()
    for share, fmin, rmax, tlf in sens:
        Hv = H_SYNCHRONOUS * (1 - share)
        print(f"  新能源占比 {share*100:>3.0f}%  H={Hv:.2f}s  "
              f"频率最低 {fmin:.3f}Hz  RoCoF峰值 {rmax:.3f}Hz/s  "
              f"跌至48.8Hz用时 {tlf:.1f}s")

    # 打印关键事件与仿真结果
    print("\n== 关键事件 ==")
    for event_time, _, label in result["events"]:
        print(f"  t={event_time:6.2f}s  {label}")
    print(f"\n频率最低点：{result['frequency'].min():.3f} Hz")
    print(f"最大 RoCoF：{np.abs(result['rocof']).max():.3f} Hz/s")
    print(f"最大功率缺额：{result['imbalance_mw'].min():.0f} MW")
    print(f"\n图片已保存到：{OUTPUT_DIR}")
    print("文件：timeline.png / propagation.png / simulation.png / sensitivity.png")
