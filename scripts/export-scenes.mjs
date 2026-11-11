import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const root=new URL('../public/scene-models/',import.meta.url);
await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:4173/scene.html',{waitUntil:'networkidle'});
const manifest=[];
for(const [index,style] of ['line','pixel','layered'].entries()){
 await page.getByRole('tab').nth(index).click();
 for(let phase=0;phase<7;phase++){
  await page.locator('.phase-selector button').nth(phase).click();
  const result=await page.locator('.scene-canvas svg.grid-scene').evaluate(el=>{
   const clone=el.cloneNode(true);clone.setAttribute('width','1400');clone.setAttribute('height','660');
   clone.querySelectorAll('[tabindex]').forEach(n=>{n.removeAttribute('tabindex');n.removeAttribute('role');});
   return {phase:el.dataset.phase,svg:new XMLSerializer().serializeToString(clone)};
  });
  const name=`${style}-${phase}-${result.phase}.svg`;
  await writeFile(new URL(name,root),result.svg);
  manifest.push({style,phase:result.phase,file:name});
 }
}
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2));
await browser.close();console.log('Exported 21 independent SVG scene models.');
