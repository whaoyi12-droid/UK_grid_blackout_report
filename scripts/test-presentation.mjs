import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const folder = new URL('../validation/presentation/', import.meta.url);
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
const page = await context.newPage();
const errors = [], external = [], checks = [], layouts = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await context.route('**/*', r => { if (!r.request().url().startsWith('http://127.0.0.1:4173/')) { external.push(r.request().url()); return r.abort(); } return r.continue(); });
async function screen(id) {
  await page.locator(`.site-header a[href="#${id}"]`).first().click();
  await page.waitForFunction(id => document.getElementById(id)?.classList.contains('is-active'), id);
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('.slide.is-active').getAttribute('id'), id);
}
async function shot(name) { await page.screenshot({ path: fileURLToPath(new URL(name, folder)) }); }
try {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  assert.deepEqual(await page.locator('main > section.slide').evaluateAll(els => els.map(el => el.id)), ['top','timeline','lab','propagation','analysis','resources']);
  assert.deepEqual(await page.locator('.site-header nav a').evaluateAll(els => els.map(el => el.hash)), ['#timeline','#lab','#propagation','#analysis']);
  await shot('desktop-home.png');
  await page.mouse.move(900, 450); await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('.slide.is-active').getAttribute('id'), 'timeline');
  assert.equal(await page.locator('.site-header a[href="#timeline"]').getAttribute('aria-current'), 'page');
  const snap = await page.evaluate(() => { const el = document.querySelector('.presentation-deck'); return { top: el.scrollTop, height: el.clientHeight }; });
  assert(Math.abs(snap.top - snap.height) < 2);
  await shot('desktop-timeline.png');
  await page.getByRole('button', { name: '下一事件', exact: true }).click();
  await page.waitForTimeout(60);
  assert(await page.locator('.event-content').evaluate(el => Number(getComputedStyle(el).opacity) < 1));
  await page.waitForFunction(() => document.querySelector('[data-testid="event-clock"]').getAttribute('data-time') === '16:52:00');
  await page.waitForTimeout(350);
  const stagger = await page.locator('.event-content').evaluate(el => Array.from(el.children).flatMap(c => c.getAnimations().map(a => a.effect.getTiming().delay)));
  assert(new Set(stagger).size >= 3, JSON.stringify(stagger));
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: '播放事故', exact: true }).click();
  await page.waitForTimeout(6050); await page.getByRole('button', { name: '暂停回放', exact: true }).click();
  assert.equal(await page.getByTestId('event-clock').getAttribute('data-time'), '16:53:00');
  assert.equal(await page.locator('#timeline [data-event-id="shedding"]').getAttribute('aria-pressed'),'true');
  checks.push('Wheel snaps one full screen; active navigation; timeline exit and staggered entrance; event replay');
  await screen('propagation');
  await page.getByRole('button', { name: '额外电源脱网：查看解释', exact: true }).click();
  await page.waitForTimeout(1350);
  assert.match(await page.locator('.node-detail').innerText(), /49.5 Hz/);
  await page.locator('.stage-buttons button').nth(5).click();
  await page.waitForTimeout(700); await shot('desktop-propagation.png');
  await screen('analysis'); await page.getByRole('tab', { name: /系统隐患/ }).click();
  await page.waitForTimeout(1350); assert.match(await page.locator('#analysis-content').innerText(), /协调/);
  await shot('desktop-analysis.png');
  await screen('lab');
  assert.equal(await page.getByTestId('minimum').innerText(), '48.788 Hz');
  await shot('desktop-lab.png');
  for (const [index, expected] of [[0, '0.230 Hz/s'], [2, '0.422 Hz/s']]) { await page.locator('.preset').nth(index).click(); assert.equal(await page.getByTestId('rocof').innerText(), expected); }
  await page.getByRole('checkbox', { name: '叠加三组原始情景' }).check();
  assert(await page.locator('.comparison-legend').isVisible());
  await page.getByRole('tab', { name: 'RoCoF', exact: true }).click();
  assert.equal(await page.getByRole('img', { name: '频率变化率曲线，数据可通过时间滑块读取' }).count(), 1);
  await page.getByRole('tab', { name: '功率缺额', exact: true }).click();
  assert.equal(await page.getByRole('img', { name: '功率不平衡曲线，数据可通过时间滑块读取' }).count(), 1);
  assert.equal(await page.locator('#inertia').count(), 0);
  for (const [share, h] of [[0,'6.35'],[20,'5.08'],[37,'4.00'],[56,'2.79'],[70,'1.90']]) { await page.locator('#renewable-share').fill(String(share)); assert.equal(await page.getByTestId('inertia-value').innerText(),h); assert.equal(await page.getByTestId('share-value').innerText(),String(share)); }
  await page.locator('.preset').nth(0).click(); assert.equal(await page.locator('#renewable-share').inputValue(),'20');
  await page.getByRole('button', { name: '恢复基准', exact: true }).click();
  await page.getByRole('button', { name: '完整 200 秒', exact: true }).click();
  await page.getByRole('slider', { name: '仿真时间', exact: true }).fill('200');
  assert.match(await page.locator('.cursor-readings').innerText(), /49.348/);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出当前数据' }).click(); assert.match((await download).suggestedFilename(), /teaching-H4.00/);
  checks.push('Graph and analysis animated swaps; presets, sliders, three chart tabs, comparisons, time cursor and export preserved');
  for (const id of ['top', 'timeline', 'propagation', 'analysis', 'lab']) {
    const noisy = await page.locator(`#${id}`).innerText(); assert(!/PPT.*页|模型与 MATLAB|模型口径|草稿核对|dt =|非实测/.test(noisy), id);
  }
  await screen('resources'); await shot('desktop-resources.png');
  await page.getByRole('button', { name: '模型与 MATLAB', exact: true }).click(); assert.match(await page.locator('.validation-badge').innerText(), /已复算/);
  const before = await page.locator('.presentation-deck').evaluate(el => el.scrollTop);
  await page.mouse.move(600, 400); await page.mouse.wheel(0, 800); await page.waitForTimeout(300);
  assert.equal(await page.locator('.presentation-deck').evaluate(el => el.scrollTop), before);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '草稿核对', exact: true }).click(); assert.equal(await page.locator('.review-item').count(), 7); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '使用说明', exact: true }).click(); assert.match(await page.locator('.modal').innerText(), /末页/); await page.keyboard.press('Escape');
  checks.push('No inline model/PPT clutter; all supporting material retained on last screen; modal scroll does not flip screens');
  await page.keyboard.press('Home'); await page.waitForTimeout(1100); assert.equal(await page.locator('.slide.is-active').getAttribute('id'), 'top');
  await page.keyboard.press('PageDown'); await page.waitForTimeout(1100); assert.equal(await page.locator('.slide.is-active').getAttribute('id'), 'timeline');
  await page.getByRole('button', { name: '下一屏', exact: true }).click(); await page.waitForTimeout(1100); assert.equal(await page.locator('.slide.is-active').getAttribute('id'), 'lab');
  checks.push('Home/PageDown and previous/next screen controls');
  for (const size of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(size); await page.waitForTimeout(300);
    for (const id of ['timeline', 'propagation', 'analysis', 'lab', 'resources']) {
      await screen(id);
      const layout = await page.locator(`#${id}`).evaluate(el => { const body = el.querySelector('.slide-body'); return { bodyHeight: body.clientHeight, contentHeight: body.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth, pageHeight: el.getBoundingClientRect().height, deckHeight: el.parentElement.clientHeight }; });
      assert(layout.overflowX <= 1); assert(Math.abs(layout.pageHeight - layout.deckHeight) <= 1);
      if (size.width >= 1366) assert(layout.contentHeight <= layout.bodyHeight + 2, `Desktop does not fit: ${id} ${JSON.stringify(layout)}`);
      layouts.push({ ...size, id, ...layout });
      if (size.width === 390 && ['timeline','lab','resources'].includes(id)) await shot(`mobile-${id}.png`);
    }
  }
  checks.push('Desktop fits each screen; 390/320 mobile overflow remains scrollable; no horizontal page overflow');
  await page.setViewportSize({width:390,height:844}); await screen('lab');
  const client = await context.newCDPSession(page);
  async function swipe(x1,y1,x2,y2) {
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
    for(let i=1;i<=7;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/7,y:y1+(y2-y1)*i/7}]});await page.waitForTimeout(25);}
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await page.waitForTimeout(1000);
  }
  await page.locator('#lab .slide-body').evaluate(el=>el.scrollTop=0);
  await swipe(375,600,375,250);
  assert.equal(await page.locator('.slide.is-active').getAttribute('id'),'lab');
  assert(await page.locator('#lab .slide-body').evaluate(el=>el.scrollTop>0));
  await page.locator('#lab .slide-body').evaluate(el=>el.scrollTop=el.scrollHeight);
  await swipe(375,600,375,250);
  assert.equal(await page.locator('.slide.is-active').getAttribute('id'),'propagation');
  await swipe(375,250,375,600);
  assert.equal(await page.locator('.slide.is-active').getAttribute('id'),'lab');
  checks.push('Real touch events: scroll within long mobile screen, then swipe across boundaries in both directions');
  await page.emulateMedia({reducedMotion:'reduce'}); await screen('timeline');
  await page.getByRole('button',{name:'重置事故回放',exact:true}).click();
  await page.getByRole('button',{name:'下一事件',exact:true}).click();
  await page.waitForTimeout(80); assert.equal(await page.getByTestId('event-clock').getAttribute('data-time'),'16:52:00');
  assert.equal(await page.locator('.event-content').evaluate(el=>el.getAnimations({subtree:true}).length),0);
  await page.goto('http://127.0.0.1:4173/#analysis',{waitUntil:'networkidle'});
  await page.waitForTimeout(300);assert.equal(await page.locator('.slide.is-active').getAttribute('id'),'analysis');
  checks.push('Reduced-motion immediate switching; direct section URL restores correct screen and nav');

  assert.equal(errors.length, 0, JSON.stringify(errors)); assert.equal(external.length, 0, JSON.stringify(external));
  await writeFile(new URL('report.json', folder), JSON.stringify({ passed: true, checks, layouts, errors, external }, null, 2));
  console.log('PASS presentation revision.');
} catch (error) {
  await shot('failure.png'); await writeFile(new URL('report.json', folder), JSON.stringify({ passed: false, error: String(error), checks, layouts, errors, external }, null, 2)); throw error;
} finally { await browser.close(); }
