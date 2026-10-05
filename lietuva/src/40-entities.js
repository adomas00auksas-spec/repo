
/* =====================================================================
   STATE, ENTITIES, PHYSICS, AI
   ===================================================================== */
let G=null,P=null,running=false,paused=false;
const ENT={peds:[],cars:[],pickups:[],bubbles:[],fx:[]};
const keys=new Set();let mouseDown=false;
const now=()=>performance.now()/1000;
const tx=v=>Math.floor(v/TS);
function solidAt(px,py,arr){return arr[tileAt(tx(px),tx(py))]===1}
function blocked(x,y,r,arr){return solidAt(x-r,y-r,arr)||solidAt(x+r,y-r,arr)||solidAt(x-r,y+r,arr)||solidAt(x+r,y+r,arr)}
function moveCircle(e,dx,dy,r,arr){let hit=false;
  if(!blocked(e.x+dx,e.y,r,arr))e.x+=dx;else hit=true;
  if(!blocked(e.x,e.y+dy,r,arr))e.y+=dy;else hit=true;return hit}
const pedOK=t=>WALKABLE[t]||t===T.GRASS||t===T.SAND||t===T.DUNE||t===T.FIELD||t===T.FOREST;
function districtAt(px,py){const d=DISTA[idx(clamp(tx(px),0,W-1),clamp(tx(py),0,H-1))];return d?DISTRICTS[d-1]:null}
function cityAtPx(){return curCityObj()}
function nearestCity(){return curCityObj()||cityById(P.city)}
function myFac(){return P&&P.faction?FACTIONS[P.faction]:null}
function repOf(id){return (P.rep&&P.rep[id])||0}
function rankIdx(id){const f=FACTIONS[id];const tb=RANK_REP[rankTable(f)];let r=0;tb.forEach((v,i)=>{if(repOf(id)>=v)r=i});return r}
function rankName(id){return RANKS[rankTable(FACTIONS[id])][rankIdx(id)]}

/* ---------- looks ---------- */
function randomLook(kind,fac){
  const female=Math.random()<.45,lk={skin:pick(SKINS.slice(0,3)),hair:pick(HAIRS),female,outfit:pick(['#5B6B73','#2B2420','#7A3B3B','#3E5F7A','#6B7F4A','#8A7A6A','#2A3140','#B9A27A','#4A4F55']),pants:pick(['#2C3440','#3B3F45','#4A5A70','#2A2A2A']),scale:1};
  if(kind==='kid'){lk.scale=.74;lk.bag=pick(['#C0392B','#2D5DA8','#E2A11B','#3E8E5E']);lk.outfit=pick(['#E06666','#6FA8DC','#93C47D','#FFD966','#8E7CC3'])}
  if(kind==='elder'){lk.hair='#CFCFCF';lk.cap=female?pick(['#8E3B46','#4A5A7A','#5E6B3A']):null;lk.outfit=pick(['#6B5B4B','#4A4F55','#5E4B5B']);lk.scale=.94}
  if(kind==='gang'){const f=FACTIONS[fac];lk.female=Math.random()<.15;if(f.type==='cartel'){lk.outfit='#1D1F22';lk.vest=f.color;lk.pants='#1D1F22';lk.cap=Math.random()<.5?'#111':null}
    else if(f.type==='crew'){lk.outfit=pick(['#E2A11B','#D8D2C4','#5B6B73']);lk.cap=Math.random()<.4?'#1D2724':null;lk.vest=f.color;lk.scale=.9;lk.female=Math.random()<.45}
    else{lk.outfit=f.color;lk.stripe=true;lk.pants=f.color;lk.cap=Math.random()<.6?'#141414':null}}
  if(kind==='school'){const f=FACTIONS[fac];lk.scale=.86;lk.bag=f.color;lk.vest=f.color;lk.female=Math.random()<.5}
  if(kind==='police'){lk.outfit='#1F3E8C';lk.vest='#F2C230';lk.cap='#1F3E8C';lk.pants='#1A2A55';lk.female=Math.random()<.3}
  if(kind==='boss'){const f=FACTIONS[fac];lk.outfit=f.type==='auto'?'#1D1F22':f.color;lk.vest=f.type==='auto'?f.color:null;lk.stripe=f.type==='gang';lk.cap=f.type==='gang'?'#111':null;lk.female=/Laura|Agnė|Ugnė/.test(f.boss)}
  return lk}
function playerLook(){const p=P,o=OUTFITS.find(o=>o.id===p.look.outfit)||OUTFITS[0];const f=myFac();
  return applyStyle({skin:p.look.skin,hair:p.look.hair,female:p.sex==='f',outfit:p.look.color||o.col,stripe:o.stripe,cap:p.look.cap?'#141414':null,pants:o.id==='suit'?'#2A3140':'#2C3440',
    scale:p.age<10?.74:p.age<15?.88:1,vest:f&&f.type!=='gang'&&p.look.outfit!=='zalgiris'?f.color:null,bag:p.age<16?'#2D5DA8':null,glasses:p.look.glasses,chain:p.look.chain,jersey:o.jersey,smoke:P.smokeT>0})}

