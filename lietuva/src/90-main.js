
/* =====================================================================
   MAIN LOOP
   ===================================================================== */
let acc1=0,acc2=0,acc3=0,lastT=performance.now();
function update(dt){
  if(!running||paused)return;
  if(SCENE){updateInterior(dt);return}
  tickTime(dt);updatePlayer(dt);
  for(const c of ENT.cars){if(c===P.inCar)continue;
    if(c.ai==='traffic')updateTraffic(c,dt);else if(c.ai==='hwy')updateHwy(c,dt);else if(c.ai==='police')updatePolice(c,dt);
    else if(c.ai==='parked'||c.ai===null){if(Math.abs(c.vx)+Math.abs(c.vy)>2){c.vx*=1-2.5*dt;c.vy*=1-2.5*dt;carMove(c,dt)}}}
  ENT.cars=ENT.cars.filter(c=>!c.dead);carCollisions();
  for(const e of ENT.peds)updatePed(e,dt);ENT.peds=ENT.peds.filter(e=>!e.dead);
  if(!P.inCar){for(const c of ENT.cars){const sp=Math.hypot(c.vx,c.vy)||(c.cur||0);if(sp<130)continue;if(dist(c.x,c.y,P.x,P.y)<20&&P.inv_t<=0){hurtPlayer(sp/18,c);P.inv_t=.8;shake(6)}}}
  for(const f of ENT.fx){f.life-=dt;if(f.k==='spark'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=300*dt}else{f.r+=dt*14}}ENT.fx=ENT.fx.filter(f=>f.life>0);
  for(const b of ENT.bubbles)b.life-=dt;ENT.bubbles=ENT.bubbles.filter(b=>b.life>0);
  updateHeat(dt);tickMission(dt);
  acc1+=dt;acc2+=dt;acc3+=dt;
  if(acc1>.25){acc1=0;populate();PROMPT=findPrompt();showPrompt()}
  if(acc2>1){acc2=0;checkQuest();checkGoals();checkVisits();tickEvents();hudUpdate();updateZone()}
  if(acc3>60){acc3=0;saveGame(true)}
  // hold-to-act
  if(PROMPT&&PROMPT.hold&&PROMPT.hold.dur>0&&keys.has('KeyE')&&!HOLD.lock){HOLD.t+=dt;$('#hold').classList.remove('hidden');$('#holdI').style.width=(HOLD.t/PROMPT.hold.dur*100)+'%';
    if(HOLD.t>=PROMPT.hold.dur){HOLD.t=0;HOLD.lock=true;$('#hold').classList.add('hidden');PROMPT.hold.fn();PROMPT=findPrompt();showPrompt()}}
  else{HOLD.t=0;$('#hold').classList.add('hidden')}
  if(P.inCar){const sp=Math.hypot(P.inCar.vx,P.inCar.vy);$('#spV').innerHTML=`${Math.round(sp*.34)}<small>km/h</small>`;$('#spD').textContent=DRIFT.cur>100?`ŠONINIS ${Math.round(DRIFT.cur)}`:(G.mission&&G.mission.type==='driftc'?`${Math.round(G.mission.got)}/${G.mission.need}`:'')}
}
function showPrompt(){const el=$('#prompt');if(!PROMPT||paused){el.classList.add('hidden');return}el.classList.remove('hidden');el.querySelector('kbd').textContent=PROMPT.key;$('#promptTxt').textContent=PROMPT.text}

