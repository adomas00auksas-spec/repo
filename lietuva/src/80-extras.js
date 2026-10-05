
/* =====================================================================
   EXTRAS: crew followers, story chapters, stairwells, winter, yard hoops
   ===================================================================== */

/* ---------- crew (bičai who follow you) ---------- */
const crewMax=()=>{const f=myFac();if(!f||f.league!=='street')return 0;return clamp(rankIdx(P.faction)-1,0,3)};
function crewList(){return ENT.peds.filter(e=>e.kind==='crew')}
function syncCrew(){if(SCENE)return;const want=Math.min(P.crew||0,crewMax());let have=crewList();
  if(have.length>want){have.slice(want).forEach(e=>e.dead=true);ENT.peds=ENT.peds.filter(e=>!e.dead)}
  for(let k=have.length;k<want;k++){const a=rnd(Math.PI*2);const e=spawnPed('gang',P.x+Math.cos(a)*40,P.y+Math.sin(a)*40,P.faction,{kind:'crew',keep:true,hp:90,sp:100,name:pick(['Tomka','Žilka','Mantelis','Rimka','Dzidas','Benas','Gedas','Kipšas'])});e.maxhp=90}}
function updateCrew(e,dt){if(e.ko>0){e.ko-=dt;if(e.ko<=0){e.ko=0;e.hp=e.maxhp*.6}return}
  e.cd-=dt;if(e.punch>0)e.punch-=dt;
  if(P.inCar){e.ride=true;e.x=P.inCar.x;e.y=P.inCar.y;return}
  if(e.ride){e.ride=false;const a=rnd(Math.PI*2);e.x=P.x+Math.cos(a)*30;e.y=P.y+Math.sin(a)*30;if(blocked(e.x,e.y,7,SOLID_FOOT)){e.x=P.x;e.y=P.y}}
  let tgt=null,bd=7*TS;for(const o of ENT.peds){if(o===e||o.kind==='crew'||o.ko>0||o.kind==='police')continue;if(!(o.hostile||o.angry))continue;const d=dist(o.x,o.y,e.x,e.y);if(d<bd){bd=d;tgt=o}}
  let vx=0,vy=0;
  if(tgt){const a=Math.atan2(tgt.y-e.y,tgt.x-e.x);if(bd>22){vx=Math.cos(a)*125;vy=Math.sin(a)*125}else if(e.cd<=0){e.cd=rnd(.7,1.1);e.punch=.2;tgt.hp-=ri(8,14);tgt.angry=true;fxBurst(tgt.x,tgt.y-20,'#fff');SND.hit(.25);if(tgt.hp<=0)knockOut(tgt,true)}}
  else{const d=dist(e.x,e.y,P.x,P.y);if(d>8*TS){e.x=P.x+rnd(-20,20);e.y=P.y+rnd(-20,20)}else if(d>54){const a=Math.atan2(P.y-e.y,P.x-e.x),s=d>140?170:105;vx=Math.cos(a)*s;vy=Math.sin(a)*s}}
  if(vx||vy){e.anim+=dt*10;e.dir=Math.abs(vx)>Math.abs(vy)?(vx>0?0:2):(vy>0?1:3);moveCircle(e,vx*dt,vy*dt,7,SOLID_FOOT)}}
function crewHQActs(p){const fid=p.hq;if(P.faction!==fid||FACTIONS[fid].league!=='street')return '';const mx=crewMax(),n=Math.min(P.crew||0,mx);
  let h=`<h3 style="font:800 20px var(--display);margin:14px 0 8px">Tavo bičai · your crew (${n}/${mx})</h3>`;
  if(!mx)return h+'<p class="note">Reach <b>Bachūras</b> rank and the boss will let you bring people along.</p>';
  h+=act('Pasikviesti bičą','A crew member follows you and fights with you. Up to one more per rank above Bičas.',`€60`,()=>{if((P.crew||0)>=mx){log('No more room in your crew at this rank.','bad');return}if(!pay(60))return;P.crew=(P.crew||0)+1;syncCrew();log('A new bičas joins you. „Eime.“','good');openHQ(p)},n>=mx);
  if(n)h+=act('Paleisti bičus','Send your crew home.','Paleisti',()=>{P.crew=0;syncCrew();openHQ(p)});return h}

