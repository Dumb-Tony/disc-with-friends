import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--use-angle=d3d11']});
try {
 const p=await browser.newPage({viewport:{width:1200,height:850}});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  if(!localStorage.getItem('dwf-round-v1')) localStorage.setItem('dwf-round-v1',JSON.stringify({version:1,course:'sunny-pines-v1',index:0,scores:Array(9).fill(null),strokes:2,penalties:0,practice:false,done:false,holed:false,lie:{x:10,z:20}}));
 });
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:43928');
 await p.click('#start');await p.mouse.move(600,400);await p.mouse.down();await p.mouse.move(600,590,{steps:8});await p.mouse.up();
 assert.equal((await p.evaluate(()=>discLab.snapshot())).count,3);
 await p.keyboard.press('Shift+Slash');await p.click('[data-course="cloud-carnival-v1"]');await p.click('[data-course="sunny-pines-v1"]');
 let s=await p.evaluate(()=>discLab.snapshot());assert.equal(s.count,2);assert.deepEqual(s.lie,{x:10,z:20});
 await p.reload();s=await p.evaluate(()=>discLab.snapshot());assert.equal(s.count,2);assert.deepEqual(s.lie,{x:10,z:20});
 await p.goto((process.env.TEST_URL||'http://127.0.0.1:43928')+'?course=cloud-carnival-v1');
 s=await p.evaluate(()=>discLab.snapshot());assert.equal(s.round.course,'cloud-carnival-v1');assert.deepEqual(errors,[]);
 console.log('Legacy checkpoint migration, mid-flight course switching and direct course link passed.');
}finally{await browser.close();}