/* ---------- render ---------- */
let titlePan=0;
function render(){
  if(SCENE&&running){renderInterior();return}
  const Z=ZOOM;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#3D6D8D';ctx.fillRect(0,0,VW,VH);
  let fx,fy;if(running&&P){const me=P.inCar||P;fx=me.x+(P.inCar?P.inCar.vx*.35:0);fy=me.y+(P.inCar?P.inCar.vy*.35:0)-20}
  else{const V=cityById('vilnius');titlePan+=.15;fx=(V.cx-10)*TS+Math.sin(titlePan/200)*600;fy=(V.cy-6)*TS+Math.cos(titlePan/260)*300}
  const tx0=fx-VW/2/Z,ty0=fy-VH/2/Z;cam.x=lerp(cam.x,tx0,running?.12:1);cam.y=lerp(cam.y,ty0,running?.12:1);
  if(!isFinite(cam.x)){cam.x=tx0;cam.y=ty0}
  let sx=0,sy=0;if(SHAKE>0){sx=rnd(-SHAKE,SHAKE);sy=rnd(-SHAKE,SHAKE);SHAKE*=.88;if(SHAKE<.3)SHAKE=0}
  ctx.setTransform(DPR*Z,0,0,DPR*Z,(-cam.x+sx)*DPR*Z,(-cam.y+sy)*DPR*Z);
  const vx0=cam.x,vy0=cam.y,vx1=cam.x+VW/Z,vy1=cam.y+VH/Z;
  const c0=Math.floor(vx0/CHPX),c1=Math.floor(vx1/CHPX),r0=Math.floor(vy0/CHPX),r1=Math.floor(vy1/CHPX);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){if(cx<0||cy<0||cx*CH>=W||cy*CH>=H)continue;ctx.drawImage(getChunk(cx,cy),cx*CHPX,cy*CHPX)}
  // highway centre dashes
  ctx.save();ctx.strokeStyle='rgba(240,236,220,.8)';ctx.lineWidth=2;ctx.setLineDash([16,20]);
  HWYS.forEach(h=>{let on=false;for(const p of h.pts){if(p[0]*TS>vx0-400&&p[0]*TS<vx1+400&&p[1]*TS>vy0-400&&p[1]*TS<vy1+400){on=true;break}}if(!on)return;
    ctx.beginPath();h.pts.forEach((p,i)=>{const X=p[0]*TS+16,Y=p[1]*TS+16;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.stroke()});ctx.restore();
  // pickups
  for(const k of ENT.pickups){if(k.x<vx0-40||k.x>vx1+40||k.y<vy0-40||k.y>vy1+40)continue;drawPickup(k)}
  // quest target ring
  const tgt=running&&G?questTarget():null;if(tgt){const t=performance.now()/400;ctx.strokeStyle='rgba(226,161,27,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(tgt.x,tgt.y,22+Math.sin(t)*4,10+Math.sin(t)*2,0,0,7);ctx.stroke();
    ctx.fillStyle='rgba(226,161,27,.25)';ctx.fill()}
  if(running&&G&&G.mission&&G.mission.type==='race'&&G.mission.cps){G.mission.cps.forEach((c,i)=>{if(i<G.mission.i)return;ctx.fillStyle=i===G.mission.i?'rgba(181,51,43,.5)':'rgba(181,51,43,.18)';ctx.beginPath();ctx.arc(c.x,c.y,30,0,7);ctx.fill()})}
  // drawables
  const D=[];const bx0=Math.max(0,(vx0/TS>>4)-1),bx1=Math.min(BW-1,(vx1/TS>>4)),by0=Math.max(0,(vy0/TS>>4)-1),by1=Math.min(BH-1,((vy1+200)/TS>>4));
  for(let by=by0;by<=by1;by++)for(let bx=bx0;bx<=bx1;bx++){const k=by*BW+bx;for(const b of BBUCK[k]){if((b.x+b.w)*TS<vx0||b.x*TS>vx1||(b.y+b.h)*TS<vy0||b.y*TS-(b.ht||0)-80>vy1)continue;D.push({y:(b.y+b.h)*TS,b})}
    for(const t of TBUCK[k]){if(t.x<vx0-30||t.x>vx1+30||t.y<vy0-10||t.y-60>vy1)continue;D.push({y:t.y,t})}}
  for(const d of DECOR){if(d.x<vx0-200||d.x>vx1+100||d.y<vy0-40||d.y-120>vy1)continue;D.push({y:d.y+(d.k==='tag'?-200:d.k==='ship'?20:30),d})}
  for(const e of ENT.peds){if(e.ride)continue;if(e.x<vx0-30||e.x>vx1+30||e.y<vy0-10||e.y-60>vy1)continue;D.push({y:e.y,e})}
  for(const c of ENT.cars){if(c.x<vx0-60||c.x>vx1+60||c.y<vy0-60||c.y>vy1+60)continue;D.push({y:c.y+6,c})}
  if(running&&P&&!P.inCar)D.push({y:P.y,p:1});
  D.sort((a,b)=>a.y-b.y);const night=running&&G?nightLevel()>.25:false;
  for(const o of D){if(o.b)drawBuilding(ctx,o.b,night);else if(o.t)drawTree(ctx,o.t);else if(o.d){if(o.d.k==='tag')drawTag(o.d);else drawDecor(ctx,o.d)}
    else if(o.e){const e=o.e;drawPerson(ctx,e.x,e.y,e.lk,e.dir,e.anim,{ko:e.ko>0,punch:e.punch>0,badge:e.kind==='gang'||e.kind==='school'||e.kind==='crew'?(e.hostile?'#FF3B2F':FACTIONS[e.fac].color):e.kind==='police'?'#2F6BFF':null})}
    else if(o.c){drawCar(ctx,o.c);if(o.c===(P&&P.inCar)&&CARS[o.c.model].kind==='bike')drawPerson(ctx,o.c.x,o.c.y+4,playerLook(),dirFromAng(o.c.ang),0,{})}
    else if(o.p){drawPerson(ctx,P.x,P.y,playerLook(),P.dir,P.anim,{punch:P.punchT>0,item:P.gear.bat&&P.age>=16?'bat':null});
      ctx.fillStyle='#E2A11B';ctx.beginPath();ctx.moveTo(P.x-5,P.y-58*(playerLook().scale));ctx.lineTo(P.x+5,P.y-58*(playerLook().scale));ctx.lineTo(P.x,P.y-52*(playerLook().scale));ctx.fill()}}
  // keep the player readable when a building is in front
  if(running&&P&&!P.inCar){ctx.globalAlpha=.35;drawPerson(ctx,P.x,P.y,playerLook(),P.dir,P.anim,{});ctx.globalAlpha=1;const sc2=playerLook().scale;
    ctx.fillStyle='#E2A11B';ctx.beginPath();ctx.moveTo(P.x-5,P.y-58*sc2);ctx.lineTo(P.x+5,P.y-58*sc2);ctx.lineTo(P.x,P.y-52*sc2);ctx.fill()}
  // fx
  for(const f of ENT.fx){const a=f.life/f.max;if(f.k==='smoke'){ctx.fillStyle=`rgba(230,230,225,${a*.45})`;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill()}else{ctx.fillStyle=f.col;ctx.globalAlpha=a;ctx.fillRect(f.x,f.y,3,3);ctx.globalAlpha=1}}
  // bubbles
  ctx.font='600 12px "IBM Plex Sans",sans-serif';ctx.textAlign='center';
  for(const b of ENT.bubbles){const e=b.e;if(!e)continue;const X=e.x,Y=e.y-(e.type==='car'?36:62);const w=ctx.measureText(b.text).width+14;ctx.globalAlpha=Math.min(1,b.life*2);
    ctx.fillStyle='#F7F8F4';ctx.strokeStyle='#26343A';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(X-w/2,Y-18,w,22,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(X-4,Y+4);ctx.lineTo(X,Y+10);ctx.lineTo(X+4,Y+4);ctx.fill();
    ctx.fillStyle='#1D2724';ctx.fillText(b.text,X,Y-3);ctx.globalAlpha=1}
  ctx.textAlign='left';
  // night
  const nl=running&&G?nightLevel()+(G.weather==='Lietus'?.1:G.weather==='Debesuota'?.04:0):0;
  if(nl>0.01){const hw=dark.width,hh=dark.height,s=.5*Z;dctx.globalCompositeOperation='source-over';dctx.clearRect(0,0,hw,hh);dctx.fillStyle=`rgba(8,14,34,${nl})`;dctx.fillRect(0,0,hw,hh);
    if(nightLevel()>.2){dctx.globalCompositeOperation='destination-out';const L=(x,y,r,a)=>{const X=(x-cam.x)*s,Y=(y-cam.y)*s,R=r*s;if(X<-R||Y<-R||X>hw+R||Y>hh+R)return;const g=dctx.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');dctx.fillStyle=g;dctx.fillRect(X-R,Y-R,R*2,R*2)};
      const tx0b=Math.floor(vx0/TS),tx1b=Math.ceil(vx1/TS),ty0b=Math.floor(vy0/TS),ty1b=Math.ceil(vy1/TS);
      for(let y=ty0b;y<=ty1b;y++)for(let x=tx0b;x<=tx1b;x++){if(!inb(x,y))continue;const i=idx(x,y);if(CITYA[i]&&MXA[i]===2&&MYA[i]===2&&tileAt(x,y)===T.WALK&&hv(x,y,8)<.5)L(x*TS+8,y*TS+8,110,.85)}
      for(const c of ENT.cars){if(c.ai==='parked'&&c!==(P&&P.inCar))continue;const hx=c.x+Math.cos(c.ang)*70,hy=c.y+Math.sin(c.ang)*70;L(hx,hy,80,.8);L(c.x,c.y,30,.5)}
      POIS.forEach(p=>{if(p.kind!=='landmark')L(p.x,p.y,60,.6)});if(P)L(P.x,P.y-10,60,.5)}
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(dark,0,0,hw,hh,0,0,VW*DPR,VH*DPR)}
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(running&&G&&G.weather==='Sniegas'){ctx.fillStyle='rgba(255,255,255,.85)';const t=performance.now()/1000;for(let i=0;i<160;i++){const x=(hash2(i,1)*VW+Math.sin(t+i)*20+t*20)%VW,y=(hash2(i,2)*VH+t*80*(.6+hash2(i,4)*.6))%VH;ctx.fillRect(x,y,2.5,2.5)}}
  if(running&&G&&G.weather==='Lietus'){ctx.strokeStyle='rgba(200,215,230,.35)';ctx.lineWidth=1;ctx.beginPath();const t=performance.now()/1000;for(let i=0;i<140;i++){const x=(hash2(i,1)*VW+t*60*(.5+hash2(i,3)))%VW,y=(hash2(i,2)*VH+t*700*(.7+hash2(i,4)*.6))%VH;ctx.moveTo(x,y);ctx.lineTo(x-3,y+12)}ctx.stroke()}
  if(running&&P&&P.hitFlash>0){ctx.fillStyle=`rgba(181,51,43,${P.hitFlash})`;ctx.fillRect(0,0,VW,VH)}
  if(tgt)drawArrow(tgt);
  if(running)drawMinimap(tgt)}
function dirFromAng(a){const d=((Math.round(a/(Math.PI/2))%4)+4)%4;return d}
function drawTag(d){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(-.12);ctx.font='900 18px "Big Shoulders Display",sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#111';ctx.strokeText(d.txt,0,0);ctx.fillStyle=d.col;ctx.fillText(d.txt,0,0);ctx.restore()}
function drawPickup(k){const t=performance.now()/300,b=Math.sin(t+k.x)*2;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(k.x,k.y+4,6,2.5,0,0,7);ctx.fill();
  if(k.k==='bottle'){ctx.fillStyle='#4E8F5A';ctx.fillRect(k.x-2.5,k.y-12+b,5,11);ctx.fillRect(k.x-1,k.y-16+b,2,4);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(k.x-1.5,k.y-10+b,1.2,6)}
  else if(k.k==='cash'){ctx.fillStyle='#7FB77E';ctx.fillRect(k.x-7,k.y-8+b,14,8);ctx.fillStyle='#3E6B3D';ctx.fillRect(k.x-2,k.y-6+b,4,4)}
  else if(k.k==='amber'){ctx.fillStyle='#E8961C';ctx.beginPath();ctx.ellipse(k.x,k.y-5+b,5,4,.4,0,7);ctx.fill();ctx.fillStyle='rgba(255,240,180,.7)';ctx.fillRect(k.x-2,k.y-7+b,2,2)}
  else if(k.k==='kontra'){if(k.balloon){ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(k.x,k.y-10);ctx.lineTo(k.x+6,k.y-40);ctx.stroke();ctx.fillStyle='#F2F2EE';ctx.beginPath();ctx.arc(k.x+6,k.y-50+b,12,0,7);ctx.fill()}
    ctx.fillStyle='#A8865A';ctx.fillRect(k.x-9,k.y-12,18,12);ctx.strokeStyle='#6E5434';ctx.strokeRect(k.x-9,k.y-12,18,12)}}
function drawArrow(t){const sx=(t.x-cam.x)*ZOOM,sy=(t.y-cam.y)*ZOOM;if(sx>40&&sy>40&&sx<VW-40&&sy<VH-40)return;
  const cx=VW/2,cy=VH/2,a=Math.atan2(sy-cy,sx-cx);const m=56,ex=clamp(cx+Math.cos(a)*VW,m,VW-m),ey=clamp(cy+Math.sin(a)*VH,m+60,VH-m-80);
  ctx.save();ctx.translate(ex,ey);ctx.fillStyle='#B5332B';ctx.strokeStyle='#F7F8F4';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();ctx.stroke();
  ctx.rotate(a);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-5,-7);ctx.lineTo(-5,7);ctx.fill();ctx.restore();
  ctx.font='700 11px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;const dm=Math.round(dist(P.x,P.y,t.x,t.y)/TS*10);const s=dm>1000?(dm/1000).toFixed(1)+' km':dm+' m';
  ctx.strokeText(s,ex,ey+34);ctx.fillText(s,ex,ey+34);ctx.textAlign='left'}
function drawMinimap(tgt){const c=$('#mm'),g=c.getContext('2d'),w=c.width,h=c.height,sc=2,vw=w/sc,vh=h/sc;const px=P.x/TS,py=P.y/TS,x0=px-vw/2,y0=py-vh/2;
  g.imageSmoothingEnabled=false;g.fillStyle='#3D6D8D';g.fillRect(0,0,w,h);g.drawImage(MMC,x0,y0,vw,vh,0,0,w,h);if(OVC){g.globalAlpha=.7;g.drawImage(OVC,x0,y0,vw,vh,0,0,w,h);g.globalAlpha=1}
  POIS.forEach(p=>{const X=(p.x/TS-x0)*sc,Y=(p.y/TS-y0)*sc;if(X<0||Y<0||X>w||Y>h)return;g.fillStyle=p.kind==='landmark'?'#fff':POI_COL[p.kind]||'#26343A';g.fillRect(X-2,Y-2,4,4)});
  const dot=(x,y,col,r)=>{let X=(x/TS-x0)*sc,Y=(y/TS-y0)*sc;X=clamp(X,4,w-4);Y=clamp(Y,4,h-4);g.fillStyle=col;g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.arc(X,Y,r,0,7);g.fill();g.stroke()};
  ENT.cars.forEach(c2=>{if(c2.ai==='police')dot(c2.x,c2.y,'#2F6BFF',2.5)});if(tgt)dot(tgt.x,tgt.y,'#B5332B',4);
  g.save();g.translate(w/2,h/2);g.rotate(P.inCar?P.inCar.ang:[0,Math.PI/2,Math.PI,-Math.PI/2][P.dir]);g.fillStyle='#E2A11B';g.strokeStyle='#1D2724';g.lineWidth=1.5;g.beginPath();g.moveTo(6,0);g.lineTo(-4,-4.5);g.lineTo(-4,4.5);g.closePath();g.fill();g.stroke();g.restore()}

function frame(t){const dt=Math.min(.05,(t-lastT)/1000);lastT=t;try{update(dt);render();if(running)SND.update()}catch(e){console.error(e)}requestAnimationFrame(frame)}

/* ---------- input ---------- */
const JOY={on:false,x:0,y:0},TAP={on:false,x:0,y:0};
function keyAction(code){
  if(!running)return;
  if(!$('#modal').classList.contains('hidden')){if(code==='Escape'){HOOP.run=false;closeModal()}if(code==='Space'&&HOOP.run&&HOOP.shoot)HOOP.shoot();if(code==='Space'&&FISHG.run&&FISHG.pull)FISHG.pull();return}
  switch(code){
  case 'KeyE':if(PROMPT&&PROMPT.fn)PROMPT.fn();break;
  case 'KeyF':if(SCENE)break;if(P.inCar)exitCar();else{const c=nearestCar(46);if(c)enterCar(c)}break;
  case 'KeyJ':playerPunch();break;
  case 'KeyH':if(P.inCar){SND.horn();ENT.peds.forEach(e=>{if(dist(e.x,e.y,P.x,P.y)<5*TS&&!e.hostile&&e.kind!=='police'){e.state='flee';e.t=1.5}})}break;
  case 'KeyM':openMap();break;case 'KeyQ':openQuests();break;case 'KeyT':openPhone();break;case 'KeyC':openSelf();break;case 'KeyI':openItems();break;case 'KeyL':openGloss();break;
  case 'KeyN':toggleSound();break;case 'Equal':case 'NumpadAdd':ZMUL=clamp(ZMUL*1.1,.55,1.7);resize();break;case 'Minus':case 'NumpadSubtract':ZMUL=clamp(ZMUL*.9,.55,1.7);resize();break;case 'Escape':openMenu();break;
  default:if(/^Digit[1-6]$/.test(code)){const k=HOTBAR[+code.slice(5)-1];if(k)useItem(k)}}}
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(!e.repeat)keyAction(e.code);if(running&&$('#modal').classList.contains('hidden'))keys.add(e.code)});
addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyE')HOLD.lock=false});
addEventListener('blur',()=>keys.clear());
cv.addEventListener('mousedown',e=>{if(!running||paused)return;if(e.button===0)playerPunch()});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{if(!running)return;e.preventDefault();ZMUL=clamp(ZMUL*(e.deltaY>0?.9:1.1),.55,1.7);resize()},{passive:false});
(function touchSetup(){const joy=$('#joy'),knob=joy.querySelector('i');let pid=null;
  const setKeys=()=>{['KeyW','KeyA','KeyS','KeyD'].forEach(k=>keys.delete(k));if(!JOY.on||!P||!P.inCar)return;if(JOY.y<-.3)keys.add('KeyW');if(JOY.y>.3)keys.add('KeyS');if(JOY.x<-.3)keys.add('KeyA');if(JOY.x>.3)keys.add('KeyD')};
  const mv=e=>{const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const L=Math.hypot(x,y);if(L>1){x/=L;y/=L}JOY.x=x;JOY.y=y;knob.style.transform=`translate(${x*40}px,${y*40}px)`;setKeys()};
  joy.addEventListener('pointerdown',e=>{pid=e.pointerId;joy.setPointerCapture(pid);JOY.on=true;mv(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===pid)mv(e)});
  const end=()=>{JOY.on=false;JOY.x=JOY.y=0;knob.style.transform='';setKeys();pid=null};joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);
  $$('#tbtns button').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();keyAction(k);keys.add(k)});const up=()=>{keys.delete(k);if(k==='KeyE')HOLD.lock=false};b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up)})})();
