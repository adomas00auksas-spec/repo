
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
function seasonCheck(){const m=doyToDate(G.time.doy).m;const w=m===11||m<=1;if(w!==WINTER){WINTER=w;chunkCache.clear();iceCheck();if(w){toast('❄','Žiema','Snow in Lithuania. Roads are slippery, drive carefully.')}}}

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
const FISH_ICE=[['kuoja',.4],['eserys',.4],['stinta',.2]],FISH_SEA=[['strimele',.35],['plekste',.3],['menke',.2],['stinta',.15]],FISH_FRESH=[['kuoja',.32],['eserys',.26],['karsis',.16],['lydeka',.12],['sterkas',.08],['unguris',.06]];
Object.assign(ITEMS,{meskere:{n:'Meškerė',en:'Fishing rod. Stand by water and press E',ic:'🎣',price:20,tool:true},
 kuoja:{n:'Kuoja',en:'Roach. Small and common',ic:'🐟',price:0,sell:2,fish:1},eserys:{n:'Ešerys',en:'Perch with stripes',ic:'🐟',price:0,sell:3,fish:1},karsis:{n:'Karšis',en:'Bream',ic:'🐟',price:0,sell:5,fish:2},
 lydeka:{n:'Lydeka',en:'Pike. Toothy and proud',ic:'🐊',price:0,sell:12,fish:3},sterkas:{n:'Sterkas',en:'Zander, a restaurant favourite',ic:'🐟',price:0,sell:15,fish:3},unguris:{n:'Unguris',en:'Eel. Smoked in Nida',ic:'🐍',price:0,sell:20,fish:4},
 strimele:{n:'Strimelė',en:'Baltic herring',ic:'🐟',price:0,sell:3,fish:1},plekste:{n:'Plekšnė',en:'Flounder, flat as a plate',ic:'🐟',price:0,sell:6,fish:2},menke:{n:'Menkė',en:'Cod',ic:'🐟',price:0,sell:9,fish:3},stinta:{n:'Stinta',en:'Smelt. Palanga holds a whole festival for it',ic:'🐟',price:0,sell:4,fish:2}});