/* ---------- spawning ---------- */
function randomTileNear(px,py,rmin,rmax,test){for(let k=0;k<30;k++){const a=rnd(Math.PI*2),r=rnd(rmin,rmax),x=tx(px)+Math.round(Math.cos(a)*r),y=tx(py)+Math.round(Math.sin(a)*r);
  if(inb(x,y)&&test(tileAt(x,y),x,y))return[x,y]}return null}
function spawnPed(kind,x,y,fac,extra){const lk=randomLook(kind,fac);const e=Object.assign({type:'ped',kind,fac,x,y,dir:ri(0,3),anim:rnd(6),hp:kind==='gang'?ri(50,80):kind==='police'?90:kind==='kid'?25:40,maxhp:80,
  sp:kind==='elder'?28:kind==='kid'?50:rnd(38,58),t:rnd(1,4),lk,state:'wander',cd:0,ko:0,hostile:false,angry:false,talk:0},extra||{});e.maxhp=e.hp;ENT.peds.push(e);return e}
function populate(dt){
  const px=P.x,py=P.y,c=cityAtPx(px,py),night=isNight(),pc=P.inCar;
  // despawn far
  ENT.peds=ENT.peds.filter(e=>e.keep||dist(e.x,e.y,px,py)<38*TS);
  ENT.cars=ENT.cars.filter(e=>e.owned!==undefined||e.keep||dist(e.x,e.y,px,py)<44*TS&&!(e.ai==='block'&&P.heat<=0));
  ENT.pickups=ENT.pickups.filter(e=>e.keep||dist(e.x,e.y,px,py)<40*TS);
  const civ=ENT.peds.filter(e=>!e.keep).length;
  const want=c?(night?16:28):MAP.kind==='loc'?10:3;
  if(civ<want){const t=randomTileNear(px,py,14,30,(t,x,y)=>c?WALKABLE[t]:WALKABLE[t]||t===T.GRASS);
    if(t){const X=t[0]*TS+16,Y=t[1]*TS+16,d=districtAt(X,Y),hr=G.time.min/60;
      const sch=nearSchool(X,Y,14);
      if(d&&d.owner&&Math.random()<(night?.55:.33))spawnPed('gang',X,Y,d.owner,{home:d.id});
      else if(sch&&hr>=7.5&&hr<16&&Math.random()<.55)spawnPed('school',X,Y,sch.fac,{home:sch.id});
      else if(c&&Math.random()<.05)spawnPed('police',X,Y,null);
      else spawnPed(Math.random()<.12?'kid':Math.random()<.14?'elder':'civ',X,Y,null)}}
  // traffic along real streets
  const tr=ENT.cars.filter(e=>e.ai==='traffic').length,wantC=c?14:MAP.kind==='road'?7:3;
  if(tr<wantC){const roadMap=MAP.kind==='road';const troll=c&&STREETS.some(q=>q.troll)&&ENT.cars.filter(e=>e.model==='troll').length<3&&Math.random()<.3;
    const m=troll?'troll':c&&Math.random()<.06?'bus':pick(TRAFFIC_MODELS);spawnStreetCar(px,py,m,troll?(q=>q.troll):null,{sp:roadMap?rnd(240,330):troll?rnd(80,110):rnd(110,160)})}
  // parked cars
  if(MAP.kind!=='road'&&ENT.cars.filter(e=>e.ai==='parked'&&e.owned===undefined).length<10){const t=randomTileNear(px,py,12,26,(t,x,y)=>t===T.LOT||t===T.YARD&&tileAt(x,y+1)===T.WALK&&hash2(x,y)<.3);
    if(t&&!ENT.cars.some(o=>dist(o.x,o.y,t[0]*TS+16,t[1]*TS+16)<60)){const m=pick(TRAFFIC_MODELS);ENT.cars.push({type:'car',ai:'parked',model:m,color:Math.random()<.5?CARS[m].col:pick(PAINTS),x:t[0]*TS+16,y:t[1]*TS+16,ang:Math.random()<.5?Math.PI/2:-Math.PI/2,vx:0,vy:0,hp:100})}}
  // pickups
  const nb=ENT.pickups.filter(e=>e.k==='bottle').length;
  if(c&&nb<(P.age<16?12:5)){const t=randomTileNear(px,py,6,22,(t)=>t===T.YARD||t===T.PARK||t===T.WALK);if(t)ENT.pickups.push({k:'bottle',x:t[0]*TS+rnd(6,26),y:t[1]*TS+rnd(6,26)})}
  if(!c&&ENT.pickups.filter(e=>e.k==='amber').length<3){const t=randomTileNear(px,py,5,22,(t,x,y)=>t===T.SAND&&(tileAt(x-1,y)===T.SEA||tileAt(x-2,y)===T.SEA));if(t)ENT.pickups.push({k:'amber',x:t[0]*TS+16,y:t[1]*TS+16})}
  // police
  if(P.heat>0){const pol=ENT.peds.filter(e=>e.kind==='police').length,polc=ENT.cars.filter(e=>e.ai==='police').length;
    if(pol<Math.min(3,Math.ceil(P.heat))&&c){const t=randomTileNear(px,py,12,20,(t)=>WALKABLE[t]);if(t){spawnPed('police',t[0]*TS+16,t[1]*TS+16,null)}}
    if(polc<Math.min(3,P.heat-1+(pc?1:0))){const t=randomTileNear(px,py,16,26,(t)=>DRIVE[t]);if(t)ENT.cars.push({type:'car',ai:'police',model:'police',x:t[0]*TS+16,y:t[1]*TS+16,ang:Math.atan2(py-t[1]*TS,px-t[0]*TS),vx:0,vy:0,hp:140,siren:true,stuck:0})}}
}
function nearSchool(x,y,r){let best=null;for(const p of POIS){if(p.kind!=='school')continue;if(dist(p.x,p.y,x,y)<r*TS){best=p;break}}return best}
function streetCands(px,py,rmin,rmax,filter){const out=[],X=tx(px),Y=tx(py);const bx0=Math.max(0,(X-rmax)>>4),bx1=Math.min(BW-1,(X+rmax)>>4),by0=Math.max(0,(Y-rmax)>>4),by1=Math.min(BH-1,(Y+rmax)>>4);
  for(let by=by0;by<=by1;by++)for(let bx=bx0;bx<=bx1;bx++)for(const[sid,i]of SBUCK[by*BW+bx]){const s=STREETS[sid];if(s.ped||s.rail||filter&&!filter(s))continue;const p=s.pts[i];const d=dist(p[0],p[1],X,Y);if(d>=rmin&&d<=rmax)out.push([sid,i])}return out}