function toggleSound(){SND.init();SND.on=!SND.on;if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume();$('#bSound').style.opacity=SND.on?1:.55;log(SND.on?'Garsas įjungtas. Sound on.':'Garsas išjungtas. Sound off.')}

/* ---------- boot ---------- */
$$('.mbtn[data-open]').forEach(b=>b.onclick=()=>openPanel(b.dataset.open));
$('#bSound').onclick=toggleSound;
$('#modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal'){HOOP.run=false;closeModal()}});
let afterDisc=null;
$('#bNew').onclick=()=>{afterDisc=()=>{$('#title').classList.add('hidden');$('#creator').classList.remove('hidden');renderCreator()};$('#disc').classList.remove('hidden')};
$('#bCont').onclick=()=>{const s=loadSaved();if(!s)return;afterDisc=()=>{SND.init();SND.on=true;loadLife(s)};$('#disc').classList.remove('hidden')};
$('#bDisc').onclick=()=>{$('#disc').classList.add('hidden');if(afterDisc)afterDisc()};
$('#cBack').onclick=()=>{$('#creator').classList.add('hidden');$('#title').classList.remove('hidden')};
$('#cRand').onclick=()=>{CR.sex=pick(['m','f']);CR.name=pick(NAMES[CR.sex]);CR.sur=ri(0,SURN.length-1);CR.surname=SURN[CR.sur][CR.sex==='f'?1:0];CR.age=pick(AGES).a;CR.city=pick(CITIES).id;CR.cls=pick(CLASSES).id;CR.parent=pick(PARENTS).id;
  CR.skin=pick(SKINS);CR.hair=pick(HAIRS);CR.outfit=pick(OUTFITS).id;CR.cap=Math.random()<.5;renderCreator()};
$('#cStart').onclick=()=>{SND.init();SND.on=true;newLife()};
resize();genWorld();
if(!loadSaved()){$('#bCont').disabled=true}
requestAnimationFrame(frame);
window.claude?.hot?.snapshot?.(()=>{saveGame(true);return{}});
</script>
</body>
</html>