SHOPS.market.items.push('meskere');
function waterNear(){const x=tx(P.x),y=tx(P.y);for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1],[0,0]]){const t=tileAt(x+dx,y+dy);if(t===T.SEA)return'sea';if(t===T.WATER)return WINTER?'ice':'fresh'}if(tileAt(x,y)===T.PIER)return tileAt(x,y+2)===T.SEA||tileAt(x-3,y)===T.SEA?'sea':'fresh';return null}
function rollFish(kind){const tb=kind==='sea'?FISH_SEA:kind==='ice'?FISH_ICE:FISH_FRESH;let r=Math.random(),acc=0;for(const[id,w]of tb){acc+=w;if(r<acc)return id}return tb[0][0]}
function openFishing(kind){let phase='wait',t=rnd(1.2,3.5),pos=0,dir=1,zone=rnd(25,65),fish=rollFish(kind),diff=ITEMS[fish].fish,zw=Math.max(8,20-diff*3),speed=1+diff*.5,run=true;
  openModal(mHead('🎣','Žvejyba',kind==='sea'?'Baltijos jūra':kind==='ice'?'Poledinė žvejyba · ice fishing through a hole':'Ežeras, upė ar marios')+`<div class="mbody mg"><p id="fr" class="note" style="font-size:15px">Laukiam… (waiting for a bite)</p><div class="mgbar"><div class="zone2" style="left:${zone}%;width:${zw}%;opacity:.25" id="fz"></div><div class="mark" id="fm"></div></div></div><div class="mfoot"><button class="btn green" id="fs">Traukti</button><button class="btn ghost" onclick="FISHG.run=false;closeModal()">Baigti</button></div>`);
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

/* ---------- story scenes for big moments ---------- */
const JOIN_SPEECH={gang:f=>`${f.boss} looks you up and down for a long time. „Pas mus taisyklės paprastos: savų neišduodi, svetimiems nenusileidi. Gatvės tavęs neišmokys mandagumo, bet išmokys pagarbos.“ Someone hands you a tracksuit jacket in ${f.short} colours.`,
 cartel:f=>`„${f.boss}“ does not stand up. „Čia ne gauja, čia verslas. Mes neklausinėjam, kas kur keliauja per mišką. Ir tu neklausinėk.“ A phone with one saved number lands on the table in front of you.`,
 crew:f=>`${f.boss} spins a skateboard wheel and grins. „Sveikas atvykęs į Centrą. Vakarais ant tilto, savaitgaliais Užupyje. Naujininkų gopams – nė žingsnio.“`,
 auto:f=>`${f.boss} pops the bonnet of an old BMW and points at the engine. „Mašina – kaip šeima. Prižiūrėk, ir ji tave parveš namo. Lenktyniaujam tik ten, kur niekas nenukentės.“ Everyone laughs, then revs.`,
 school:f=>`${f.boss} meets you behind the gym. „Mūsų kiemas, mūsų krepšinio aikštelė, mūsų taisyklės. Mokytojams – nė žodžio.“`};
function scene(gl,title,paras){openModal(mHead(gl,esc(title),'')+`<div class="mbody scene">${paras.map(t=>`<p>${t}</p>`).join('')}</div><div class="mfoot"><button class="btn amber" onclick="closeModal()">Tęsti</button></div>`)}
function joinScene(fid){const f=FACTIONS[fid];const fn=JOIN_SPEECH[f.type];if(fn)setTimeout(()=>scene(f.short.slice(0,3).toUpperCase(),`Sveikas, ${rankName(fid)}`,[fn(f),'<span class="note">Fictional role-play. Open the phone (T) for jobs from your new crew.</span>']),200)}
function topRankScene(fid){const f=FACTIONS[fid];setTimeout(()=>scene('★',rankName(fid),[f.league==='street'?`They stop calling you by your first name. In ${cityById(f.city).name} people lower their voice when you walk into the kebab shop. ${f.boss} pours two glasses of gira: „Dabar tu sprendi.“`
  :f.league==='auto'?`At the night meet the whole car park goes quiet when your car rolls in. Phones come out. Tomorrow half of Lithuania will watch your drift on TikTok.`
  :`The whole yard chants your name at break. Even the kids from the rival school nod when you pass.`,'<span class="note">This is a game. In real life gangs and street racing end careers, families and lives.</span>']),300)}

/* ---------- boss race (auto) ---------- */
function startBossRace(r){if(!P.inCar||CARS[P.inCar.model].kind==='bike'){log('You need a car for a race. Get in one (F).','bad');return}
  const M={type:'race',boss:true,fac:P.faction,city:curCity().id,t0:now()};startRace(M,r);if(G.mission!==M)return;M.title=`Iššūkis: ${FACTIONS[P.faction].boss}`;M.pay=600;M.rep=90;
  M.ai.forEach((a,i)=>{a.skill=i?.98:.94;a.model=i?'m5':'e46'});toast('🏁',M.title,'Beat the club boss on six checkpoints.')}

/* ---------- holidays ---------- */
const HOLIDAYS=[
 {m:8,d:1,t:'Rugsėjo 1-oji',en:'Knowledge Day. Kids carry flowers to their teachers.',mood:4},
 {m:10,d:1,t:'Vėlinės',en:'All Souls. Cemeteries glow with thousands of candles tonight.',mood:2},
 {m:11,d:24,t:'Kūčios',en:'Christmas Eve: twelve meatless dishes, kūčiukai with poppy milk.',mood:10,gift:true},
 {m:11,d:25,t:'Kalėdos',en:'Christmas. Linksmų Kalėdų!',mood:12,gift:true},
 {m:0,d:1,t:'Naujieji metai',en:'New Year. Fireworks over every town.',mood:8},
 {m:1,d:16,t:'Vasario 16-oji',en:'Restoration of the State Day, 1918. Flags on every building.',mood:8},
 {m:2,d:4,t:'Kaziuko mugė',en:'St Casimir\'s fair in Vilnius: verbos, wooden spoons and riestainiai.',mood:8},
 {m:2,d:11,t:'Kovo 11-oji',en:'Restoration of Independence, 1990.',mood:8},
 {m:5,d:24,t:'Joninės',en:'Midsummer. Bonfires, wreaths and searching for the fern flower.',mood:15},
 {m:6,d:6,t:'Valstybės diena',en:'Statehood Day. At 21:00 everyone sings Tautiška giesmė together.',mood:10},
];
function holidayToday(){const d=doyToDate(G.time.doy);return HOLIDAYS.find(h=>h.m===d.m&&h.d===d.d)}
function holidayCheck(){const h=holidayToday();if(!h)return;toast('LT',h.t,h.en);setMood(h.mood);chron(`Celebrated ${h.t}.`);
  if(h.gift&&P.age<24&&!G.flags['gift'+G.time.day]){G.flags['gift'+G.time.day]=1;const n=ri(10,40);P.money+=n;log(`A present from your family: ${eur(n)}.`,'good')}}

/* ---------- ice: frozen lakes are walkable in winter ---------- */
function iceCheck(){SOLID_FOOT[T.WATER]=WINTER?0:1;if(!WINTER&&P&&!P.inCar&&tileAt(tx(P.x),tx(P.y))===T.WATER){const[x,y]=freeSpotNear(P.x,P.y,t=>WALKABLE[t]||t===T.GRASS||t===T.SAND);P.x=x;P.y=y;log('The ice melted. You scrambled to the shore.','amb')}
  ENT.peds.forEach(e=>{if(!WINTER&&tileAt(tx(e.x),tx(e.y))===T.WATER)e.dead=true})}

/* ---------- opening hours ---------- */
const HOURS={shop:[7,23],cafe:[8,22],bar:[16,4],market:[7,15],office:[8,18],school:[7,17],gym:[6,23],garage:[8,19],bus:[5,24],hospital:[0,24],police:[0,24],kebab:[0,24],fuel:[0,24]};
function isOpen(kind){const h=HOURS[kind];if(!h)return true;const t=G.time.min/60;return h[0]<h[1]?t>=h[0]&&t<h[1]:t>=h[0]||t<h[1]}
function closedMsg(kind){const h=HOURS[kind];return `Uždaryta. Open ${h[0]}:00–${h[1]%24}:00.${kind==='shop'?' The kebab shop never closes.':''}`}

/* ---------- petrol stations (degalinės) on highways ---------- */
Object.assign(ITEMS,{hotdog:{n:'Dešrainis iš degalinės',en:'Petrol-station hot dog. A Lithuanian road-trip classic',ic:'🌭',food:30,price:2.5},kava:{n:'Kava',en:'Coffee to go',ic:'☕',energy:25,price:1.8}});
function placeFuel(){HWYS.filter(h=>/^A/.test(h.name)&&h.pts.length>3).forEach(h=>{let done=false;const mid=Math.floor(h.pts.length/2);for(const i of[mid,mid-1,mid+1]){if(done||i<1||i>=h.pts.length-1)continue;const[ax,ay]=h.pts[i],[bx,by]=h.pts[i+1];const L=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/L,ny=(bx-ax)/L;
  for(const side of[1,-1]){const cx=Math.round(ax+nx*side*6),cy=Math.round(ay+ny*side*6);let ok=true;
    for(let y=cy-3;y<=cy+3&&ok;y++)for(let x=cx-3;x<=cx+3;x++){const t=tileAt(x,y);if(CITYA[idx(x,y)]||t===T.WATER||t===T.SEA||t===T.ABROAD||t===T.BUILD||t===T.HWY||t===T.BRIDGE){ok=false;break}}
    if(!ok)continue;for(let y=cy-3;y<=cy+3;y++)for(let x=cx-3;x<=cx+3;x++){setT(x,y,T.LOT);RES[idx(x,y)]=1}
    paintLine([[ax,ay],[cx,cy]],1.2,(x,y)=>{const t=TL[idx(x,y)];if(t!==T.HWY&&t!==T.BRIDGE&&t!==T.LOT){TL[idx(x,y)]=T.HWY}});
    const b=addB({x:cx-2,y:cy-3,w:4,h:2,kind:'mall',ht:30,fac:'#E9EDE6',roof:'#B5332B',city:null});
    const p={id:'fuel_'+h.name+'_'+POIS.length,kind:'fuel',name:'Degalinė „Kelias“ · '+h.name,city:nearestCity(cx*TS,cy*TS).id,b,x:cx*TS+16,y:(cy-1)*TS+14};b.poi=p;POIS.push(p);DECOR.push({k:'pumps',x:(cx-2)*TS,y:(cy+1)*TS});done=true;break}}})}
function tplFuel(p){const s=mkRoom(12,8,{floor:'shop',wall:'#E9EDE6',title:p.name,sub:'Degalinė'});R.deco(s,'sign',4,1,4,{txt:'KELIAS',col:'#B5332B'});
  R.add(s,'counter',2,3,4,1,{reg:true,act:()=>openShopList('Degalinė',['hotdog','kava','gira','energ','kibinas','bandage']),label:'Kasa · hot dogs and coffee'});
  R.ped(s,'staff',3,2,{name:'Kasininkas',lk:staffLook('#B5332B',{female:false}),lines:[line('Dešrainio su garstyčiomis?','Hot dog with mustard?'),line('Kuri kolonėlė?','Which pump?')]});
  R.add(s,'shelf',7,3,4,1,{seed:3});R.add(s,'fridgeShop',8,5,3,1);R.add(s,'cooler',1,6,1,1,{act:()=>{const c=garageCar(p);if(!c)return log('Park your car outside first.','bad');if(!pay(8))return;c.hp=Math.min(100,(c.hp||100)+30);if(c.owned!==undefined)P.cars[c.owned].hp=c.hp;log('Car wash and a quick check: condition +30%.','good')},label:'Plovykla · car wash (€8)'});
  R.ped(s,'civ',6,6,{lines:[line('Iki Klaipėdos dar du šimtai kilometrų…','Two hundred more km to Klaipėda…')]});return s}

/* ---------- music (sutartinės-style pentatonic) ---------- */
const MUSIC={on:true,t:0,step:0};
function musicTick(dt){if(!SND.on||!MUSIC.on||!SND.ctx||paused&&!SCENE)return;MUSIC.t-=dt;if(MUSIC.t>0)return;const night=nightLevel()>.3;MUSIC.t=night?.75:.5;
  const scale=[146.8,174.6,196,220,261.6,293.7,349.2,392];const pat=[0,2,4,3,2,4,5,4,3,1,2,0];const n=pat[MUSIC.step%pat.length];MUSIC.step++;
  if(Math.random()<.18)return;SND.tone(scale[n]*(SCENE?1:1),night?1.2:.9,'triangle',SCENE?.025:.03);if(MUSIC.step%4===0)SND.tone(scale[0]/2,1.4,'sine',.03)}

/* ---------- roadblocks ---------- */
function roadblockTick(){if(P.heat<4||!P.inCar||SCENE)return;if(ENT.cars.some(c=>c.ai==='block'))return;const c=P.inCar,sp=Math.hypot(c.vx,c.vy);if(sp<150)return;
  const ux=c.vx/sp,uy=c.vy/sp,ax=c.x+ux*20*TS,ay=c.y+uy*20*TS;if(!DRIVE[tileAt(tx(ax),tx(ay))])return;const pa=Math.atan2(uy,ux)+Math.PI/2;
  for(const s of[-1,1])ENT.cars.push({type:'car',ai:'block',model:'police',x:ax+Math.cos(pa)*26*s,y:ay+Math.sin(pa)*26*s,ang:pa,vx:0,vy:0,hp:200,siren:true,keep:false});
  log('★ Kelio užtvara! Police roadblock ahead.','bad')}

/* ---------- gang-vs-gang street brawls ---------- */
let BRAWL_T=40;
function brawlTick(dt){BRAWL_T-=dt;if(BRAWL_T>0||SCENE)return;BRAWL_T=rnd(50,110);const c=cityAtPx(P.x,P.y);if(!c||P.age<13)return;
  const owners=[...new Set(DISTRICTS.filter(d=>d.city===c.id&&d.owner&&FACTIONS[d.owner].league==='street').map(d=>d.owner))];
  const pool=owners.length>=2?owners:owners.concat(Object.keys(FACTIONS).filter(k=>FACTIONS[k].type==='cartel'));if(pool.length<2)return;
  const a=pick(pool),b=pick(pool.filter(x=>x!==a));const t=randomTileNear(P.x,P.y,9,16,t=>WALKABLE[t]);if(!t)return;const X=t[0]*TS+16,Y=t[1]*TS+16;
  for(let k=0;k<3;k++){spawnPed('gang',X-30+rnd(-16,16),Y+rnd(-20,20),a,{enemyFac:b,keep:true,brawlT:45});spawnPed('gang',X+30+rnd(-16,16),Y+rnd(-20,20),b,{enemyFac:a,keep:true,brawlT:45})}
  log(`${FACTIONS[a].short} ir ${FACTIONS[b].short} muštynės netoliese! <i>A street brawl nearby.</i>${P.faction===a||P.faction===b?' Help your crew!':''}`,'amb')}
function brawlUpdate(e,dt){e.brawlT-=dt;if(e.brawlT<=0){e.enemyFac=null;e.keep=false;e.state='flee';e.t=4;return false}
  let tgt=null,bd=9*TS;for(const o of ENT.peds){if(o.fac!==e.enemyFac||o.ko>0)continue;const d=dist(o.x,o.y,e.x,e.y);if(d<bd){bd=d;tgt=o}}if(!tgt)return false;
  const a=Math.atan2(tgt.y-e.y,tgt.x-e.x);if(bd>22){e.anim+=dt*10;e.dir=Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?0:2):(Math.sin(a)>0?1:3);moveCircle(e,Math.cos(a)*100*dt,Math.sin(a)*100*dt,7,SOLID_FOOT)}
  else if(e.cd<=0){e.cd=rnd(.8,1.3);e.punch=.2;tgt.hp-=ri(6,12);fxBurst(tgt.x,tgt.y-20,'#fff');if(tgt.hp<=0){tgt.ko=rnd(20,30);tgt.state='ko'}}
  if(e.punch>0)e.punch-=dt;e.cd-=dt;return true}

