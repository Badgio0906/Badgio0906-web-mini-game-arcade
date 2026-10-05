// Isolate Chromium/CDP single-move gesture behavior without loading any game.
import { chromium } from 'playwright';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const count of [2,3]){
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();
 await p.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><style>canvas{display:block;width:360px;height:550px;touch-action:none}button{position:absolute;left:31px;top:755px;width:160px;height:44px;touch-action:manipulation}</style><canvas></canvas><button>Retry</button><script>window.events=[];for(const type of ["pointerdown","pointerup","click"])document.addEventListener(type,e=>events.push({type,target:e.target.tagName,time:performance.now()}),true);document.querySelector("canvas").addEventListener("pointerdown",e=>{e.preventDefault();e.target.setPointerCapture(e.pointerId)});</script>');
 const s=await c.newCDPSession(p);await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:59,y:439,id:4}]});
 if(count===3)await s.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:439,id:4}]});
 await s.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:331,y:439,id:4}]});await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await s.detach();await p.waitForTimeout(1100);await p.locator('button').tap();await p.waitForTimeout(500);console.log(JSON.stringify({count,events:await p.evaluate(()=>events)}));await c.close();
}}finally{await browser.close();}
