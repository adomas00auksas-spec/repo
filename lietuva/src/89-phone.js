/* ---------- phone version: compact HUD, context buttons, pinch zoom, fullscreen ---------- */
const IS_PHONE=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&Math.min(screen.width,screen.height)<900)||/[?&]phone/.test(location.search);
function phoneOrient(){const land=innerWidth>innerHeight;document.body.classList.toggle('land',land);document.body.classList.toggle('port',!land)}
function phoneMenu(open){const m=$('.menu');const o=open===undefined?!m.classList.contains('open'):open;m.classList.toggle('open',o);document.body.classList.toggle('menuopen',o);$('#tbMenu').textContent=o?'✕':'☰'}
function goFull(){if(!IS_PHONE)return;const d=document.documentElement;try{const r=(d.requestFullscreen||d.webkitRequestFullscreen||(()=>{})).call(d);if(r&&r.catch)r.catch(()=>{})}catch(e){}}
// in a car the stick points where you want to go; the game turns it into throttle and steering
function phoneDrive(){const c=P&&P.inCar;if(!c||!JOY.on)return;['KeyW','KeyA','KeyS','KeyD'].forEach(k=>keys.delete(k));const m=Math.hypot(JOY.x,JOY.y);if(m<.25)return;
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),tgt=Math.atan2(JOY.y,JOY.x),d=wrap(tgt-c.ang);
  if(Math.abs(d)<2.4){keys.add('KeyW');if(Math.abs(d)>.1)keys.add(d>0?'KeyD':'KeyA')}
  else{keys.add('KeyS');const d2=wrap(tgt-c.ang-Math.PI);if(Math.abs(d2)>.1)keys.add(d2>0?'KeyA':'KeyD')}}
// show only the buttons that make sense right now
const PB={};
function phoneButtons(){if(!running)return;const inCar=!!P.inCar,inside=!!SCENE;
  const set=(id,on,txt)=>{const b=PB[id]||(PB[id]=$('#'+id));b.classList.toggle('on',on);if(txt&&b.textContent!==txt)b.textContent=txt};
  const pr=PROMPT&&!paused?PROMPT:null;const ready=!!(pr&&(pr.fn||pr.hold||pr.key==='↓'));
  set('tbE',true);PB.tbE.classList.toggle('ready',ready);
  const car=!inside&&!inCar?nearestCar(40):null;
  set('tbF',!inside&&(inCar||!!car),inCar?'IŠLIPTI':car&&car.owned===undefined&&CARS[car.model].kind!=='bike'?'VOGTI':'SĖSTI');
  set('tbJ',!inCar);set('tbSp',inCar);set('tbH',inCar);set('tbR',inCar,P.radio?'📻 '+RADIO[P.radio].n.split(' ')[0]:'RADIJAS');
  const pe=$('#prompt');if(pr&&pr.key==='F')pe.classList.add('hidden')}
function phoneSetup(){if(!IS_PHONE)return;document.body.classList.add('phone');phoneOrient();addEventListener('resize',phoneOrient);
  addEventListener('orientationchange',()=>setTimeout(()=>{phoneOrient();resize()},200));
  $('#tbMenu').addEventListener('click',e=>{e.stopPropagation();phoneMenu()});
  $$('.menu .mbtn').forEach(b=>b.addEventListener('click',()=>phoneMenu(false)));
  // tap HUD cards to open their panels
  $('.plaque').addEventListener('click',()=>running&&openSelf());$('#hStats').addEventListener('click',()=>running&&openSelf());
  $('#minimap').addEventListener('click',()=>running&&openMap());$('#hTrack').addEventListener('click',()=>running&&openQuests());
  // the prompt pill is a button too: tap = E, press and hold = hold action, ↓ = walk out
  const pe=$('#prompt');
  pe.addEventListener('pointerdown',e=>{e.preventDefault();if(!PROMPT)return;if(PROMPT.key==='↓'){if(SCENE)leaveScene();return}if(PROMPT.key==='F'){keyAction('KeyF');return}keyAction('KeyE');keys.add('KeyE')});
  const up=()=>{keys.delete('KeyE');HOLD.lock=false};pe.addEventListener('pointerup',up);pe.addEventListener('pointerleave',up);pe.addEventListener('pointercancel',up);
  // the big E button also walks you out of a building
  $('#tbE').addEventListener('pointerdown',()=>{if(PROMPT&&PROMPT.key==='↓'&&SCENE)leaveScene()});
  // pinch to zoom on the world, no stray taps
  const cv=$('#world');let pinch=null;
  cv.addEventListener('touchstart',e=>{e.preventDefault();if(e.touches.length===2){const[a,b]=e.touches;pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z:ZMUL}}},{passive:false});
  cv.addEventListener('touchmove',e=>{e.preventDefault();if(pinch&&e.touches.length===2){const[a,b]=e.touches;const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);ZMUL=clamp(pinch.z*d/pinch.d,.55,1.7);resize()}},{passive:false});
  cv.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null});
  // stop iOS double-tap zoom and rubber-band scrolling on HUD
  document.addEventListener('dblclick',e=>e.preventDefault());
  document.addEventListener('gesturestart',e=>e.preventDefault());
  ['#bNew','#bCont','#cStart'].forEach(s=>{const b=$(s);if(b)b.addEventListener('click',goFull)});
  setInterval(phoneButtons,150);resize()}
