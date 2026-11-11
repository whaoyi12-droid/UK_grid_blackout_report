import { chromium } from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('validation/ppt-v3-replay',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/#timeline',{waitUntil:'networkidle'});await page.waitForTimeout(1200);
 assert.equal(await page.locator('#timeline .timeline-item').count(),5);
 assert.deepEqual(await page.locator('#timeline .timeline-item').evaluateAll(els=>els.map(e=>e.dataset.eventId)),['before','fault','shedding','frequency','restoration']);
 const scene=page.locator('.timeline-scene .grid-scene');
 assert.equal(await scene.getAttribute('data-front-powered'),'true');
 await page.screenshot({path:'validation/ppt-v3-replay/before.png'});
 async function noCurrent(id){const g=scene.locator(`[data-path="${id}"]`);assert.equal(await g.getAttribute('data-powered'),'false');assert.equal(await g.locator('.flow').evaluate(e=>getComputedStyle(e).opacity),'0');assert.equal(await g.locator('.flow').evaluate(e=>getComputedStyle(e).animationName),'none');}
 async function otherGrid(){const g=scene.locator('[data-path="remote-corridor"]');assert.equal(await g.getAttribute('data-powered'),'true');assert(Number(await g.locator('.flow').first().evaluate(e=>getComputedStyle(e).opacity))>0);assert.equal(await scene.locator('[data-load="city"]').getAttribute('data-powered'),'true');}
 await page.locator('#timeline [data-event-id="fault"]').click();await page.waitForTimeout(800);
 await noCurrent('wind-feed');await noCurrent('gas-feed');await noCurrent('affected-corridor');await otherGrid();
 assert.equal(await scene.locator('[data-switch-device="gas"]').getAttribute('data-switch-open'),'true');
 await page.screenshot({path:'validation/ppt-v3-replay/fault.png'});
 await page.waitForTimeout(3100);await noCurrent('affected-corridor');await otherGrid();assert.equal(await scene.getAttribute('data-line-fault'),'false');
 await page.locator('#timeline [data-event-id="shedding"]').click();await page.waitForTimeout(3400);
 for(const load of ['homes','workshop'])assert.equal(await scene.locator(`[data-load="${load}"]`).getAttribute('data-powered'),'false');
 await otherGrid();await page.screenshot({path:'validation/ppt-v3-replay/shedding.png'});
 await page.locator('#timeline [data-event-id="frequency"]').click();await page.waitForTimeout(700);
 assert.equal(await page.getByTestId('event-clock').getAttribute('data-display-time'),'16:57:00');
 assert.equal(await scene.locator('.remote-grid.frequency-recovery').count(),1);await noCurrent('affected-corridor');
 for(const load of ['homes','workshop'])assert.equal(await scene.locator(`[data-load="${load}"]`).getAttribute('data-powered'),'false');
 await page.screenshot({path:'validation/ppt-v3-replay/frequency.png'});
 await page.locator('#timeline [data-event-id="restoration"]').click();await page.waitForTimeout(1100);
 assert.equal(await page.getByTestId('event-clock').getAttribute('data-display-time'),'17:06:00');
 assert.equal(await scene.locator('[data-load="homes"]').getAttribute('data-powered'),'true');assert.equal(await scene.locator('[data-load="workshop"]').getAttribute('data-powered'),'false');
 await page.waitForTimeout(2700);assert.equal(await page.getByTestId('event-clock').getAttribute('data-display-time'),'17:37:00');assert.equal(await scene.locator('[data-load="workshop"]').getAttribute('data-powered'),'true');
 await noCurrent('wind-feed');await noCurrent('gas-feed');await noCurrent('affected-corridor');await otherGrid();
 await page.screenshot({path:'validation/ppt-v3-replay/restored.png'});
 const dimensions=[];
 for(const size of [{width:1440,height:900},{width:1366,height:768},{width:1920,height:1080},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(size);await page.waitForTimeout(350);
  const d=await page.evaluate(()=>{const b=document.querySelector('#timeline .slide-body'),c=document.querySelector('.clock-face').getBoundingClientRect(),t=document.querySelector('.timeline-scene .rotor').getBoundingClientRect(),s=document.querySelector('.timeline-scene');return {margin:b.getBoundingClientRect().left,width:b.clientWidth,height:b.clientHeight,content:b.scrollHeight,noHorizontal:document.documentElement.scrollWidth<=innerWidth+1,clockRight:c.right,turbineLeft:t.left,noClockCollision:c.right<t.left||c.bottom<t.top,border:getComputedStyle(s).borderTopWidth};});
  assert(d.noHorizontal);assert(d.noClockCollision);assert.equal(d.border,'0px');
  if(size.width>=1366){assert(d.margin>=45);assert(d.content<=d.height+2);}
  dimensions.push({...size,...d});
  if(size.width===1366||size.width===390)await page.screenshot({path:`validation/ppt-v3-replay/${size.width}.png`});
 }
 assert.equal(await page.locator('.timeline-scene-actions').count(),0);
 assert.equal(errors.length,0,JSON.stringify(errors));
 await writeFile('validation/ppt-v3-replay/report.json',JSON.stringify({passed:true,pptStages:4,beforePreserved:true,noCurrentOnGreyPaths:true,remoteNetworkContinuous:true,frequencyDoesNotRestoreShedLoads:true,restorationRangeAnimated:true,dimensions,errors},null,2));
 console.log('PASS: v3 PPT four-stage replay and power-path continuity.');
}finally{await browser.close();}
