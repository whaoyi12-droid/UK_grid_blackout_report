% uk_blackout_freq.m
% 英国 8·9 大停电 —— 系统频率响应仿真（等效单机摆动方程）
% 与 Python 版 blackout_analysis.py 等价，用于交叉验证
% 需要 MATLAB R2018b 及以上（用到 yline / xline）
clear; clc; close all;

%% 参数
f0 = 50;          % 额定频率 Hz
H  = 4;           % 系统等效惯量 s（跟网型新能源占比越高，H 越低）
S  = 35e9;        % 基准容量 W
D  = 600e6;       % 负荷频率阻尼 W/Hz
K  = 900e6;       % 一次调频增益 W/Hz（备用不足）
Tg = 15;          % 调速器时间常数 s

dt = 0.02; T = 120; N = round(T/dt);
t  = (0:N)*dt;
f  = zeros(1,N+1); f(1) = f0;
df = 0; Pgov = 0; Pimb = 0;
coef = f0/(2*H*S);      % d(df)/dt = coef * (Pimb - D*df + Pgov)

%% 事件序列
Pimb = Pimb - 1378e6;   % 事件1：雷击 + 燃气/风电脱网，缺额 1378 MW
trig_rocof = false; trig_lfdd = false;
t_event = [0]; lab_event = ["缺额≈1378MW"];

for k = 1:N
    if ~trig_rocof && f(k) < 49.5
        trig_rocof = true; Pimb = Pimb - 600e6;
        t_event(end+1) = t(k); lab_event(end+1) = "RoCoF/反孤岛 DG-600MW";
    end
    if ~trig_lfdd && f(k) < 48.8
        trig_lfdd = true; Pimb = Pimb + 1000e6;
        t_event(end+1) = t(k); lab_event(end+1) = "低频减载 +1000MW";
    end
    Pgov = Pgov + (-K*df - Pgov)/Tg*dt;
    rocof = coef*(Pimb - D*df + Pgov);
    df = df + rocof*dt;
    f(k+1) = f0 + df;
end
rocof = gradient(f, dt);

%% 绘图
figure('Color','w','Position',[100 100 900 420]);
plot(t/60, f, 'LineWidth', 2, 'Color', [0.72 0.16 0.13]); hold on;
yline(50,  '--k');
yline(49.5,':', 'Color',[0.90 0.50 0.00]);
yline(48.8,':', 'Color',[0.50 0.20 0.60]);
for k = 1:numel(t_event)
    xline(t_event(k)/60, '--', 'Color', [0.30 0.50 0.70]);
    text(t_event(k)/60 + 0.3, 49.75 - (k-1)*0.45, char(lab_event(k)), 'FontSize', 8);
end
xlabel('时间 (min)'); ylabel('系统频率 (Hz)');
title('英国 8·9 大停电 —— 频率跌落与低频减载（MATLAB）');
grid on; ylim([48.6 50.2]);

%% 结果
fprintf('最低频率   %.3f Hz\n', min(f));
fprintf('最大 RoCoF  %.3f Hz/s\n', max(abs(rocof)));
fprintf('最大缺额   %.0f MW\n', min(Pimb)/1e6 * -1);

%% Simulink 等价框图说明（供搭模型参考）：
%   功率缺额 Step -> Sum(±) -> Gain[1/(2H*S/f0)] -> Integrator -> 频率偏差 Δf
%     反馈1（阻尼） : Gain[D] * Δf
%     反馈2（调速器）: Transfer Fcn [K/(Tg*s+1)]，输入 -Δf
%     低频减载（开关）: 当 Δf < -1.2 Hz 时切除 1000 MW（可用 Stateflow / Switch）
