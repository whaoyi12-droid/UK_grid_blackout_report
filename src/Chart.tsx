import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent, MarkPointComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { COMPARISONS, PRESETS, type Simulation } from './model';
echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, MarkPointComponent, CanvasRenderer]);

export default function Chart({ result, compare, cursor, windowSeconds, metric = 'frequency' }: { result: Simulation; compare: boolean; cursor: number; windowSeconds: number; metric?: 'frequency' | 'rocof' | 'imbalance_mw' }) {
  const element = useRef<HTMLDivElement>(null), chart = useRef<echarts.EChartsType | null>(null);
  useEffect(() => {
    if (!element.current) return;
    chart.current = echarts.init(element.current, undefined, { renderer: 'canvas' });
    const observer = new ResizeObserver(() => chart.current?.resize()); observer.observe(element.current);
    return () => { observer.disconnect(); chart.current?.dispose(); chart.current = null; };
  }, []);
  useEffect(() => {
    const frequency = metric === 'frequency';
    const lines: any[] = [];
    if (compare && frequency) COMPARISONS.forEach((r, i) => lines.push({ name: `${PRESETS[i].share}% 情景 · H=${r.H.toFixed(2)} s`, type: 'line', showSymbol: false, data: r.time.map((t, n) => [t, r.frequency[n]]), lineStyle: { color: ['#86a0b7', '#ffffff', '#a9d6e6'][i], width: 1.5, type: ['dotted', 'dashed', 'dotted'][i] }, itemStyle: { color: ['#86a0b7', '#ffffff', '#a9d6e6'][i] }, silent: false }));
    const thresholds = frequency ? [{ yAxis: 49.5, name: '49.5 · 额外脱网门槛' }, { yAxis: 48.8, name: '48.8 · 低频减载' }] : metric === 'rocof' ? [{ yAxis: -.125, name: '−0.125 · 参考线' }, { yAxis: .125, name: '+0.125 · 参考线' }] : [];
    lines.push({ name: frequency ? '当前情景 · 频率' : metric === 'rocof' ? 'RoCoF' : '功率不平衡', type: 'line', showSymbol: false, data: result.time.map((t, i) => [t, result[metric][i]]), lineStyle: { color: '#56ccf2', width: frequency ? 2.6 : 1.8 }, itemStyle: { color: '#56ccf2' }, areaStyle: frequency ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(86,204,242,.13)' }, { offset: .5, color: 'rgba(86,204,242,.04)' }, { offset: 1, color: 'rgba(86,204,242,0)' }]) } : undefined,
      markLine: { silent: true, symbol: 'none', label: { color: '#99b1c6', fontSize: 10, position: 'insideEndTop', formatter: (p: any) => p.name }, lineStyle: { color: '#607b91', type: 'dashed', opacity: .7 }, data: [...thresholds, { xAxis: cursor, name: '', lineStyle: { color: '#56ccf2', type: 'solid', opacity: .6 }, label: { show: false } }] },
      markPoint: frequency ? { symbol: 'circle', symbolSize: 7, label: { show: false }, data: [{ coord: [result.nadirTime, result.minimum], name: '最低点' }] } : undefined,
    });
    chart.current?.setOption({ animation: false, backgroundColor: 'transparent', grid: { left: frequency ? 53 : 64, right: 20, top: frequency ? 32 : 25, bottom: 35 }, tooltip: { trigger: 'axis', backgroundColor: '#102d43', borderColor: '#35556a', textStyle: { color: '#e5f3fa', fontSize: 12 }, confine: true, valueFormatter: (v: number) => Number(v).toFixed(metric === 'imbalance_mw' ? 0 : 3) }, xAxis: { type: 'value', min: 0, max: windowSeconds, name: 's', nameLocation: 'end', nameTextStyle: { color: '#8ba8bb' }, axisLabel: { color: '#8ba8bb', fontSize: 11 }, axisLine: { lineStyle: { color: '#294458' } }, splitLine: { show: false } }, yAxis: { type: 'value', min: frequency ? Math.floor(Math.min(48.7, result.minimum - .04) * 10) / 10 : undefined, max: frequency ? 50.1 : metric === 'rocof' ? Math.max(.16, ...result.rocof) : undefined, name: frequency ? 'Hz' : metric === 'rocof' ? 'Hz/s' : 'MW', nameTextStyle: { color: '#8ba8bb' }, axisLabel: { color: '#8ba8bb', fontSize: 11, formatter: (v: number) => frequency ? v.toFixed(1) : `${v}` }, splitLine: { lineStyle: { color: 'rgba(140,175,198,.10)' } } }, series: lines }, { notMerge: true });
  }, [result, compare, cursor, windowSeconds, metric]);
  return <div className={`chart ${metric === 'frequency' ? 'chart-main' : 'chart-small'}`} ref={element} role="img" aria-label={metric === 'frequency' ? `频率响应曲线，最低 ${result.minimum.toFixed(3)} Hz；可用下方时间滑块读取数据` : `${metric === 'rocof' ? '频率变化率' : '功率不平衡'}曲线，数据可通过时间滑块读取`} />;
}