const laneOff=c=>{const s=STREETS[c.sid];return Math.max(9,Math.min(s.w*TS*.5,s.w*TS-14))};
function spawnStreetCar(px,py,model,filter,extra){const cand=streetCands(px,py,14,30,filter);if(!cand.length)return null;const[sid,i]=pick(cand);const s=STREETS[sid];if(s.pts.length<2)return null;
  let dir=Math.random()<.5?1:-1;if(i+dir<0||i+dir>=s.pts.length)dir=-dir;const p=s.pts[i],q=s.pts[i+dir];const a=Math.atan2(q[1]-p[1],q[0]-p[0]);
  const c=Object.assign({type:'car',ai:'traffic',model,color:model==='troll'?'#C8202E':Math.random()<.5?CARS[model].col:pick(PAINTS),sid,seg:i+dir,sdir:dir,x:p[0]*TS+16,y:p[1]*TS+16,ang:a,vx:0,vy:0,hp:100,taxi:model==='prius'&&Math.random()<.6,troll:model==='troll'},extra||{});
  const o=laneOff(c);c.x+=-Math.sin(a)*o;c.y+=Math.cos(a)*o;if(ENT.cars.some(e=>dist(e.x,e.y,c.x,c.y)<90))return null;ENT.cars.push(c);return c}
function nextStreet(c){const s=STREETS[c.sid],end=s.pts[clamp(c.seg-c.sdir,0,s.pts.length-1)];const bx=clamp(end[0]|0,0,W-1)>>4,by=clamp(end[1]|0,0,H-1)>>4;const opts=[];
  for(let yy=by-1;yy<=by+1;yy++)for(let xx=bx-1;xx<=bx+1;xx++){if(xx<0||yy<0||xx>=BW||yy>=BH)continue;for(const[sid,i]of SBUCK[yy*BW+xx]){if(sid===c.sid)continue;const q=STREETS[sid];if(q.ped||q.rail||c.troll&&!q.troll)continue;
    const p=q.pts[i];if(dist(p[0],p[1],end[0],end[1])<4)opts.push([sid,i])}}
  if(!opts.length||s.hwy){if(s.hwy){c.dead=true;return}c.sdir=-c.sdir;c.seg=clamp(c.seg+c.sdir*2,0,s.pts.length-1);return}
  const[sid,i]=pick(opts);const q=STREETS[sid];c.sid=sid;c.sdir=i<q.pts.length/2?1:-1;if(q.pts.length<2){c.sdir=-c.sdir}c.seg=clamp(i+c.sdir,0,q.pts.length-1)}
