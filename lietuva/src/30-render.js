
/* =====================================================================
   RENDERING
   ===================================================================== */
const cv=$('#world'),ctx=cv.getContext('2d');
let VW=0,VH=0,DPR=1,ZOOM=1,ZMUL=1;
const cam={x:0,y:0};
const dark=document.createElement('canvas'),dctx=dark.getContext('2d');
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=innerWidth;VH=innerHeight;ZOOM=(VW<700?.8:1)*ZMUL;
  cv.width=VW*DPR;cv.height=VH*DPR;dark.width=Math.ceil(VW/2);dark.height=Math.ceil(VH/2)}
addEventListener('resize',resize);

/* ---------- ground chunks (cached) ---------- */
const CH=16,CHPX=CH*TS,chunkCache=new Map();
function hv(x,y,k){return hash2(x*7+k,y*13-k)}
function drawTile(g,x,y,px,py){
  const t=tileAt(x,y),h=hv(x,y,1);
  const F=(c)=>{g.fillStyle=c;g.fillRect(px,py,TS,TS)};
  switch(t){
  case T.GRASS:F(shade('#86A85F',(h-.5)*.08));if(h>.7){g.fillStyle='#6E9150';g.fillRect(px+h*20,py+hv(x,y,2)*24,3,5);g.fillRect(px+hv(x,y,3)*24,py+h*14,2,4)}
    if(h<.04){g.fillStyle='#F3EFE0';g.fillRect(px+10,py+12,3,3)}break;
  case T.FOREST:{F('#4F7A3E');const n=1+(h>.5);for(let k=0;k<n;k++){const ox=6+hv(x,y,4+k)*20,oy=6+hv(x,y,9+k)*18,pine=hv(x,y,7)>.35||x<70;
      g.fillStyle='rgba(20,35,18,.35)';g.beginPath();g.ellipse(px+ox+3,py+oy+5,11,8,0,0,7);g.fill();
      g.fillStyle=pine?'#2D5532':'#3F7136';g.beginPath();g.arc(px+ox,py+oy,pine?10:11.5,0,7);g.fill();
      g.fillStyle=pine?'#3B6B3C':'#57893F';g.beginPath();g.arc(px+ox-3,py+oy-3,pine?5:6,0,7);g.fill()}}break;
  case T.SEA:F(shade('#3D6D8D',(h-.5)*.05));if(h>.75){g.strokeStyle='rgba(255,255,255,.18)';g.beginPath();g.moveTo(px+4,py+16);g.quadraticCurveTo(px+12,py+11,px+20,py+16);g.stroke()}break;
  case T.WATER:F('#4F87A8');{const L=[[0,-1],[1,0],[0,1],[-1,0]];g.fillStyle='rgba(230,240,235,.35)';
      L.forEach(([dx,dy])=>{const n=tileAt(x+dx,y+dy);if(n!==T.WATER&&n!==T.SEA&&n!==T.BRIDGE&&n!==T.WBRIDGE&&n!==T.PIER){if(dx)g.fillRect(dx>0?px+TS-3:px,py,3,TS);else g.fillRect(px,dy>0?py+TS-3:py,TS,3)}});
      if(h>.8){g.strokeStyle='rgba(255,255,255,.2)';g.beginPath();g.moveTo(px+6,py+20);g.lineTo(px+16,py+18);g.stroke()}}break;
  case T.SAND:F(shade('#E5D5A6',(h-.5)*.06));g.fillStyle='rgba(150,120,70,.25)';g.fillRect(px+h*28,py+hv(x,y,5)*28,2,2);break;
  case T.DUNE:F(shade('#E2D3A2',(h-.5)*.05));g.strokeStyle='rgba(160,130,80,.25)';g.beginPath();g.moveTo(px,py+10+h*6);g.quadraticCurveTo(px+16,py+4+h*6,px+32,py+10+h*6);g.stroke();
    if(h>.85){g.fillStyle='#9BA65E';g.fillRect(px+8,py+18,2,6);g.fillRect(px+12,py+16,2,7)}break;
  case T.ROAD:case T.BRIDGE:{F(t===T.BRIDGE?'#6C7176':shade('#55595D',(h-.5)*.04));const i=idx(x,y),mx=MXA[i],my=MYA[i];
      g.fillStyle='rgba(240,240,230,.75)';
      if(mx===0&&my>=2)for(let k=4;k<TS;k+=16)g.fillRect(px+TS-1,py+k,2,8);
      if(my===0&&mx>=2)for(let k=4;k<TS;k+=16)g.fillRect(px+k,py+TS-1,8,2);
      if(mx>=0&&mx<2&&(my===2||my===13)){for(let k=3;k<TS;k+=7)g.fillRect(px+3,py+k,TS-6,3.5)}
      if(my>=0&&my<2&&(mx===2||mx===13)){for(let k=3;k<TS;k+=7)g.fillRect(px+k,py+3,3.5,TS-6)}
      if(t===T.BRIDGE){g.fillStyle='#9AA0A5';const n1=tileAt(x,y-1),n2=tileAt(x,y+1),n3=tileAt(x-1,y),n4=tileAt(x+1,y);
        if(n1===T.WATER)g.fillRect(px,py,TS,3);if(n2===T.WATER)g.fillRect(px,py+TS-3,TS,3);if(n3===T.WATER)g.fillRect(px,py,3,TS);if(n4===T.WATER)g.fillRect(px+TS-3,py,3,TS)}
    }break;
  case T.HWY:{F('#4A4E52');g.fillStyle='#E9E6DA';const E=n=>n!==T.HWY&&n!==T.BRIDGE&&n!==T.ROAD&&n!==T.COBBLE;
      if(E(tileAt(x,y-1)))g.fillRect(px,py+2,TS,2);if(E(tileAt(x,y+1)))g.fillRect(px,py+TS-4,TS,2);if(E(tileAt(x-1,y)))g.fillRect(px+2,py,2,TS);if(E(tileAt(x+1,y)))g.fillRect(px+TS-4,py,2,TS)}break;
  case T.WALK:F('#B9BAB3');g.fillStyle='rgba(90,95,90,.18)';g.fillRect(px,py+15,TS,1);g.fillRect(px+15,py,1,TS);
    {const i=idx(x,y);if(CITYA[i]&&MXA[i]===2&&MYA[i]===2&&hv(x,y,8)<.5){DECOR_LAMP(g,px,py)}}break;
  case T.PARK:F(shade('#6FA05A',(h-.5)*.06));if(h>.8){g.fillStyle='#E7C53D';g.fillRect(px+8,py+20,3,3);g.fillStyle='#D45A6A';g.fillRect(px+20,py+9,3,3)}break;
  case T.COBBLE:F('#A39686');g.fillStyle='rgba(70,60,50,.22)';for(let yy=0;yy<4;yy++)for(let xx=0;xx<4;xx++){g.fillRect(px+xx*8+(yy%2)*4,py+yy*8,7,7)}g.fillStyle='rgba(255,250,240,.08)';g.fillRect(px,py,TS,TS);break;
  case T.FIELD:{const pt=hash2(x>>3,y>>3),col=pt<.3?'#D9C750':pt<.6?'#C8B868':pt<.8?'#9DB25A':'#B59B6A';F(col);g.fillStyle='rgba(0,0,0,.08)';
      if(pt<.5)for(let k=2;k<TS;k+=6)g.fillRect(px,py+k,TS,2);else for(let k=2;k<TS;k+=6)g.fillRect(px+k,py,2,TS)}break;
  case T.LOT:F('#62666A');g.fillStyle='rgba(240,240,230,.55)';g.fillRect(px+1,py,2,14);if(hv(x,y,3)<.06){g.fillStyle='#3a3d40';g.fillRect(px+6,py+18,18,10)}break;
  case T.YARD:F(shade('#8EAF6C',(h-.5)*.06));if(h>.6){g.fillStyle='rgba(120,110,80,.25)';g.fillRect(px,py+12,TS,6)}break;
  case T.ABROAD:F('#2A3036');g.strokeStyle='rgba(255,255,255,.05)';g.beginPath();g.moveTo(px,py+TS);g.lineTo(px+TS,py);g.stroke();
    {const L=[[0,-1],[1,0],[0,1],[-1,0]];L.forEach(([dx,dy])=>{const n=tileAt(x+dx,y+dy);if(n!==T.ABROAD&&n!==T.SEA){g.fillStyle='#C9CCC8';
      if(dx)g.fillRect(dx>0?px+TS-3:px,py,3,TS);else g.fillRect(px,dy>0?py+TS-3:py,TS,3);g.fillStyle='#B5332B';if((x+y)%3===0)g.fillRect(px+12,py+12,6,6)}})}break;
  case T.WBRIDGE:F('#EDEDE6');g.fillStyle='#CFCFC6';g.fillRect(px,py,3,TS);g.fillRect(px+TS-3,py,3,TS);g.fillStyle='rgba(0,0,0,.05)';g.fillRect(px,py+15,TS,1);break;
  case T.PIER:F('#9B7650');g.fillStyle='rgba(60,40,20,.3)';for(let k=0;k<TS;k+=6)g.fillRect(px,py+k,TS,1);break;
  case T.BUILD:F('#7D7366');break;
  default:F('#86A85F');
  }
  if(WINTER){if(t===T.GRASS||t===T.FIELD||t===T.PARK||t===T.YARD||t===T.DUNE||t===T.FOREST||t===T.SAND){g.fillStyle=t===T.FOREST?'rgba(245,248,250,.45)':'rgba(245,248,250,.82)';g.fillRect(px,py,TS,TS);if(h>.7){g.fillStyle='rgba(200,210,220,.6)';g.fillRect(px+h*20,py+8,6,3)}}
    else if(t===T.WATER){g.fillStyle='rgba(215,232,240,.85)';g.fillRect(px,py,TS,TS)}
    else if(t===T.ROAD||t===T.HWY||t===T.WALK||t===T.COBBLE||t===T.LOT){g.fillStyle='rgba(240,244,248,.22)';g.fillRect(px,py,TS,TS)}}
}
function DECOR_LAMP(g,px,py){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(px+8,py+10,4,2,0,0,7);g.fill();g.fillStyle='#3A3F44';g.fillRect(px+6,py+4,4,6);g.fillStyle='#F2E6B0';g.beginPath();g.arc(px+8,py+4,3,0,7);g.fill()}
function getChunk(cx,cy){const k=cy*1000+cx;let c=chunkCache.get(k);if(c){chunkCache.delete(k);chunkCache.set(k,c);return c}
  c=document.createElement('canvas');c.width=CHPX;c.height=CHPX;const g=c.getContext('2d');
  for(let y=0;y<CH;y++)for(let x=0;x<CH;x++)drawTile(g,cx*CH+x,cy*CH+y,x*TS,y*TS);
  chunkCache.set(k,c);if(chunkCache.size>48){chunkCache.delete(chunkCache.keys().next().value)}return c}