/* ---------- highway race ---------- */
function startHwyRace(r){const c=curCity();if(!P.inCar||CARS[P.inCar.model].kind==='bike'){log('You need a car for a race. Get in one (F).','bad');return}
  const opts=HWYS.filter(h=>/^A/.test(h.name)).map(h=>{const a=h.pts[0],b=h.pts[h.pts.length-1];if(dist(a[0],a[1],c.cx,c.cy)<6)return{h,pts:h.pts};if(dist(b[0],b[1],c.cx,c.cy)<6)return{h,pts:h.pts.slice().reverse()};return null}).filter(Boolean);
  if(!opts.length){log('No highway race from this town. Try Vilnius, Kaunas or Panevėžys.','bad');return}
  const o=pick(opts);const dest=nearestCity(o.pts[o.pts.length-1][0]*TS,o.pts[o.pts.length-1][1]*TS);
  const cps=o.pts.slice(1).filter((p,i,a)=>i%2===1||i===a.length-1).map(p=>({x:p[0]*TS+16,y:p[1]*TS+16}));
  const M={type:'race',hwy:true,fac:P.faction,city:c.id,t0:now()};startRace(M,r,cps);if(G.mission===M){M.title=`${c.name} → ${dest.name} (${o.h.name})`;M.pay=300+r*80;M.rep=40;toast('🏁',M.title,'Fictional race on a closed highway. Do not race on real roads.')}}

/* ---------- story chapters ---------- */
function pathNow(){const f=myFac();if(f)return f.league==='street'?'street':f.league;return P.age<13?'kid':'civil'}
const CHAPTERS={
 street:{t:'Kelias į viršų',en:'Road to the top',steps:[
  {t:'Pasiek rangą „Bičas“',en:'Earn your first promotion',done:()=>P.faction&&rankIdx(P.faction)>=1},
  {t:'Užimk pirmą rajoną',en:'Take a district: knock out its crew, then tag the centre',done:()=>G.flags.captured},
  {t:'Užpulk varžovų būstinę',en:'Raid a rival HQ and knock everyone out',done:()=>G.raids&&Object.keys(G.raids).length>0,tg:()=>POIS.find(p=>p.kind==='hq'&&p.hq!==P.faction&&FACTIONS[p.hq].league==='street'&&p.city===curCity().id)},
  {t:'Pasikviesk bičų',en:'Hire a crew member at your HQ (needs Bachūras)',done:()=>(P.crew||0)>0,tg:()=>POIS.find(p=>p.hq===P.faction)},
  {t:'Valdyk 5 rajonus',en:'Your crew holds 5 districts',done:()=>P.faction&&DISTRICTS.filter(d=>d.owner===P.faction).length>=5},
  {t:'Tapk legenda',en:'Reach the top rank of your crew',done:()=>P.faction&&rankIdx(P.faction)>=RANKS[rankTable(FACTIONS[P.faction])].length-1}]},
 auto:{t:'Šoninio karalius',en:'King of sideways',steps:[
  {t:'Laimėk gatvės lenktynes',en:'Win a club street race',done:()=>G.flags.raceWin},
  {t:'Šoninis 5 000 taškų',en:'One drift of 5,000 points',done:()=>(P.stats.bestDrift||0)>=5000},
  {t:'Įsidiek turbiną',en:'Install a turbo at a garage',done:()=>P.cars.some(c=>c.tune&&c.tune.turbo),tg:()=>nearestPOI('garage')},
  {t:'Laimėk lenktynes tarp miestų',en:'Win a highway race (rank Drifteris+)',done:()=>G.flags.hwyWin},
  {t:'Nusipirk rimtą BMW',en:'Own a BMW E46 or M5',done:()=>P.cars.some(c=>c.model==='e46'||c.model==='m5')},
  {t:'Klubo legenda',en:'Top rank in your club',done:()=>P.faction&&FACTIONS[P.faction].league==='auto'&&rankIdx(P.faction)>=4}]},
 school:{t:'Mokyklos karalius',en:'King of the school',steps:[
  {t:'Pažymėk 3 sienas',en:'Tag three walls for your school',done:()=>(G.flags.tags||0)>=3},
  {t:'Laimėk kiemo muštynes',en:'Win a yard scuffle job',done:()=>G.flags.scuffleWin},
  {t:'Įmesk 4 iš 5',en:'Score 4 of 5 at basketball',done:()=>G.flags.hoops4,tg:()=>POIS.find(p=>p.fac===P.school)},
  {t:'Kiemo lyderis',en:'Reach Kiemo lyderis',done:()=>P.faction&&rankIdx(P.faction)>=2},
  {t:'Mokyklos karalius',en:'Top rank in the yard',done:()=>P.faction&&rankIdx(P.faction)>=3}]},
 kid:{t:'Kiemo vaikas',en:'Yard kid',steps:[
  {t:'Priduok 30 butelių',en:'Return 30 bottles in total',done:()=>(P.stats.bottles||0)>=30,tg:()=>nearestPOI('shop')},
  {t:'Suvalgyk ledų',en:'Eat an ice cream (buy one at Maksi)',done:()=>G.flags.ateIce},
  {t:'Aplankyk 3 lankytinas vietas',en:'See three landmarks',done:()=>Object.keys(P.landmarks).length>=3},
  {t:'Pažaisk krepšinį',en:'Shoot hoops in a yard or at school',done:()=>G.flags.hoops},
  {t:'Užaugk iki 13',en:'Grow up at home (bed or computer)',done:()=>P.age>=13,tg:()=>POIS.find(p=>p.id===P.home)}]},
 civil:{t:'Savas kelias',en:'Your own way',steps:[
  {t:'Atlik 3 darbus',en:'Finish three jobs from the phone',done:()=>(G.missionsDone||0)>=3},
  {t:'Nusipirk automobilį',en:'Own a car',done:()=>P.cars.some(c=>c.model!=='bike'),tg:()=>nearestPOI('garage')},
  {t:'Sutaupyk €10 000',en:'Have €10,000',done:()=>P.money>=10000},
  {t:'Nusipirk verslą',en:'Buy a kebab shop, café, bar or garage',done:()=>G.biz&&G.biz.length>0,tg:()=>nearestPOI('kebab')},
  {t:'Sutaupyk €100 000',en:'Have €100,000',done:()=>P.money>=100000}]},
};