function updateTraffic(c,dt){const s=STREETS[c.sid];if(!s){c.dead=true;return}const p=s.pts[c.seg];if(!p){nextStreet(c);return}
  const pv=s.pts[clamp(c.seg-c.sdir,0,s.pts.length-1)];const sa=Math.atan2(p[1]-pv[1],p[0]-pv[0]);const o=laneOff(c);
  const nx=p[0]*TS+16-Math.sin(sa)*o,ny=p[1]*TS+16+Math.cos(sa)*o;const tA=Math.atan2(ny-c.y,nx-c.x);let da=((tA-c.ang+Math.PI*3)%(Math.PI*2))-Math.PI;c.ang+=da*clamp(dt*4,0,1);
  const look=CARS[c.model].len/2+24,ax=c.x+Math.cos(c.ang)*look,ay=c.y+Math.sin(c.ang)*look;let block=false;
  if(P.inCar){if(dist(ax,ay,P.inCar.x,P.inCar.y)<38)block=true}else if(dist(ax,ay,P.x,P.y)<30)block=true;
  if(!block)for(const o2 of ENT.cars){if(o2!==c&&dist(ax,ay,o2.x,o2.y)<34){block=true;break}}
  if(!block)for(const e of ENT.peds){if(!e.ko&&!e.ride&&dist(ax,ay,e.x,e.y)<22){block=true;break}}
  const rush=(G.time.min>=8*60&&G.time.min<9*60||G.time.min>=17*60&&G.time.min<18*60)&&!s.hwy?.6:1;
  const target=block?0:c.sp*rush*(Math.abs(da)>.8?.5:1);c.cur=lerp(c.cur||0,target,clamp(dt*(block?6:1.5),0,1));c.braking=block;
  if(c.cur<5&&block){c.honk=(c.honk||0)+dt;if(c.honk>3){c.honk=-5;if(dist(c.x,c.y,P.x,P.y)<12*TS)bubble(c,pick(['Pyyyp!','Nu važiuok!','Ką, užmigai?!']));SND.horn()}}
  c.x+=Math.cos(c.ang)*c.cur*dt;c.y+=Math.sin(c.ang)*c.cur*dt;
  if(dist(c.x,c.y,nx,ny)<26){c.seg+=c.sdir;if(c.seg<0||c.seg>=s.pts.length)nextStreet(c)}}
function updateHwy(c,dt){updateTraffic(c,dt)}
function carStats(c){const m=CARS[c.model];const t=c.tune||{};let max=m.max*(1+.08*(t.eng||0)),acc=m.acc*(1+.08*(t.eng||0))*(t.turbo?1.35:1),grip=m.grip*(t.drift?.82:1)*(WINTER&&m.kind!=='bike'?.72:1)*(G&&G.weather==='Lietus'?.88:1);return{max,acc,grip,steer:t.drift?3.2:2.7,m}}
function updatePlayerCar(c,dt){
  const st=carStats(c),up=keys.has('KeyW')||keys.has('ArrowUp'),dn=keys.has('KeyS')||keys.has('ArrowDown'),lf=keys.has('KeyA')||keys.has('ArrowLeft'),rt=keys.has('KeyD')||keys.has('ArrowRight'),hb=keys.has('Space');
  const fx=Math.cos(c.ang),fy=Math.sin(c.ang),rx=-fy,ry=fx;let vF=c.vx*fx+c.vy*fy,vR=c.vx*rx+c.vy*ry;
  const nitro=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&c.tune&&c.tune.turbo;
  if(up){if(vF<st.max*(nitro?1.15:1))vF+=st.acc*(nitro?1.4:1)*dt}
  if(dn){if(vF>20)vF-=st.acc*2.2*dt;else if(vF>-st.max*.3)vF-=st.acc*.7*dt}
  if(!up&&!dn){vF-=Math.sign(vF)*Math.min(Math.abs(vF),70*dt)}
  c.braking=dn&&vF>0;
  const terrain=tileAt(tx(c.x),tx(c.y));if(!DRIVE[terrain]&&terrain!==T.WBRIDGE&&terrain!==T.PIER){vF*=1-1.6*dt;if(st.m.kind!=='bike'&&Math.abs(vF)>140)vF-=Math.sign(vF)*200*dt}
  const steer=(rt?1:0)-(lf?1:0);const sr2=st.steer*clamp(Math.abs(vF)/110,0,1)*Math.sign(vF||1);c.ang+=steer*sr2*dt*(hb?1.25:1);
  let g=st.grip;if(hb){g*=.16;vF*=1-.5*dt}
  if(CARS[c.model].drive==='rwd'&&up&&Math.abs(vF)>200&&steer)g*=.5;
  vR*=Math.exp(-g*dt);
  c.vx=fx*vF+rx*vR;c.vy=fy*vF+ry*vR;
  const spd=Math.hypot(c.vx,c.vy),ang=Math.atan2(Math.abs(vR),Math.abs(vF)+1);
  if(st.m.kind!=='bike'&&spd>150&&ang>.26){DRIFT.cur+=spd*ang*dt*.6;DRIFT.t=0;if(Math.random()<.6)smoke(c)}else{DRIFT.t+=dt;if(DRIFT.t>1&&DRIFT.cur>0)bankDrift()}
  carMove(c,dt);
  ENGINE.target=spd;
}
function carMove(c,dt){const m=CARS[c.model],r=m.kind==='bike'?7:Math.min(14,m.wid*.6);const spd=Math.hypot(c.vx,c.vy);
  const arr=c===P.inCar?SOLID_CAR:SOLID_CAR;const hx=moveCircle(c,c.vx*dt,0,r,arr),hy=moveCircle(c,0,c.vy*dt,r,arr);
  if(hx||hy){if(hx)c.vx*=-.3;if(hy)c.vy*=-.3;if(spd>200){c.hp-=spd/60;if(c===P.inCar){shake(spd/60);SND.hit(.4)}}}
  // also keep long cars from clipping corners
  const fx=Math.cos(c.ang)*m.len*.42,fy=Math.sin(c.ang)*m.len*.42;
  if(m.kind!=='bike'&&(solidAt(c.x+fx,c.y+fy,SOLID_CAR)||solidAt(c.x-fx,c.y-fy,SOLID_CAR))){c.x-=c.vx*dt;c.y-=c.vy*dt;c.vx*=-.25;c.vy*=-.25}}
