# -*- coding: utf-8 -*-
"""绘制 Simulink 流程框图（摆动方程的框图实现），生成 simulink_block.png"""
import os
import platform
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import FancyBboxPatch, Circle

# Prefer CJK fonts actually bundled with each OS; old Matplotlib can resolve
# these names without the newer addfont API.
font_candidates = {
    "Windows": ["SimHei", "Microsoft YaHei"],
    "Darwin": ["Songti SC", "Heiti TC", "AppleGothic", "Arial Unicode MS"],
    "Linux": ["WenQuanYi Micro Hei", "Noto Sans CJK SC"],
}.get(platform.system(), ["SimHei", "DejaVu Sans"])
for font_name in font_candidates:
    try:
        font_manager.findfont(font_name, fallback_to_default=False)
        plt.rcParams["font.sans-serif"] = [font_name]
        break
    except ValueError:
        continue
plt.rcParams["axes.unicode_minus"] = False

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "运行结果")
os.makedirs(OUTPUT_DIR, exist_ok=True)

fig, ax = plt.subplots(figsize=(13, 7.5))
ax.set_xlim(0, 13)
ax.set_ylim(0, 7.5)
ax.axis("off")
ax.set_title("英国 8·9 大停电 —— 系统频率响应的 Simulink 框图（摆动方程实现）",
             fontsize=13, pad=12)


def box(x, y, w, h, text, fc="#d6e4f0", ec="#1f3864"):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02",
                       fc=fc, ec=ec, lw=1.6)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=9.5)


def sumpoint(x, y):
    c = Circle((x, y), 0.30, fc="white", ec="#1f3864", lw=1.6, zorder=3)
    ax.add_patch(c)
    ax.text(x, y, "+", ha="center", va="center", fontsize=15,
            fontweight="bold", color="#1f3864", zorder=4)


def arrow(x1, y1, x2, y2, color="#333333"):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5,
                                shrinkA=0, shrinkB=0))


def line(x1, y1, x2, y2, color="#333333"):
    ax.plot([x1, x2], [y1, y2], color=color, lw=1.5)


# ---- 主链路（y = 5.3）----
box(0.4, 4.85, 1.8, 0.9, "功率缺额\nΔP_imb", fc="#fde9d9")      # 输入 Step
sumpoint(3.15, 5.3)
box(4.5, 4.85, 1.9, 0.9, "增益\nf0/(2H·S)")                     # 系统增益
box(7.5, 4.85, 1.9, 0.9, "积分器\n1/s")                          # 积分器
ax.text(10.6, 5.3, "Δf\n(频率偏差)", ha="center", va="center", fontsize=11)

arrow(2.2, 5.3, 2.85, 5.3)
arrow(3.45, 5.3, 4.5, 5.3)
arrow(6.4, 5.3, 7.5, 5.3)
arrow(9.4, 5.3, 10.4, 5.3)

# ---- 反馈竖线（x = 9.7，向下）----
line(9.7, 5.3, 9.7, 0.6)

# ---- 阻尼反馈 D（y = 2.5）----
box(7.4, 2.05, 1.3, 0.9, "阻尼\nD", fc="#e2f0d9")
arrow(9.7, 2.5, 8.7, 2.5)                       # 竖线 → 阻尼右侧
arrow(7.4, 2.5, 3.15, 2.5)                      # 阻尼输出向左
arrow(3.15, 2.5, 3.15, 5.0)                     # 向上进入 Sum
ax.text(3.35, 4.72, "-", fontsize=15, fontweight="bold", color="#c0392b")

# ---- 调速器反馈 K/(Tg·s+1)（y = 0.6）----
box(5.4, 0.15, 2.2, 0.9, "调速器\nK/(Tg·s+1)", fc="#e2f0d9")
arrow(9.7, 0.6, 7.6, 0.6)                       # 竖线 → 调速器右侧
arrow(5.4, 0.6, 2.4, 0.6)                       # 调速器输出向左
arrow(2.4, 0.6, 2.4, 4.9)                       # 向上
arrow(2.4, 4.9, 2.85, 5.1)                      # 向右进入 Sum 左下
ax.text(2.2, 4.72, "+", fontsize=15, fontweight="bold", color="#1e8449")

# ---- 低频减载（y = 6.9，上方）----
box(4.6, 6.45, 2.5, 0.9, "低频减载\nΔf<-1.2Hz 切 1000MW", fc="#f5d9e8")
line(9.9, 5.3, 9.9, 6.9)                        # 从输出向上分叉
arrow(9.9, 6.9, 7.1, 6.9)                       # 向左进入模块右侧
arrow(4.6, 6.9, 3.15, 6.9)                      # 模块输出向左
arrow(3.15, 6.9, 3.15, 5.6)                     # 向下进入 Sum 上方
ax.text(3.35, 6.25, "+", fontsize=15, fontweight="bold", color="#1e8449")

# ---- 图例 ----
ax.text(0.4, 0.5, "橙色=输入/控制  蓝色=系统动态(摆动方程)  绿色=反馈(阻尼/调速器)  粉色=低频减载",
        fontsize=9, color="#555555")

fig.tight_layout()
out = os.path.join(OUTPUT_DIR, "simulink_block.png")
fig.savefig(out, dpi=150)
plt.close(fig)
print("已生成：", out)
