import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output=new URL('../validation/scenes/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1100},reducedMotion:'no-preference'});
const page=await context.newPage(),errors=[],external=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',r=>{if(!r.request().url().startsWith('http://127.0.0.1:4173/')){external.push(r.request().url());return r.abort();}return r.continue();});
async function snap(name){await page.screenshot({path:fileURLToPath(new URL(name,output))});}
try{
 await page.goto('http://127.0.0.1:4173/scene.html',{waitUntil:'networkidle'});
 for(const [index,variant] of ['line','pixel','layered'].entries()){
  await page.getByRole('tab').nth(index).click();
  for(const phase of [0,1,2,3,4,5,6]){
   await page.locator('.phase-selector button').nth(phase).click();
   const state=await page.locator('svg.grid-scene').evaluate(el=>({phase:el.dataset.phase,variant:el.dataset.variant,loads:Array.from(el.querySelectorAll('[data-load]')).map(e=>[e.dataset.load,e.dataset.powered])}));
   assert.equal(state.variant,variant);assert.equal(state.loads[0][1],'true');
   assert.equal(state.loads[1][1],[3,4].includes(phase)?'false':'true');
   assert.equal(state.loads[2][1],[3,4,5].includes(phase)?'false':'true');
   if(phase===3||phase===4)assert.equal(await page.locator('[data-switch-open="true"]').count(),4);
   if(phase===6)assert.equal(await page.locator('[data-switch-open="true"]').count(),2);
  }
  await page.locator('.phase-selector button').nth(3).click();await page.waitForTimeout(1200);
  await page.locator('.scene-canvas').screenshot({path:fileURLToPath(new URL(`${variant}-defence.png`,output))});
  await page.locator('.phase-selector button').nth(0).click();await page.waitForTimeout(1200);
  await page.locator('.scene-canvas').screenshot({path:fileURLToPath(new URL(`${variant}-normal.png`,output))});
 }
 checks.push('All 3 styles × 7 phases: retained load stays on; A/B shed/stable/restore states and open switches verified');
 await page.getByRole('tab').nth(0).click();await page.locator('.phase-selector button').nth(1).click();
 assert(await page.locator('.fault-flash').evaluate(e=>e.getAnimations().length>0));
 await page.waitForTimeout(1400);assert.equal(await page.locator('.fault-flash').evaluate(e=>getComputedStyle(e).opacity),'0');
 await page.getByRole('button',{name:'重放当前动作'}).click();await page.waitForTimeout(90);
 assert(await page.locator('.fault-flash').evaluate(e=>Number(getComputedStyle(e).opacity)>0));
 await page.getByRole('button',{name:'查看架空输电线路',exact:true}).click();assert.match(await page.locator('.scene-explanation').innerText(),/16:52:53/);
 await page.getByRole('button',{name:'关闭设备说明'}).click();
 await page.getByRole('button',{name:'三案同屏'}).click();assert.equal(await page.locator('svg.grid-scene').count(),3);
 await page.locator('.compare-caption button').nth(2).click();assert.equal(await page.locator('svg.grid-scene').getAttribute('data-variant'),'layered');
 await page.getByRole('button',{name:'背景试放'}).click();assert(await page.locator('.background-caption').isVisible());await snap('background-preview.png');
 await page.getByRole('button',{name:'背景试放'}).click();
 await page.getByRole('checkbox',{name:'设备名称',exact:true}).uncheck();assert.equal(await page.locator('svg text').filter({hasText:'Hornsea'}).count(),0);
 await page.getByRole('checkbox',{name:'设备名称',exact:true}).check();
 await page.getByRole('checkbox',{name:'场景动效',exact:true}).uncheck();assert.equal(await page.locator('.rotor').first().evaluate(e=>e.getAnimations().length),0);
 await page.getByRole('checkbox',{name:'场景动效',exact:true}).check();
 await page.locator('.phase-selector button').nth(0).click();await page.getByRole('button',{name:'播放全过程',exact:true}).click();await page.waitForTimeout(5800);await page.getByRole('button',{name:'暂停演示',exact:true}).click();assert.equal(await page.locator('svg.grid-scene').getAttribute('data-phase'),'fault');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出当前 SVG'}).click();await(await download).saveAs(fileURLToPath(new URL('exported.svg',output)));
 checks.push('Transient fault clears; replay, devices, comparison, background layout, labels/motion switches, autoplay and SVG export');
 await page.getByRole('button',{name:'设计与资料依据'}).click();assert(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await snap('mobile.png');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('.scene-canvas').evaluate(e=>e.scrollLeft=400);assert(await page.locator('.scene-canvas').evaluate(e=>e.scrollLeft>0));
 checks.push('Guide modal, 390 px layout and horizontally scrollable detailed scene');
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(external.length,0,JSON.stringify(external));
 await writeFile(new URL('report.json',output),JSON.stringify({passed:true,checks,errors,external},null,2));console.log('PASS: 2D scene prototypes.');
}catch(e){await snap('failure.png');await writeFile(new URL('report.json',output),JSON.stringify({passed:false,error:String(e),checks,errors,external},null,2));throw e;}
finally{await browser.close();}