/* ---------- stairwells (laiptinės) ---------- */
function tplStairs(b){const s=mkRoom(9,7,{floor:'lino',wall:pick(['#9FB7A8','#C9B98F','#A8B9CC','#D8A85B']),title:'Laiptinė',sub:'Daugiabučio laiptinė'});
  R.add(s,'stairs',5,2,3,3,{act:()=>log(pick(['Nine floors, no lift. Again.','Someone is frying onions on the 4th floor.','A neighbour\'s dog barks behind a door.']),'amb'),label:'Laiptai · stairs'});
  R.deco(s,'mailbox',1,1,3);R.add(s,'radiator',1,3,1,1);R.deco(s,'graffiti',4,1,1,{txt:pick(['ŽALGIRIS','LT','V+R','CENTRAS',(P.faction?FACTIONS[P.faction].short:'NU')]).slice(0,8)});
  s.pickups=[];const n=P.age<16?ri(1,3):ri(0,1);for(let k=0;k<n;k++)s.pickups.push({k:'bottle',x:ri(1,4)*TS+16,y:ri(3,5)*TS+16});
  if(Math.random()<.7)R.ped(s,'elder',2,4,{name:'Kaimynė',lines:[line('Vėl ne tavo eilė plauti laiptinę!','It\'s not your turn to clean the stairs again!'),line('Kas čia rūko laiptinėje?!','Who\'s smoking in the stairwell?!'),line('Labas, vaikeli. Kaip mama?','Hello, child. How\'s your mum?')]});
  return s}
function nearStairDoor(){const tx0=tx(P.x)>>4,ty0=tx(P.y)>>4;for(let by=ty0-1;by<=ty0+1;by++)for(let bx=tx0-1;bx<=tx0+1;bx++){if(bx<0||by<0||bx>=BW||by>=BH)continue;
  for(const b of BBUCK[by*BW+bx]){if(b.kind!=='sov'||b.poi)continue;const dx=(b.x+b.w/2)*TS,dy=(b.y+b.h)*TS+10;if(dist(dx,dy,P.x,P.y)<30)return{b,x:dx,y:dy}}}return null}