function updatePolice(c,dt){const tgt=P.inCar||P;const a=Math.atan2(tgt.y-c.y,tgt.x-c.x);let da=((a-c.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
  const st=carStats(c),fx=Math.cos(c.ang),fy=Math.sin(c.ang),rx=-fy,ry=fx;let vF=c.vx*fx+c.vy*fy,vR=c.vx*rx+c.vy*ry;const d=dist(c.x,c.y,tgt.x,tgt.y);
  if(P.heat<=0){vF*=1-dt;c.siren=false}else{c.siren=true;
    if(c.rev>0){c.rev-=dt;vF=Math.max(vF-st.acc*dt,-120);c.ang-=da*dt}else{c.ang+=clamp(da,-1,1)*2.6*dt*clamp(Math.abs(vF)/100,.3,1);const want=d<80?60:st.max*(Math.abs(da)>1?.45:.9);if(vF<want)vF+=st.acc*dt;else vF-=st.acc*dt}
    if(Math.hypot(c.vx,c.vy)<25){c.stuck+=dt;if(c.stuck>1.4){c.rev=1;c.stuck=0}}else c.stuck=0}
  vR*=Math.exp(-st.grip*dt);c.vx=fx*vF+rx*vR;c.vy=fy*vF+ry*vR;carMove(c,dt)}
function carCollisions(){const cs=ENT.cars;for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const a=cs[i],b=cs[j];const ma=CARS[a.model],mb=CARS[b.model];
  const ra=ma.kind==='bike'?9:ma.len*.42,rb=mb.kind==='bike'?9:mb.len*.42,d=dist(a.x,a.y,b.x,b.y);if(d>=ra+rb||d===0)continue;
  const nx=(b.x-a.x)/d,ny=(b.y-a.y)/d,ov=(ra+rb-d)/2;
  if(a.ai==='block'){a.vx=a.vy=0}if(b.ai==='block'){b.vx=b.vy=0}
  const am=a.ai==='parked'||a.ai==='traffic'||a.ai==='hwy',bm=b.ai==='parked'||b.ai==='traffic'||b.ai==='hwy';
  a.x-=nx*ov*(am&&!bm?.3:1);a.y-=ny*ov*(am&&!bm?.3:1);b.x+=nx*ov*(bm&&!am?.3:1);b.y+=ny*ov*(bm&&!am?.3:1);
  const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){const imp=-rv*.8;a.vx-=nx*imp*.5;a.vy-=ny*imp*.5;b.vx+=nx*imp*.5;b.vy+=ny*imp*.5;
    const pc=P.inCar;if((a===pc||b===pc)&&imp>90){SND.hit(.5);shake(imp/80);const o=a===pc?b:a;
      if(o.ai==='traffic'||o.ai==='hwy'){o.ai='parked';o.vx=(o===b?nx:-nx)*imp*.4;o.vy=(o===b?ny:-ny)*imp*.4;const drv=spawnPed('civ',o.x+30,o.y,null);drv.angry=Math.random()<.35;bubble(drv,pick(['Ei! Ką darai?!','Bliamba!','Ar tu normalus?!']));if(Math.random()<.5)crime(1,'Car crash')}
      if(o.ai==='police')crime(1,'Rammed a police car')}}}}