function invalidateChunk(tx,ty){chunkCache.delete((ty/CH|0)*1000+(tx/CH|0))}

/* ---------- people ---------- */
function drawPerson(g,x,y,lk,dir,anim,opt){
  opt=opt||{};const s=(lk.scale||1)*(opt.big||1);g.save();g.translate(x,y);g.scale(s,s);
  if(opt.ko){g.rotate(Math.PI/2);g.translate(-6,-6)}
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,0,10,4,0,0,7);g.fill();
  const sw=opt.ko?0:Math.sin(anim)*3,up=dir===3,side=dir===0||dir===2,fx=dir===2?-1:1;
  // legs
  g.fillStyle=lk.pants||'#2C3440';g.fillRect(-5,-11+0,4,10+sw*.6);g.fillRect(1,-11,4,10-sw*.6);
  g.fillStyle=lk.shoes||'#F2F2EE';g.fillRect(-6,-2+sw*.6,5,3);g.fillRect(1,-2-sw*.6,5,3);
  // body
  g.fillStyle=lk.outfit;g.beginPath();g.roundRect(-8,-26,16,17,5);g.fill();
  if(lk.stripe){g.fillStyle='#F4F4F0';g.fillRect(-8,-24,1.6,14);g.fillRect(-5.8,-24,1.2,14);g.fillRect(6.4,-24,1.6,14);g.fillRect(4.6,-24,1.2,14)}
  if(lk.vest){g.fillStyle=lk.vest;g.fillRect(-8,-20,16,3)}
  if(lk.jersey){g.fillStyle='#fff';g.font='800 8px sans-serif';g.textAlign='center';g.fillText('11',0,-14);g.textAlign='left'}
  if(lk.chain&&!up){g.strokeStyle='#E2B63A';g.lineWidth=1.6;g.beginPath();g.arc(0,-26,5,.2,Math.PI-.2);g.stroke()}
  if(lk.bag&&!up){g.fillStyle=lk.bag;g.fillRect(side?-fx*9:-9,-24,4,12)}
  if(lk.bag&&up){g.fillStyle=lk.bag;g.beginPath();g.roundRect(-6,-25,12,12,3);g.fill()}
  // arms
  g.fillStyle=lk.outfit;const pa=opt.punch?8:0;
  g.save();g.translate(-8,-24);g.rotate(side?(-sw*.12):0);g.fillRect(-3,0,4,12-(dir===2?-pa:0));g.restore();
  g.save();g.translate(8,-24);g.rotate(side?(sw*.12):0);g.fillRect(-1,0,4,12+(dir!==2?pa:0));g.restore();
  g.fillStyle=lk.skin;g.beginPath();g.arc(-9,-12,2.3,0,7);g.arc(9+(dir===0?pa*.8:0),-12+(dir===1?pa*.5:0),2.3,0,7);g.fill();
  if(opt.item==='bat'){g.strokeStyle='#A0743F';g.lineWidth=3;g.beginPath();g.moveTo(10,-12);g.lineTo(16,-30+(opt.punch?20:0));g.stroke()}
  // head
  g.fillStyle=lk.skin;g.beginPath();g.arc(0,-34,9.5,0,7);g.fill();
  g.fillStyle=lk.hair;
  if(up){g.beginPath();g.arc(0,-35,10,0,7);g.fill();if(lk.female){g.fillRect(-9,-35,18,13)}}
  else{g.beginPath();g.arc(0,-37,10,Math.PI*1.02,Math.PI*1.98);g.fill();if(lk.female){g.fillRect(-10,-37,4,15);g.fillRect(6,-37,4,15)}
    if(!side){g.fillStyle='#1d1d1d';g.fillRect(-4,-34,2,2.4);g.fillRect(2.5,-34,2,2.4)}else{g.fillStyle='#1d1d1d';g.fillRect(fx*4-1,-34,2,2.4)}}
  if(lk.glasses&&!up){g.fillStyle='#111';if(side)g.fillRect(fx*2-3,-35,7,3.4);else g.fillRect(-6,-35,12,3.4)}
  if(lk.cap){g.fillStyle=lk.cap;g.beginPath();g.arc(0,-38,9.8,Math.PI,0);g.fill();g.fillRect(up?-9:dir===2?-15:dir===0?3:-7,-39,up?18:12,up?2:3)}
  if(opt.badge){g.fillStyle=opt.badge;g.beginPath();g.arc(0,-50,3.4,0,7);g.fill()}
  g.restore();
}
function drawCar(g,c){
  const m=CARS[c.model]||CARS.golf;g.save();g.translate(c.x,c.y);g.rotate(c.ang);
  const L=m.len,Wd=m.wid,col=c.color||m.col;
  if(m.kind==='bike'){g.strokeStyle='#222';g.lineWidth=3;g.beginPath();g.moveTo(-11,0);g.lineTo(11,0);g.stroke();g.fillStyle='#333';g.fillRect(-12,-2,6,4);g.fillRect(7,-2,6,4);
    g.strokeStyle=col||'#C0392B';g.lineWidth=2;g.beginPath();g.moveTo(-6,0);g.lineTo(6,0);g.moveTo(8,-5);g.lineTo(8,5);g.stroke();g.restore();return}
  if(c.neon){g.fillStyle='rgba(120,90,255,.45)';g.beginPath();g.ellipse(0,0,L*.7,Wd*.95,0,0,7);g.fill()}
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.roundRect(-L/2+3,-Wd/2+4,L,Wd,6);g.fill();
  g.fillStyle='#151515';[[-L*.32,-Wd/2-1],[L*.22,-Wd/2-1],[-L*.32,Wd/2-3],[L*.22,Wd/2-3]].forEach(([wx,wy])=>g.fillRect(wx,wy,9,4));
  g.fillStyle=col;g.beginPath();g.roundRect(-L/2,-Wd/2,L,Wd,m.bus?4:7);g.fill();
  g.fillStyle='rgba(255,255,255,.18)';g.fillRect(-L/2+3,-Wd/2+2,L-6,3);
  if(m.bus){g.fillStyle='#2B3A42';for(let k=-L/2+8;k<L/2-10;k+=12)g.fillRect(k,-Wd/2+2,8,3);g.fillRect(L/2-10,-Wd/2+3,6,Wd-6)}
  else{g.fillStyle=shade(col,-.25);g.beginPath();g.roundRect(-L*.2,-Wd/2+3,L*.42,Wd-6,4);g.fill();
    g.fillStyle='#2B3A42';g.beginPath();g.roundRect(L*.14,-Wd/2+3.5,L*.13,Wd-7,2);g.fill();g.beginPath();g.roundRect(-L*.28,-Wd/2+4,L*.09,Wd-8,2);g.fill()}
  g.fillStyle='#FFF4C8';g.fillRect(L/2-3,-Wd/2+2,3,4);g.fillRect(L/2-3,Wd/2-6,3,4);
  g.fillStyle=c.braking?'#FF3B2F':'#9E2A22';g.fillRect(-L/2,-Wd/2+2,2.5,4);g.fillRect(-L/2,Wd/2-6,2.5,4);
  if(m.police){g.fillStyle='#F2C230';g.fillRect(-L/2+4,-Wd/2,L-8,3);g.fillRect(-L/2+4,Wd/2-3,L-8,3);g.fillStyle='#1F3E8C';g.fillRect(-L/2+8,-Wd/2,10,3);g.fillRect(-L/2+8,Wd/2-3,10,3);
    const on=c.siren&&(performance.now()/180|0)%2;g.fillStyle=on?'#2F6BFF':'#7A1010';g.fillRect(-2,-Wd/2+3,4,(Wd-6)/2);g.fillStyle=on?'#7A1010':'#FF3030';g.fillRect(-2,0,4,(Wd-6)/2)}
  if(c.taxi){g.fillStyle='#F2C230';g.fillRect(-3,-4,7,8)}
  g.restore();
}
function drawTree(g,t){const x=t.x,y=t.y,s=t.s;
  g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x+4,y+2,13*s,6*s,0,0,7);g.fill();
  g.fillStyle='#6B4E33';g.fillRect(x-2,y-12*s,4,12*s);
  if(t.k==='pine'){g.fillStyle='#2D5532';g.beginPath();g.moveTo(x,y-44*s);g.lineTo(x+13*s,y-10*s);g.lineTo(x-13*s,y-10*s);g.fill();g.fillStyle='#3B6B3C';g.beginPath();g.moveTo(x,y-44*s);g.lineTo(x+6*s,y-24*s);g.lineTo(x-7*s,y-20*s);g.fill()}
  else{const c1=t.k==='birch'?'#7FA650':t.k==='apple'?'#5E9446':t.k==='lime'?'#6A9A45':'#4F8540';if(t.k==='birch'){g.fillStyle='#EDEBE4';g.fillRect(x-2,y-14*s,4,14*s)}
    g.fillStyle=c1;g.beginPath();g.arc(x,y-24*s,13*s,0,7);g.arc(x-8*s,y-18*s,9*s,0,7);g.arc(x+8*s,y-18*s,9*s,0,7);g.fill();
    g.fillStyle='rgba(255,255,220,.18)';g.beginPath();g.arc(x-4*s,y-28*s,6*s,0,7);g.fill();if(t.k==='apple'){g.fillStyle='#C8382E';g.fillRect(x+3,y-22,3,3);g.fillRect(x-6,y-16,3,3)}}}