/* ---------- winter ---------- */
let WINTER=false;
function seasonCheck(){const m=doyToDate(G.time.doy).m;const w=m===11||m<=1;if(w!==WINTER){WINTER=w;chunkCache.clear();if(w){toast('❄','Žiema','Snow in Lithuania. Roads are slippery, drive carefully.')}}}

/* ---------- prompts outdoors that are not POIs ---------- */
function extraPrompt(){if(P.inCar)return null;
  for(const d of DECOR){if(d.k==='hoop'&&dist(d.x,d.y,P.x,P.y)<50)return{key:'E',text:'Krepšinis · shoot hoops',fn:()=>openHoops(sc=>{if(P.faction&&FACTIONS[P.faction].league==='school')gainRep(P.faction,Math.ceil(sc/2))})}}
  if(has('meskere')){const w=waterNear();if(w)return{key:'E',text:'Žvejoti · fish',fn:()=>openFishing(w)}}
  const gd=nearGenericDoor();if(gd)return{key:'E',text:{sov:'Laiptinė · stairwell',mall:'Prekybos centras · mall',church:'Bažnyčia · church'}[gd.b.kind],fn:()=>{const[s,p]=genericScene(gd.b);enterScene(s,p)}};
  return null}

/* ---------- generic enterable buildings (stairwells, malls, churches) ---------- */
function nearGenericDoor(){const tx0=tx(P.x)>>4,ty0=tx(P.y)>>4;for(let by=ty0-1;by<=ty0+1;by++)for(let bx=tx0-1;bx<=tx0+1;bx++){if(bx<0||by<0||bx>=BW||by>=BH)continue;
  for(const b of BBUCK[by*BW+bx]){if(b.poi||!(b.kind==='sov'||b.kind==='mall'||b.kind==='church'))continue;const dx=(b.x+b.w/2)*TS,dy=(b.y+b.h)*TS+10;if(dist(dx,dy,P.x,P.y)<30)return{b,x:dx,y:dy}}}return null}
function genericScene(b){const pseudo={kind:b.kind,x:(b.x+b.w/2)*TS,y:(b.y+b.h)*TS-4,city:b.city,id:'g_'+b.id,b};
  if(b.kind==='sov')return[tplStairs(b),Object.assign(pseudo,{name:'Laiptinė'})];
  if(b.kind==='mall')return[tplMall(Object.assign(pseudo,{name:'Prekybos centras'})),Object.assign(pseudo,{name:'Prekybos centras'})];
  return[tplChurch(Object.assign(pseudo,{name:'Bažnyčia'})),Object.assign(pseudo,{name:'Bažnyčia'})]}
function tplChurch(p){const s=mkRoom(13,11,{floor:'stone',wall:'#EDE8DC',title:p.name,sub:'Bažnyčia'});R.add(s,'altar',5,2,3,1);
  for(let y=4;y<=8;y+=2){R.add(s,'pew',2,y,3,1);R.add(s,'pew',8,y,3,1)}R.add(s,'candles',10,2,2,1,{act:()=>{if(pay(1)){setMood(10);log('You light a candle. A quiet moment.','good')}},label:'Uždegti žvakę · light a candle (€1)'});
  R.deco(s,'window',2,1,2);R.deco(s,'window',9,1,2);R.ped(s,'elder',3,9,{lines:[line('Tylos, vaikeli.','Quiet, child.'),line('Sekmadienį ateik į mišias.','Come to mass on Sunday.')]});return s}