/* ---------- peds ---------- */
function updatePed(e,dt){
  if(e.kind==='crew'){updateCrew(e,dt);return}
  if(e.kind==='dog'){updateDog(e,dt);return}
  if(e.enemyFac&&!(e.ko>0)&&!e.angry&&brawlUpdate(e,dt))return;
  if(e.ko>0){e.ko-=dt;if(e.ko<=0){if(e.kind==='police'||Math.random()<.5){e.ko=0;e.hp=e.maxhp*.5;e.state='flee';e.t=4}else e.dead=true}return}
  e.cd-=dt;e.talk-=dt;const pd=dist(e.x,e.y,P.x,P.y),pin=!!P.inCar;
  // hostility
  let hostile=e.angry;
  if(!hostile&&P.age>=13&&!pin){const mf=myFac();
    if(e.kind==='gang'&&mf&&mf.league==='street'&&e.fac!==P.faction){const d=districtAt(e.x,e.y);if(d&&d.owner===e.fac&&pd<8*TS)hostile=true;if(e.attacker)hostile=true}
    if(e.kind==='school'&&mf&&mf.league==='school'&&e.fac!==P.faction&&pd<7*TS)hostile=true;
    if(e.kind==='police'&&P.heat>0)hostile=true}
  if(e.kind==='police'&&P.heat<=0)hostile=false;
  if(P.age<13&&e.kind!=='police')hostile=false;
  e.hostile=hostile;
  let mvx=0,mvy=0;
  if(e.state==='flee'){e.t-=dt;const a=Math.atan2(e.y-P.y,e.x-P.x);mvx=Math.cos(a)*e.sp*2.2;mvy=Math.sin(a)*e.sp*2.2;if(e.t<=0)e.state='wander'}
  else if(hostile&&pd<14*TS){let tgt=pin?P.inCar:P,tc=null;if(e.kind!=='police')for(const c of ENT.peds){if(c.kind==='crew'&&!(c.ko>0)&&!c.ride&&dist(c.x,c.y,e.x,e.y)<dist(tgt.x,tgt.y,e.x,e.y)){tgt=c;tc=c}}
    const a=Math.atan2(tgt.y-e.y,tgt.x-e.x),td=dist(tgt.x,tgt.y,e.x,e.y);const spd=e.kind==='police'?130:112;
    if(td>22){mvx=Math.cos(a)*spd;mvy=Math.sin(a)*spd}
    else if((!pin||tc)&&e.cd<=0){e.cd=e.kind==='police'?1.2:rnd(.8,1.2);e.punch=.2;
      if(tc){tc.hp-=ri(6,11);fxBurst(tc.x,tc.y-20,'#fff');if(tc.hp<=0){tc.ko=22;log(`${tc.name} is down! He\'ll be back on his feet soon.`,'bad')}}
      else if(e.kind==='police'){BUST.t+=1}else{hurtPlayer(e.kind==='school'?ri(4,7):ri(6,12),e)}}}
  else{e.t-=dt;if(e.t<=0){e.t=rnd(1.5,5);e.dir=ri(0,3);e.idle=Math.random()<.3}
    if(!e.idle){const D=[[1,0],[0,1],[-1,0],[0,-1]][e.dir];mvx=D[0]*e.sp;mvy=D[1]*e.sp;
      const nt=tileAt(tx(e.x+D[0]*14),tx(e.y+D[1]*14));if(!pedOK(nt)||(e.kind!=='civ'&&e.kind!=='elder'&&!WALKABLE[nt]&&CITYA[idx(tx(e.x),tx(e.y))])){e.dir=(e.dir+ri(1,3))%4;mvx=mvy=0}}}
  if(mvx||mvy){e.anim+=dt*10;e.dir=Math.abs(mvx)>Math.abs(mvy)?(mvx>0?0:2):(mvy>0?1:3);moveCircle(e,mvx*dt,mvy*dt,7,SOLID_FOOT)}
  if(e.punch>0)e.punch-=dt;
  // cars hit peds
  for(const c of ENT.cars){const sp=Math.hypot(c.vx,c.vy);if(sp<120)continue;if(dist(c.x,c.y,e.x,e.y)<18){e.hp-=sp/6;e.x+=c.vx*.08;e.y+=c.vy*.08;if(e.hp<=0)knockOut(e,c===P.inCar);
    if(c===P.inCar){crime(e.kind==='police'?2:1,'Hit a pedestrian');SND.hit(.6)}}}
}
function knockOut(e,byPlayer){if(e.ko>0)return;e.ko=rnd(20,35);e.hp=0;e.state='ko';
  if(byPlayer){P.stats.ko=(P.stats.ko||0)+1;
    if(Math.random()<.55&&SCENE){const v=ri(2,20);P.money+=v;log(`+${eur(v)}`,'good')}else if(Math.random()<.55){ENT.pickups.push({k:'cash',v:ri(e.kind==='gang'?8:2,e.kind==='gang'?30:12),x:e.x+rnd(-8,8),y:e.y+rnd(-8,8)})}
    const mf=myFac();
    if(e.kind==='gang'&&mf&&mf.league==='street'&&e.fac!==P.faction){gainRep(P.faction,4);const d=SCENE?null:districtAt(e.x,e.y);
      if(d&&d.owner===e.fac){CAP[d.id]=(CAP[d.id]||0)+1;if(CAP[d.id]===capNeed(d))log(`${d.name}: enough ${FACTIONS[e.fac].short} down. Tag the district centre to take it (hold E with a spray can).`,'amb')}
      missionEvent('ko',e)}
    else if(e.kind==='school'&&mf&&mf.league==='school'&&e.fac!==P.faction){gainRep(P.faction,5);missionEvent('ko',e)}
    else if(e.kind==='police'){crime(2,'Knocked out an officer')}
    else if(e.kind==='civ'||e.kind==='elder'||e.kind==='kid'){crime(1,'Assault');setMood(-3)}
    else missionEvent('ko',e)}}
