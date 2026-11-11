import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('validation/integrated-scene',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
try {
 await page.goto('http://127.0.0.1:4173/#timeline',{waitUntil:'networkidle'});await page.waitForTimeout(1400);
 await page.getByRole('button',{name:'重放电网动作'}).click();await page.waitForTimeout(600);
 const scene=page.locator('.timeline-scene svg.grid-scene');assert.equal(await scene.getAttribute('data-variant'),'hybrid');
 assert.equal(await scene.getAttribute('data-line-fault'),'true');
 assert.equal(await scene.locator('.line-isolated .flow').evaluate(el=>getComputedStyle(el).opacity),'0');
 assert.equal(await scene.locator('.line-isolated .flow').evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await scene.locator('[data-switch-device="gas"]').getAttribute('data-switch-open'),'true');
 assert(Number(await scene.locator('.gas-trip-ring').evaluate(el=>getComputedStyle(el).opacity))>.3);
 await page.screenshot({path:'validation/integrated-scene/fault.png'});
 await page.waitForTimeout(2700);assert.equal(await scene.getAttribute('data-line-fault'),'false');
 await page.locator('#timeline .timeline-item').nth(3).click();await page.waitForTimeout(650);
 assert.equal(await scene.locator('.frequency-recovery').count(),1);assert(await scene.locator('.frequency-recovery .wire').first().evaluate(el=>el.getAnimations().length>0));
 assert.equal(await scene.locator('[data-load="homes"]').getAttribute('data-powered'),'false');assert.equal(await scene.locator('[data-switch-device="gas"]').getAttribute('data-switch-open'),'true');
 await page.screenshot({path:'validation/integrated-scene/recovery.png'});
 await page.locator('#timeline .timeline-item').nth(5).click();await page.waitForTimeout(1600);await page.screenshot({path:'validation/integrated-scene/restored.png'});
 const rows=await page.locator('#timeline .timeline-item').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().top));assert(new Set(rows).size===1);
 await page.getByRole('button',{name:'放大电网场景'}).click();assert(await page.getByRole('dialog',{name:'电网阶段回放'}).isVisible());await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.screenshot({path:'validation/integrated-scene/mobile.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await writeFile('validation/integrated-scene/report.json',JSON.stringify({passed:true,hybridIntegrated:true,horizontalEvents:true,gasSwitchHighlight:true,faultFlowStopped:true,lineRestoresAfterCompressedTransient:true,frequencyRecoveryPulse:true,shedLoadsStayOffDuringFrequencyRecovery:true,modalAndMobile:true},null,2));
 console.log('PASS integrated scene checks.');
} finally {await browser.close();}