function tplMall(p){const s=mkRoom(20,12,{floor:'shop',wall:'#DCE3E6',title:p.name,sub:'Prekybos centras'});
  R.wallH(s,1,18,5,[3,4,9,10,15,16]);R.wallV(s,6,2,4);R.wallV(s,13,2,4);
  R.deco(s,'sign',1,1,4,{txt:'MADA',col:'#6B4FA0'});R.deco(s,'sign',7,1,5,{txt:'KINAS',col:'#B5332B'});R.deco(s,'sign',14,1,4,{txt:'MAISTAS',col:'#E2A11B'});
  R.add(s,'rack',1,3,2,1,{act:openClothes,label:'Drabužiai · clothes and accessories'});R.add(s,'rack',4,3,2,1,{act:openClothes,label:'Drabužiai · clothes and accessories'});
  R.ped(s,'staff',3,4,{name:'Konsultantė',lk:staffLook('#6B4FA0',{female:true}),lines:[line('Šitas jums labai tinka!','This really suits you!')],act:openClothes});
  R.add(s,'screen',8,3,4,1,{act:()=>{if(pay(7)){skipHours(2);setMood(15);log(pick(['A Lithuanian comedy. The whole hall laughed at the grandmother.','An action film. Lots of explosions, little plot.','A cartoon. You were the only adult. Worth it.']),'good')}},label:'Kinas · watch a film (€7)'});
  R.add(s,'counter',14,4,4,1,{act:()=>openShopList('Maisto kiemelis',['cepelinai','kibinas','saltibarsciai','kebabas','ledai','gira']),label:'Maisto kiemelis · food court'});
  R.ped(s,'staff',16,3,{name:'Virėjas',lk:staffLook('#F1EBDD',{female:false}),lines:[line('Cepelinai ką tik iš puodo!','Cepelinai fresh from the pot!')]});
  R.add(s,'fountain',9,7,2,2);[[3,8],[15,8],[6,9]].forEach(([x,y])=>R.add(s,'table',x,y,1,1,{chairs:true}));R.add(s,'plant',1,6);R.add(s,'plant',18,6);
  for(let k=0;k<3;k++)R.ped(s,pick(['civ','civ','kid']),ri(2,17),ri(7,10),{lines:TALK_CIV});
  R.ped(s,'staff',12,10,{name:'Apsauga',lk:staffLook('#1D2724',{female:false,cap:'#1D2724'}),lines:[line('Riedlentės čia draudžiamos.','No skateboards in here.')]});return s}