function hurtPlayer(n,src){if(P.inv_t>0)return;const army=P.parent==='army'?.85:1;P.hp-=n*army;P.hitFlash=.2;SND.hit(.35);
  if(src){const a=Math.atan2(P.y-src.y,P.x-src.x);if(SCENE)iMove(P,Math.cos(a)*10,Math.sin(a)*10,8);else moveCircle(P,Math.cos(a)*10,Math.sin(a)*10,8,SOLID_FOOT)}
  if(P.hp<=0)wipeOut()}
const CAP={};const capNeed=d=>CITIES[d.ci].districts[0]===d.name&&d.di===0?8:6;
const BUST={t:0};
function playerPunch(){if(P.inCar||P.punchCd>0)return;P.punchCd=.38;P.punchT=.18;SND.whoosh();
  const D=[[1,0],[0,1],[-1,0],[0,-1]][P.dir];let hit=false;const PEDS=SCENE?SCENE.peds:ENT.peds;
  for(const e of PEDS){if(e.ko>0||e.kind==='crew'||e.kind==='dog'||e.pet)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d>34)continue;if(d>4&&(dx*D[0]+dy*D[1])/d<.2)continue;
    if(P.age<13){e.x+=D[0]*14;e.y+=D[1]*14;bubble(e,pick(['Ei!','Nustok!','Mama!']));hit=true;continue}
    const dmg=(10+P.fight*1.6+(P.gear.bat&&P.age>=16?12:0))*(P.parent==='army'?1.15:1);e.hp-=dmg;hit=true;e.x+=D[0]*10;e.y+=D[1]*10;
    fxBurst(e.x,e.y-20,'#fff');
    if(e.kind==='gang'||e.kind==='school'){e.angry=true;e.attacker=true;PEDS.forEach(o=>{if(o.fac===e.fac&&dist(o.x,o.y,e.x,e.y)<9*TS)o.angry=true})}
    else if(e.kind==='police'){crime(1,'Assaulting an officer');e.angry=true}
    else{if(Math.random()<.35)e.angry=true;else{e.state='flee';e.t=4}if(!e.hit)crime(1,'Assault');e.hit=true}
    if(e.hp<=0)knockOut(e,true)}
  if(hit){SND.hit(.5);P.fightXp=(P.fightXp||0)+1;if(P.fightXp>=P.fight*12&&P.fight<10){P.fight++;P.fightXp=0;log(`Fighting skill up: ${P.fight}/10`,'good')}}
  PEDS.forEach(o=>{if(!o.hostile&&(o.kind==='civ'||o.kind==='elder'||o.kind==='kid')&&dist(o.x,o.y,P.x,P.y)<6*TS&&hit){o.state='flee';o.t=3}})}
function crime(n,why){if(P.age<13&&n<2)return;const prev=Math.floor(P.heat);P.heat=Math.min(5,P.heat+n);HEAT.calm=0;if(Math.floor(P.heat)>prev)log(`★ Police attention: ${why}`,'bad')}
const HEAT={calm:0};
function updateHeat(dt){if(P.heat<=0){BUST.t=0;return}
  const seen=ENT.peds.some(e=>e.kind==='police'&&!e.ko&&dist(e.x,e.y,P.x,P.y)<13*TS)||ENT.cars.some(c=>c.ai==='police'&&dist(c.x,c.y,P.x,P.y)<15*TS);
  if(seen)HEAT.calm=0;else HEAT.calm+=dt*(P.parent==='police'?2:1);
  if(HEAT.calm>7+P.heat*2.5){P.heat=Math.max(0,Math.ceil(P.heat)-1);HEAT.calm=0;if(P.heat===0){log('The police lost interest.','good');ENT.cars.forEach(c=>{if(c.ai==='police')c.siren=false})}}
  // car bust
  if(P.inCar){const sp=Math.hypot(P.inCar.vx,P.inCar.vy);const near=ENT.cars.some(c=>c.ai==='police'&&dist(c.x,c.y,P.inCar.x,P.inCar.y)<60);if(near&&sp<40)BUST.t+=dt*.8;else BUST.t=Math.max(0,BUST.t-dt*.5)}
  else{const near=ENT.peds.some(e=>e.kind==='police'&&!e.ko&&dist(e.x,e.y,P.x,P.y)<26);if(!near)BUST.t=Math.max(0,BUST.t-dt*.4)}
  if(BUST.t>=2.2)busted()}