/* ---------- buildings ---------- */
function winGrid(g,b,px,fy,pw,H,night,cols,rows,ww,wh,frame){
  const gapx=pw/cols,gapy=(H-10)/rows;
  for(let r=0;r<rows;r++)for(let c2=0;c2<cols;c2++){const wx=px+c2*gapx+(gapx-ww)/2,wy=fy+5+r*gapy+(gapy-wh)/2;
    const lit=night&&hash2(b.id*31+c2,r*17+b.id)<.38;g.fillStyle=lit?'#F4D27A':'#3B4A55';g.fillRect(wx,wy,ww,wh);
    if(frame){g.fillStyle=frame;g.fillRect(wx-1,wy+wh,ww+2,2)}}}
function drawBuilding(g,b,night){
  const px=b.x*TS,py=b.y*TS,pw=b.w*TS,ph=b.h*TS,H=b.ht||40,fy=py+ph-H,k=b.kind;
  if(H===0)return;
  g.fillStyle='rgba(0,0,0,.2)';g.fillRect(px+6,py+ph-6,pw,8);
  const fac=b.fac||'#C9C4B8',roof=b.roof||'#6E7478';
  const roofRect=(c,inset)=>{g.fillStyle=c;g.fillRect(px+(inset||0),py-H,pw-(inset||0)*2,ph)};
  switch(k){
  case 'old':case 'house':case 'barn':case 'palace':case 'theatre':{
    g.fillStyle=fac;g.fillRect(px,fy,pw,H);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(px,fy,pw,4);
    const cols=Math.max(1,Math.round(pw/22)),rows=Math.max(1,Math.round((H-14)/20));winGrid(g,b,px,fy,pw,H-12,night,cols,rows,8,10,'rgba(255,255,255,.5)');
    if(k==='barn'){g.fillStyle='#5A4330';g.fillRect(px+pw/2-10,fy+H-22,20,22)}
    g.fillStyle=roof;g.fillRect(px-2,py-H,pw+4,ph);g.fillStyle=shade(roof,.12);g.fillRect(px-2,py-H,pw+4,ph/2);
    g.fillStyle='rgba(0,0,0,.15)';g.fillRect(px-2,py-H+ph/2-1,pw+4,2);
    if(k==='old'&&hash2(b.id,3)<.4){g.fillStyle=shade(roof,-.2);g.fillRect(px+pw*.3,py-H+4,8,8)}
    if(k==='palace'||k==='theatre'){g.fillStyle='#F4F1E8';for(let c2=0;c2<6;c2++)g.fillRect(px+pw*.2+c2*pw*.12,fy+10,5,H-12);g.fillStyle=k==='theatre'?'#B5332B':'#E2A11B';g.fillRect(px+pw*.18,fy+4,pw*.64,5)}
    break}
  case 'sov':{g.fillStyle=fac;g.fillRect(px,fy,pw,H);
    const fl=Math.max(3,Math.round(H/14)),cols=Math.max(2,Math.round(pw/16));winGrid(g,b,px,fy,pw,H-4,night,cols,fl,7,7,'rgba(0,0,0,.18)');
    g.fillStyle='rgba(255,255,255,.12)';for(let c2=1;c2<cols;c2+=3)g.fillRect(px+c2*pw/cols-1,fy,1.5,H);
    g.fillStyle='#3A3F44';g.fillRect(px+pw/2-6,fy+H-12,12,12);
    roofRect(roof);g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;g.strokeRect(px+2,py-H+2,pw-4,ph-4);
    g.fillStyle='#5A6064';for(let c2=0;c2<pw/60;c2++)g.fillRect(px+20+c2*60,py-H+ph/2-5,8,8);break}
  case 'office':{g.fillStyle=fac;g.fillRect(px,fy,pw,H);g.fillStyle=night?'rgba(244,210,122,.35)':'rgba(255,255,255,.22)';
    for(let y2=fy+6;y2<py+ph-8;y2+=10)g.fillRect(px+3,y2,pw-6,5);roofRect(roof);g.fillStyle='rgba(255,255,255,.1)';g.fillRect(px+6,py-H+6,pw-12,ph-12);break}
  case 'mall':case 'warehouse':case 'arena':{g.fillStyle=fac;g.fillRect(px,fy,pw,H);g.fillStyle=b.landmark?'#1E6B4A':'#B5332B';g.fillRect(px,fy+6,pw,8);
    g.fillStyle='#3B4A55';g.fillRect(px+pw/2-14,fy+H-16,28,16);
    if(k==='arena'){g.fillStyle='#2F3A3F';g.beginPath();g.ellipse(px+pw/2,py-H+ph/2,pw/2,ph/2,0,0,7);g.fill();g.strokeStyle='#1E8A4A';g.lineWidth=4;g.stroke()}
    else{roofRect(roof);g.fillStyle='rgba(0,0,0,.12)';for(let x2=px+12;x2<px+pw-12;x2+=24)g.fillRect(x2,py-H+6,10,ph-12)}break}
  case 'garages':{g.fillStyle=fac;g.fillRect(px,fy,pw,H);g.fillStyle='#5C6062';for(let x2=px+3;x2<px+pw-4;x2+=TS){g.fillRect(x2,fy+3,TS-6,H-3);g.fillStyle=hash2(x2,b.id)<.3?'#6E4E3A':'#5C6062'}roofRect(roof);break}
  case 'church':case 'cathedral':{g.fillStyle=fac;g.fillRect(px,fy,pw,H);g.fillStyle='#E4DED0';for(let c2=0;c2<6;c2++)g.fillRect(px+pw*.12+c2*pw*.14,fy+14,6,H-14);
    g.fillStyle='#3B4A55';g.fillRect(px+pw/2-8,fy+H-20,16,20);roofRect(roof);
    g.fillStyle=fac;g.beginPath();g.moveTo(px+pw*.1,fy+14);g.lineTo(px+pw/2,fy-6);g.lineTo(px+pw*.9,fy+14);g.fill();
    if(k==='church'){[px+8,px+pw-28].forEach(tx=>{g.fillStyle=fac;g.fillRect(tx,fy-50,20,50);g.fillStyle=roof;g.beginPath();g.moveTo(tx-2,fy-50);g.lineTo(tx+10,fy-74);g.lineTo(tx+22,fy-50);g.fill()})}
    break}
  case 'belfry':{g.fillStyle='#F1EBDD';g.fillRect(px+4,py+ph-H,pw-8,H);g.fillStyle='#3B4A55';for(let y2=py+ph-H+10;y2<py+ph-10;y2+=22)g.fillRect(px+12,y2,8,10);
    g.fillStyle='#59636B';g.beginPath();g.moveTo(px+2,py+ph-H);g.lineTo(px+16,py+ph-H-22);g.lineTo(px+30,py+ph-H);g.fill();break}
  case 'tower':{g.fillStyle='#4E8A45';g.beginPath();g.ellipse(px+pw/2,py+ph-6,pw*.9,ph*.6,0,0,7);g.fill();
    g.fillStyle='#A4533B';g.fillRect(px+20,py+ph-H-20,pw-40,H);g.fillStyle='#8C4431';for(let y2=py+ph-H-14;y2<py+ph-24;y2+=10)g.fillRect(px+20,y2,pw-40,2);
    g.fillStyle='#2B3A42';g.fillRect(px+pw/2-5,py+ph-H,10,14);
    g.fillStyle='#555';g.fillRect(px+pw/2-1,py+ph-H-52,2,32);const fx=px+pw/2+1,fy2=py+ph-H-52,wv=Math.sin(performance.now()/300)*2;
    g.fillStyle='#FDB913';g.fillRect(fx,fy2,22,5+wv*.2);g.fillStyle='#006A44';g.fillRect(fx,fy2+5,22,5);g.fillStyle='#C1272D';g.fillRect(fx,fy2+10,22,5);break}
  case 'tvtower':{g.fillStyle='#D9DCDD';g.fillRect(px+pw/2-5,py+ph-H,10,H);g.fillStyle='#BFC4C6';g.beginPath();g.ellipse(px+pw/2,py+ph-H+30,22,9,0,0,7);g.fill();
    g.fillStyle='#C1272D';g.fillRect(px+pw/2-2,py+ph-H-40,4,40);break}
  case 'ptower':{g.strokeStyle='#8E9599';g.lineWidth=2;for(let k2=0;k2<6;k2++){const y2=py+ph-k2*H/6;g.beginPath();g.moveTo(px+6+k2*2,y2);g.lineTo(px+pw-6-k2*2,y2-H/6);g.moveTo(px+pw-6-k2*2,y2);g.lineTo(px+6+k2*2,y2-H/6);g.stroke()}
    g.fillStyle='#C1272D';g.fillRect(px+8,py+ph-H-8,pw-16,8);break}
  case 'castle':{g.fillStyle='#B5533A';g.fillRect(px,fy,pw,H);g.fillStyle='#9B4430';for(let y2=fy+6;y2<fy+H;y2+=8)g.fillRect(px,y2,pw,1.5);
    g.fillStyle='#3B2A22';g.fillRect(px+pw/2-8,fy+H-18,16,18);roofRect('#8C3B2A');
    [[px-6,fy-10],[px+pw-18,fy-10]].forEach(([tx,ty])=>{g.fillStyle='#A84D36';g.fillRect(tx,ty,24,H+10);g.fillStyle='#6E2F22';g.beginPath();g.moveTo(tx-2,ty);g.lineTo(tx+12,ty-22);g.lineTo(tx+26,ty);g.fill()});break}
  case 'statue':case 'sundial':{g.fillStyle='#9AA0A3';g.fillRect(px+pw/2-10,py+ph-14,20,14);g.fillStyle=b.fac||'#B8BEC1';g.fillRect(px+pw/2-4,py+ph-H,8,H-14);
    if(k==='sundial'){g.fillStyle='#E2A11B';g.beginPath();g.arc(px+pw/2,py+ph-H-6,7,0,7);g.fill()}break}
  case 'crosses':{g.fillStyle='#8DAE6A';g.beginPath();g.ellipse(px+pw/2,py+ph/2,pw/2+8,ph/2+6,0,0,7);g.fill();g.strokeStyle='#4A3B2E';g.lineWidth=1.6;
    for(let i=0;i<110;i++){const cx=px+8+hash2(i,1)*(pw-16),cy=py+6+hash2(i,2)*(ph-8),h2=6+hash2(i,3)*10;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,cy-h2);g.moveTo(cx-3,cy-h2*.7);g.lineTo(cx+3,cy-h2*.7);g.stroke()}break}
  case 'plaque':break;
  default:g.fillStyle=fac;g.fillRect(px,fy,pw,H);roofRect(roof);
  }
  if(b.hqColor){g.fillStyle=b.hqColor;g.fillRect(px,fy+H-26,pw,4)}
  if(b.poi&&b.poi.kind!=='landmark'){const p=b.poi,label=POI_LABEL[p.kind]||p.name;g.font='700 11px "IBM Plex Sans",sans-serif';const tw=g.measureText(label).width+12;
    const sx=p.x-tw/2,sy=py+ph-34;g.fillStyle=POI_COL[p.kind]||'#26343A';g.fillRect(sx,sy,tw,16);g.fillStyle='#fff';g.fillText(label,sx+6,sy+12);
    g.fillStyle='#2B2622';g.fillRect(p.x-7,py+ph-14,14,14)}
  if(b.school){g.fillStyle='#fff';g.font='800 12px "Big Shoulders Display",sans-serif';}
}
const POI_LABEL={shop:'MAKSI',kebab:'KEBABAI',cafe:'KAVINĖ',bus:'AUTOBUSŲ STOTIS',garage:'AUTOSERVISAS',police:'POLICIJA',hospital:'LIGONINĖ',gym:'SPORTO KLUBAS',market:'TURGUS',office:'VERSLO CENTRAS',bar:'BARAS',school:'MOKYKLA',hq:'',home:'NAMAI'};
const POI_COL={shop:'#C1272D',kebab:'#B9770E',cafe:'#6B4E33',bus:'#1F618D',garage:'#26343A',police:'#1F3E8C',hospital:'#B5332B',gym:'#1D2724',market:'#1E6B4A',office:'#35484F',bar:'#5B2C6F',school:'#1E6B4A',hq:'#1D2724',home:'#E2A11B'};
function drawDecor(g,d){
  if(d.k==='ship'){const x=d.x,y=d.y;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x+80,y+30,82,14,0,0,7);g.fill();
    g.fillStyle='#F4F1E8';g.beginPath();g.moveTo(x,y+20);g.lineTo(x+150,y+16);g.lineTo(x+168,y+26);g.lineTo(x+150,y+36);g.lineTo(x,y+34);g.fill();g.fillStyle='#2B3A42';g.fillRect(x,y+30,150,4);
    g.strokeStyle='#6B4E33';g.lineWidth=3;[30,75,120].forEach(mx=>{g.beginPath();g.moveTo(x+mx,y+26);g.lineTo(x+mx,y-50);g.stroke();g.fillStyle='rgba(244,241,232,.9)';g.fillRect(x+mx-14,y-44,28,18);g.fillRect(x+mx-12,y-22,24,14)})}
  else if(d.k==='crane'){const x=d.x,y=d.y;g.strokeStyle='#D9A21B';g.lineWidth=4;g.beginPath();g.moveTo(x,y+20);g.lineTo(x,y-90);g.lineTo(x-70,y-90);g.moveTo(x,y-90);g.lineTo(x+20,y-90);g.stroke();
    g.lineWidth=1;g.beginPath();g.moveTo(x-50,y-90);g.lineTo(x-50,y-40);g.stroke();g.fillStyle='#B5332B';g.fillRect(x-58,y-42,16,12)}
  else if(d.k==='play'){const x=d.x,y=d.y;g.strokeStyle='#C0392B';g.lineWidth=3;g.beginPath();g.moveTo(x,y+20);g.lineTo(x,y-10);g.lineTo(x+40,y-10);g.lineTo(x+40,y+20);g.stroke();
    g.strokeStyle='#555';g.lineWidth=1;g.beginPath();g.moveTo(x+14,y-10);g.lineTo(x+14,y+8);g.moveTo(x+26,y-10);g.lineTo(x+26,y+8);g.stroke();g.fillStyle='#2D5DA8';g.fillRect(x+12,y+8,16,3);
    g.fillStyle='#E5D5A6';g.fillRect(x+56,y,30,22)}
  else if(d.k==='hoop'){const x=d.x,y=d.y;g.fillStyle='#C8603A';g.fillRect(x-40,y-30,80,60);g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.strokeRect(x-38,y-28,76,56);
    g.beginPath();g.arc(x,y,10,0,7);g.stroke();g.fillStyle='#ddd';g.fillRect(x-2,y-48,4,20);g.fillStyle='#fff';g.fillRect(x-10,y-52,20,10);g.strokeStyle='#E2621B';g.beginPath();g.arc(x,y-40,5,0,7);g.stroke()}
}