function openShopList(title,items){let h=mHead('🛒',esc(title),'')+'<div class="mbody">';items.forEach(id=>{const it=ITEMS[id];const pr=price(it.price,'food');h+=act(`${it.ic} ${it.n}`,it.en,eur(pr),()=>{if(pay(pr)){give(id,1);G.flags.bought=true;log(`Bought: ${it.n}`)}openShopList(title,items)},it.min&&P.age<it.min)});
  openModal(h+`</div><div class="mfoot"><span style="margin-right:auto;align-self:center;font-weight:700">${eur(P.money)}</span><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
const ACCESSORIES=[{id:'glasses',t:'Saulės akiniai',en:'Sunglasses',price:25},{id:'chain',t:'Auksinė grandinėlė',en:'Gold chain. Very 90s.',price:180,min:16},{id:'zalgiris',t:'Žalgirio marškinėliai',en:'Green Žalgiris jersey, number 11',price:45,outfit:true},{id:'cap',t:'Kepurė su snapeliu',en:'Baseball cap',price:12}];
function openClothes(){P.owned=P.owned||{};let h=mHead('👕','Drabužiai','Clothes and accessories')+'<div class="mbody">';
  ACCESSORIES.forEach(a=>{const own=P.owned[a.id]||(a.id==='cap');const on=a.id==='zalgiris'?P.look.outfit==='zalgiris':a.id==='cap'?P.look.cap:P.look[a.id];
    h+=act(a.t,a.en+(own?' · owned':''),own?(on?'Nusiimti':'Dėvėti'):eur(a.price),()=>{if(!own){if(a.min&&P.age<a.min)return log('Too young for that.','bad');if(!pay(a.price))return;P.owned[a.id]=true}
      if(a.id==='zalgiris'){P.look.outfit=on?'track':'zalgiris';P.look.color=null}else if(a.id==='cap')P.look.cap=!on;else P.look[a.id]=!on;openClothes()},a.min&&P.age<a.min&&!own)});
  h+=act('Spinta','Change outfit and colours.','Atidaryti',()=>openWardrobe());openModal(h+'</div>')}

/* ---------- fishing ---------- */
const FISH_SEA=[['strimele',.35],['plekste',.3],['menke',.2],['stinta',.15]],FISH_FRESH=[['kuoja',.32],['eserys',.26],['karsis',.16],['lydeka',.12],['sterkas',.08],['unguris',.06]];
Object.assign(ITEMS,{meskere:{n:'Meškerė',en:'Fishing rod. Stand by water and press E',ic:'🎣',price:20,tool:true},
 kuoja:{n:'Kuoja',en:'Roach. Small and common',ic:'🐟',price:0,sell:2,fish:1},eserys:{n:'Ešerys',en:'Perch with stripes',ic:'🐟',price:0,sell:3,fish:1},karsis:{n:'Karšis',en:'Bream',ic:'🐟',price:0,sell:5,fish:2},
 lydeka:{n:'Lydeka',en:'Pike. Toothy and proud',ic:'🐊',price:0,sell:12,fish:3},sterkas:{n:'Sterkas',en:'Zander, a restaurant favourite',ic:'🐟',price:0,sell:15,fish:3},unguris:{n:'Unguris',en:'Eel. Smoked in Nida',ic:'🐍',price:0,sell:20,fish:4},
 strimele:{n:'Strimelė',en:'Baltic herring',ic:'🐟',price:0,sell:3,fish:1},plekste:{n:'Plekšnė',en:'Flounder, flat as a plate',ic:'🐟',price:0,sell:6,fish:2},menke:{n:'Menkė',en:'Cod',ic:'🐟',price:0,sell:9,fish:3},stinta:{n:'Stinta',en:'Smelt. Palanga holds a whole festival for it',ic:'🐟',price:0,sell:4,fish:2}});
SHOPS.market.items.push('meskere');
function waterNear(){const x=tx(P.x),y=tx(P.y);for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1],[0,0]]){const t=tileAt(x+dx,y+dy);if(t===T.SEA)return'sea';if(t===T.WATER)return'fresh'}if(tileAt(x,y)===T.PIER)return tileAt(x,y+2)===T.SEA||tileAt(x-3,y)===T.SEA?'sea':'fresh';return null}
function rollFish(kind){const tb=kind==='sea'?FISH_SEA:FISH_FRESH;let r=Math.random(),acc=0;for(const[id,w]of tb){acc+=w;if(r<acc)return id}return tb[0][0]}
function openFishing(kind){let phase='wait',t=rnd(1.2,3.5),pos=0,dir=1,zone=rnd(25,65),fish=rollFish(kind),diff=ITEMS[fish].fish,zw=Math.max(8,20-diff*3),speed=1+diff*.5,run=true;
  openModal(mHead('🎣','Žvejyba',kind==='sea'?'Baltijos jūra':'Ežeras, upė ar marios')+`<div class="mbody mg"><p id="fr" class="note" style="font-size:15px">Laukiam… (waiting for a bite)</p><div class="mgbar"><div class="zone2" style="left:${zone}%;width:${zw}%;opacity:.25" id="fz"></div><div class="mark" id="fm"></div></div></div><div class="mfoot"><button class="btn green" id="fs">Traukti</button><button class="btn ghost" onclick="FISHG.run=false;closeModal()">Baigti</button></div>`);
  const pull=()=>{if(!run)return;if(phase==='wait'){$('#fr').textContent='Per anksti! Too early, the fish swam off.';phase='done';run=false;FISHG.run=false;return}
    if(phase==='bite'){const ok=pos>=zone&&pos<=zone+zw;run=false;FISHG.run=false;phase='done';skipHours(.5);P.energy-=3;
      if(ok){give(fish,1);P.stats.fish=(P.stats.fish||0)+1;SND.fanfare();setMood(5);$('#fr').innerHTML=`Pagavai: <b>${ITEMS[fish].n}</b> (${ITEMS[fish].en}). Market price ${eur(ITEMS[fish].sell)}.`}
      else{SND.blip(200);$('#fr').textContent='Nutrūko! It got away.'}}};
  $('#fs').onclick=pull;FISHG.pull=pull;FISHG.run=true;
  const tick=()=>{if(!FISHG.run||!$('#fm'))return;if(phase==='wait'){t-=1/60;if(t<=0){phase='bite';$('#fr').textContent='Kimba! A bite! Pull when the marker is in the green.';$('#fz').style.opacity=1;SND.blip(700)}}
    else if(phase==='bite'){pos+=dir*speed;if(pos>100||pos<0)dir*=-1}$('#fm').style.left=pos+'%';requestAnimationFrame(tick)};tick()}
const FISHG={run:false,pull:null};
GOALS.push({id:'fish',t:'Žvejys',en:'Catch 20 fish',ok:()=>(P.stats.fish||0)>=20,prog:()=>(P.stats.fish||0)+'/20'},
 {id:'biz',t:'Verslininkas',en:'Own 3 businesses',ok:()=>G.biz&&G.biz.length>=3,prog:()=>(G.biz?G.biz.length:0)+'/3'});