/* ---------- player on foot ---------- */
function updatePlayer(dt){
  P.punchCd-=dt;P.punchT-=dt;P.inv_t-=dt;P.hitFlash-=dt;
  if(P.inCar){const c=P.inCar;P.x=c.x;P.y=c.y;if(c.ai==='parked'||c.ai===null)updatePlayerCar(c,dt);return}
  let mx=0,my=0;if(keys.has('KeyW')||keys.has('ArrowUp'))my--;if(keys.has('KeyS')||keys.has('ArrowDown'))my++;if(keys.has('KeyA')||keys.has('ArrowLeft'))mx--;if(keys.has('KeyD')||keys.has('ArrowRight'))mx++;
  if(JOY.on){mx=JOY.x;my=JOY.y}
  if(TAP.on&&!mx&&!my){const d=dist(TAP.x,TAP.y,P.x,P.y);if(d>8){mx=(TAP.x-P.x)/d;my=(TAP.y-P.y)/d}else TAP.on=false}
  const L=Math.hypot(mx,my);if(L>1){mx/=L;my/=L}
  const sprint=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&P.energy>5;
  let sp=(P.age<10?100:P.age<15?120:130)*(sprint?1.6:1)*(P.energy<5?.6:1);
  const t=tileAt(tx(P.x),tx(P.y));if(t===T.FOREST||t===T.DUNE||t===T.SAND)sp*=.75;
  if(L>0){P.anim+=dt*(sprint?14:10);P.dir=Math.abs(mx)>Math.abs(my)?(mx>0?0:2):(my>0?1:3);moveCircle(P,mx*sp*dt,my*sp*dt,8,SOLID_FOOT);if(sprint)P.energy-=dt*.6}
  ENGINE.target=0;
  // pickups
  for(const k of ENT.pickups){if(k.got)continue;if(dist(k.x,k.y,P.x,P.y)<22){k.got=true;
    if(k.k==='bottle'){give('bottle',1);SND.blip(880);missionEvent('bottle')}
    else if(k.k==='cash'){P.money+=k.v;SND.coin();log(`+${eur(k.v)}`,'good')}
    else if(k.k==='amber'){give('amber',1);SND.blip(660);log('Found a piece of amber on the beach. Sell it at a market (turgus).','amb')}
    else if(k.k==='kontra'){give('kontra',k.n||1);SND.blip(520);missionEvent('kontra')}
    else if(k.k==='mush'){give(k.mush,1);SND.blip(720);log(`Radai grybą: ${ITEMS[k.mush].n}.${k.mush==='musmire'?' Gražus, bet nuodingas.':' Turguje nupirks.'}`,'amb')}
    else if(k.k==='fern'){give('papartis',1);setMood(30);P.money+=100;SND.fanfare();toast('🌸','Paparčio žiedas!','You found the legendary fern flower. Luck and +€100.');chron('Found the fern flower on Joninės night.')}}}
  ENT.pickups=ENT.pickups.filter(k=>!k.got);
}

/* ---------- drift + fx ---------- */
const DRIFT={cur:0,t:0};
function bankDrift(){const s=Math.round(DRIFT.cur);DRIFT.cur=0;if(s<150)return;P.stats.drift=(P.stats.drift||0)+s;P.stats.bestDrift=Math.max(P.stats.bestDrift||0,s);
  const mf=myFac();if(mf&&mf.league==='auto'){const r=Math.floor(s/450);if(r>0)gainRep(P.faction,r)}
  missionEvent('drift',s);if(s>1500)log(`Drift: ${s} points`,'amb')}
function smoke(c){ENT.fx.push({k:'smoke',x:c.x-Math.cos(c.ang)*18+rnd(-6,6),y:c.y-Math.sin(c.ang)*18+rnd(-6,6),r:rnd(5,9),life:1.1,max:1.1})}
function fxBurst(x,y,col){for(let i=0;i<6;i++)ENT.fx.push({k:'spark',x,y,vx:rnd(-90,90),vy:rnd(-120,20),life:.35,max:.35,col})}
function bubble(e,text){ENT.bubbles.push({e,text,life:3})}
let SHAKE=0;function shake(n){SHAKE=Math.min(12,SHAKE+n)}