/* ---------- night car meets ---------- */
function meetTick(){const h=G.time.min/60,night=h>=22||h<3;POIS.forEach(p=>{if(!p.meet)return;const near=dist(p.x,p.y,P.x,P.y)<22*TS;
  if(night&&near&&!p.meetOn){p.meetOn=true;const f=FACTIONS[p.meet];for(let k=0;k<6;k++){const t=randomTileNear(p.x,p.y,1,6,t=>t===T.LOT);if(!t)continue;const m=pick(['e36','e46','audi80','golf','e39','m5','w124']);
      ENT.cars.push({type:'car',ai:'parked',model:m,color:Math.random()<.5?f.color:pick(PAINTS),neon:true,x:t[0]*TS+16,y:t[1]*TS+16,ang:pick([0,Math.PI/2,Math.PI,-Math.PI/2]),vx:0,vy:0,hp:100,meetCar:p.id})}
    for(let k=0;k<6;k++){const t=randomTileNear(p.x,p.y,1,6,t=>t===T.LOT);if(t){const e=spawnPed('civ',t[0]*TS+16,t[1]*TS+16,null,{meetPed:p.id,lines:[line('Kokia čia mašina, E46?','What is that, an E46?')]});e.lk.vest=f.color;e.idle=true}}
    if(!P.faction||FACTIONS[P.faction].league!=='auto')log(`Naktinis susitikimas: ${f.name} are meeting at ${p.name}.`,'amb')}
  if((!night||!near)&&p.meetOn){p.meetOn=false;ENT.cars=ENT.cars.filter(c=>c.meetCar!==p.id||c===P.inCar);ENT.peds=ENT.peds.filter(e=>e.meetPed!==p.id)}})}
