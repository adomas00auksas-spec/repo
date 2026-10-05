
/* =====================================================================
   TRAVEL — not an open world any more: each town is its own map and you
   travel between them by bus, train, BlaBla, taxi or your own car (fast,
   or drive the highway yourself). Events can happen on the way.
   ===================================================================== */
const PLACE=id=>cityById(id)||LOCATIONS[id];
const placeLL=id=>{const c=cityById(id);return c?[c.lat,c.lon]:[LOCATIONS[id].lat,LOCATIONS[id].lon]};
function kmBetween(a,b){const[la1,lo1]=placeLL(a),[la2,lo2]=placeLL(b);const dx=(lo2-lo1)*111.32*Math.cos((la1+la2)/2*Math.PI/180),dy=(la2-la1)*110.57;return Math.round(Math.hypot(dx,dy)*1.25)}
const ALL_PLACES=()=>[...CITIES.map(c=>c.id),...Object.keys(LOCATIONS)];
function canReach(mode,id,from){if(id===from)return false;const L=LOCATIONS[id];
  if(mode==='train')return TRAIN_CITIES.includes(id)&&TRAIN_CITIES.includes(from);
  if(mode==='bus')return !L||L.bus;
  if(mode==='ferry')return true;
  return true}
function travelCost(mode,km){return mode==='bus'?Math.round(2+km*.07):mode==='train'?Math.round(1.5+km*.05):mode==='blabla'?Math.round(1+km*.04):mode==='taxi'?Math.round(5+km*.6):mode==='car'?Math.round(km*.09):0}
function travelHours(mode,km){return Math.round((km/(mode==='train'?85:mode==='car'||mode==='taxi'?80:mode==='blabla'?75:60)+.3)*2)/2}
const MODE_NAME={bus:'Autobusas',train:'Traukinys',blabla:'BlaBla pavėžėjimas',taxi:'Taksi',car:'Savo automobilis',ferry:'Keltas'};

function openTravel(mode,poi){const from=MAP.kind==='road'?MAP.to:MAP.id;
  if(mode==='car'&&(!P.inCar||P.inCar.owned===undefined&&CARS[P.inCar.model].kind!=='bike'&&!P.stolenOK)){if(!P.inCar){log('Get in a car first (F).','bad');return}}
  if(mode==='car'&&CARS[P.inCar.model].kind==='bike'){log('Not on a bike. Take a bus or a train.','bad');return}
  const kidLimit=P.age<13&&(mode==='blabla'||mode==='taxi');if(kidLimit){log('Kids travel by bus or train with a ticket. No hitchhiking!','bad');return}
  let h=mHead(mode==='train'?'🚆':mode==='car'?'🚗':mode==='ferry'?'⛴':'🚌',MODE_NAME[mode],`Iš ${PLACE(from).name}`)+'<div class="mbody">';
  if(mode==='ferry'){const to=poi.to;const km=to==='nida'?50:50;h+=act(`Smiltynė → ${PLACE(to).name}`,`The ferry over the strait, then the KK167 road along the Curonian Spit. ${P.inCar?'With your car: €8.':'On foot plus the spit bus: €6.'}`,P.inCar?'€8':'€6',()=>{if(!pay(P.inCar?8:6))return;closeModal();if(P.inCar&&P.inCar.owned!==undefined)roadTrip(to,{via:'ferry'});else travelTo(to,'ferry')});
    return openModal(h+'</div>')}
  ALL_PLACES().filter(id=>canReach(mode,id,from)).sort((a,b)=>kmBetween(from,a)-kmBetween(from,b)).forEach(id=>{const pl=PLACE(id),km=kmBetween(from,id),cost=travelCost(mode,km)*(P.age<13&&mode!=='car'?.5:1),hrs=travelHours(mode,km);
    const L=LOCATIONS[id];if(mode!=='car'&&L&&L.car&&mode!=='blabla'&&mode!=='taxi')return;
    const sub=`${km} km · ${hrs} h · ${pl.blurb}`;
    if(mode==='car')h+=act(`→ ${pl.name}`,sub+` Fuel ${eur(cost)}.`,'Važiuoti',()=>{closeModal();carTripMenu(id,km,cost,hrs)});
    else h+=act(`→ ${pl.name}`,sub,eur(cost),()=>{if(!pay(cost))return;closeModal();travelTo(id,mode,{km,hrs})})});
  openModal(h+'</div>')}
function carTripMenu(id,km,cost,hrs){openModal(mHead('🚗',`→ ${PLACE(id).name}`,`${km} km · ${roadName(MAP.id,id)}`)+`<div class="mbody">
  ${act('Važiuoti pačiam','Drive the highway yourself: petrol station, traffic, police and potholes on the way.','Vairuoti',()=>{if(!pay(cost))return;closeModal();roadTrip(id,{})})}
  ${act('Greitai nuvažiuoti','Skip the drive. Time passes, something may happen on the way.',`${hrs} h`,()=>{if(!pay(cost))return;closeModal();travelTo(id,'car',{km,hrs})})}</div>`)}

/* ---------- arriving ---------- */
function arrivalSpot(mode){const want=mode==='train'?'train':mode==='bus'||mode==='blabla'||mode==='taxi'?'bus':mode==='ferry'?'ferry':null;
  let p=want&&POIS.find(q=>q.kind===want)||POIS.find(q=>q.kind==='bus')||null;
  if(mode==='car'&&EXITS.length){const e=pick(EXITS);const t=nearestTile(tx(e.x),tx(e.y),t=>DRIVE[t]);if(t)return{x:t[0]*TS+16,y:t[1]*TS+16}}
  if(p){const t=nearestTile(tx(p.x),tx(p.y)+1,t=>WALKABLE[t]);if(t)return{x:t[0]*TS+16,y:t[1]*TS+16}}
  const t=nearestTile(W>>1,H>>1,t=>WALKABLE[t]||t===T.GRASS,200);return{x:t[0]*TS+16,y:t[1]*TS+16}}
function travelTo(dest,mode,o){o=o||{};const from=MAP.kind==='road'?MAP.to:MAP.id;const km=o.km||kmBetween(from,dest),hrs=o.hrs||travelHours(mode,km);
  if(SCENE)leaveScene(true);if(G.mission&&!G.mission.travels){missionFail('You left town.')}
  const carIdx=P.inCar&&P.inCar.owned!==undefined&&(mode==='car'||mode==='ferry')?P.inCar.owned:null;if(P.inCar)exitCar(true);
  if(carIdx===null&&P.cars){P.cars.forEach((oc,i)=>{const e=ownedCarEntity(i);if(e&&!oc.map)oc.map=MAP.id;if(e){oc.map=MAP.id;oc.pos={x:e.x,y:e.y,ang:e.ang}}})}
  if(!o.noTime)skipHours(hrs);fadeScreen();
  loadMap(dest);arriveIn(dest,mode,carIdx);
  if(!o.noEvent&&Math.random()<.42)setTimeout(()=>travelEvent(mode),400)}
function arriveIn(dest,mode,carIdx){const sp=arrivalSpot(mode);P.x=sp.x;P.y=sp.y;cam.x=P.x-VW/2/ZOOM;cam.y=P.y-VH/2/ZOOM;
  if(carIdx!==null&&carIdx!==undefined){const oc=P.cars[carIdx];oc.map=dest;oc.pos=null;const t=nearestTile(tx(P.x),tx(P.y),t=>DRIVE[t]);const c=spawnOwnedCar(carIdx,t?t[0]*TS+16:P.x,t?t[1]*TS+16:P.y,0);enterCar(c)}
  spawnStartVehicles();if(P.city===dest)ensureHome();
  crewList().forEach(e=>{e.x=P.x+rnd(-20,20);e.y=P.y+rnd(10,24)});ENT.peds.forEach(e=>{if(e.kind==='dog'){e.x=P.x+14;e.y=P.y+8}});
  const pl=PLACE(dest);if(!P.visited[dest]){P.visited[dest]=true;chron(`Arrived in ${pl.name} for the first time.`)}
  toast(pl.code||'LT',pl.name,pl.blurb);LASTCITY=dest;hudUpdate();updateZone();saveGame(true);
  if(dest==='pasienis'&&G.mission&&G.mission.type==='balloon')placeBalloon()}
function respawnAt(kind){if(SCENE)leaveScene(true,true);let p=POIS.find(q=>q.kind===kind);
  if(!p){exitCar(true);loadMap(P.city);ensureHome();p=POIS.find(q=>q.kind===kind)||POIS.find(q=>q.kind==='bus')}
  if(p){P.x=p.x;P.y=p.y+20}return p}

/* ---------- road trips (highway map) ---------- */
function roadTrip(dest,o){o=o||{};const from=MAP.kind==='road'?MAP.to:MAP.id;if(SCENE)leaveScene(true);
  if(G.mission&&!G.mission.travels&&!o.race)missionFail('You left town.');
  const ci=P.inCar&&P.inCar.owned!==undefined?P.inCar.owned:null;const model=P.inCar?{model:P.inCar.model,color:P.inCar.color}:null;if(P.inCar)exitCar(true);
  fadeScreen();loadMap(null,{road:true,from,to:dest});const y=MAP.cy(10);P.x=10*TS;P.y=y*TS;
  let c;if(ci!==null){P.cars[ci].map='road';c=spawnOwnedCar(ci,10*TS,(y+1)*TS,0)}else{c={type:'car',ai:'parked',model:model?model.model:'golf',color:model?model.color:'#2F5E8E',x:10*TS,y:(y+1)*TS,ang:0,vx:0,vy:0,hp:100};ENT.cars.push(c)}
  enterCar(c);cam.x=P.x-VW/2/ZOOM;cam.y=P.y-VH/2/ZOOM;crewList().forEach(e=>{e.ride=true});
  toast('🛣',MAP.name,'Drive east to arrive. E at the petrol station for hot dogs.');updateZone();
  if(o.race){const M=o.race;const cps=[];for(let x=90;x<W-10;x+=90)cps.push({x:x*TS,y:(MAP.cy(x)+.5)*TS});cps.push({x:(W-8)*TS,y:(MAP.cy(W-8)+.5)*TS});startRace(M,o.r||0,cps);
    if(G.mission===M){M.title=`${cityName(from)} → ${cityName(dest)} (${roadName(from,dest)})`;M.pay=300+(o.r||0)*80;M.rep=40;M.travels=true}}}
function roadTick(){if(MAP.kind!=='road'||SCENE)return;const me=P.inCar||P;if(me.x>(W-6)*TS){const dest=MAP.to;const ci=P.inCar&&P.inCar.owned!==undefined?P.inCar.owned:null;
    if(G.mission&&G.mission.type==='race'&&G.mission.hwy){/* race ends on the last checkpoint */}
    if(P.inCar)exitCar(true);loadMap(dest);arriveIn(dest,'car',ci)}
  if(me.x<2*TS){if(P.inCar){P.inCar.vx=Math.abs(P.inCar.vx)*.3;P.inCar.x=3*TS}else P.x=3*TS}}
function startRoadRace(r){if(!P.inCar||CARS[P.inCar.model].kind==='bike'){log('You need a car for a race. Get in one (F).','bad');return}
  const from=MAP.id;const opts=CITIES.map(c=>c.id).filter(id=>id!==from&&roadName(from,id)!=='Kelias');if(!opts.length){log('No highway race from here.','bad');return}
  const dest=pick(opts);const M={type:'race',hwy:true,fac:P.faction,city:from,t0:now(),travels:true};roadTrip(dest,{race:M,r})}

/* ---------- events on the way ---------- */
const LORE=[['Lietuva pirmoji paskelbė nepriklausomybę nuo SSRS – 1990 m. kovo 11 d.','Lithuania was the first to declare independence from the USSR, on 11 March 1990.'],
 ['1989 m. Baltijos kelias: du milijonai žmonių susikibo rankomis nuo Vilniaus iki Talino.','The Baltic Way, 1989: two million people held hands from Vilnius to Tallinn.'],
 ['Lietuvių kalba – viena seniausių gyvų indoeuropiečių kalbų.','Lithuanian is one of the oldest living Indo-European languages.'],
 ['Geografinis Europos centras – vos už 26 km nuo Vilniaus.','The geographic centre of Europe is just 26 km from Vilnius.'],
 ['Lietuvoje yra daugiau nei 2800 ežerų.','Lithuania has more than 2,800 lakes.'],
 ['Kuršių nerijos kopos – vienos aukščiausių judančių kopų Europoje.','The Curonian Spit dunes are among the highest drifting dunes in Europe.'],
 ['Cepelinai pavadinti dėl panašumo į dirižablius.','Cepelinai are named after zeppelin airships.'],
 ['Lietuvos krepšinio rinktinė iškovojo olimpinę bronzą 1992, 1996 ir 2000 m.','The national basketball team won Olympic bronze in 1992, 1996 and 2000.'],
 ['Darius ir Girėnas 1933 m. perskrido Atlantą lėktuvu „Lituanica“.','Darius and Girėnas flew the Atlantic in the Lituanica in 1933.'],
 ['Vilniaus senamiestis – vienas didžiausių Rytų ir Vidurio Europoje.','Vilnius Old Town is one of the largest in Central and Eastern Europe.']];
function choice(gl,title,text,opts){let h=mHead(gl,esc(title),'')+`<div class="mbody scene"><p>${text}</p></div><div class="mfoot">`;
  opts.forEach((o,i)=>{const id='c'+Math.random().toString(36).slice(2,8);ACTS[id]=()=>{closeModal();o.fn&&o.fn()};h+=`<button class="btn ${i?'ghost':'amber'}" onclick="runAct('${id}')">${o.l}</button>`});openModal(h+'</div>')}
function travelEvent(mode){const car=mode==='car';const pool=[];
  if(car){pool.push(()=>choice('🚓','Kelių policijos patikra','Mėlyni švyturėliai. „Laba diena, dokumentus prašau.“ <i>A roadside check.</i>',[
      {l:'Parodyti dokumentus',fn:()=>{const bad=P.heat>0||!P.license;if(bad){const f=P.license?60:120;P.money=Math.max(0,P.money-f);log(`Fine: ${eur(f)}. ${P.license?'They recognised you from the news.':'No driving licence!'}`,'bad');P.heat=0}else log('„Laimingo kelio.“ All good.','good')}},
      {l:'Bandyti išsisukti',fn:()=>{if(Math.random()<.45)log('You talked your way out. Lucky.','good');else{P.money=Math.max(0,P.money-150);crime(1,'Lied to the traffic police');log('Fine €150 and a lecture.','bad')}}}]));
    pool.push(()=>choice('🦌','Stirna ant kelio','A deer jumps out of the forest!',[{l:'Stabdyti',fn:()=>log('You stopped in time. The deer looks offended.','good')},{l:'Apvažiuoti',fn:()=>{if(Math.random()<.35){P.cars.forEach(c=>c.hp=Math.max(30,(c.hp||100)-20));log('You hit the ditch. Car damaged.','bad')}else log('Smooth swerve!','good')}}]));
    pool.push(()=>choice('🔧','Sugedo mašina','Steam from under the bonnet. Again.',[{l:'Techninė pagalba €40',fn:()=>{pay(40);skipHours(1)}},{l:'Taisyti pačiam',fn:()=>{if(P.parent==='mech'||P.job==='mechanic'){log('Dad taught you this. Fixed in ten minutes.','good')}else{skipHours(3);log('Three hours and a lot of swearing later, it starts.','amb')}}}]));
    pool.push(()=>{skipHours(1);log('Kamštis prie įvažiavimo. A traffic jam cost you an hour.','amb')});
  }else{
    pool.push(()=>{const f=pick(LORE);choice('💬','Plepus bendrakeleivis',`A passenger next to you will not stop talking: „${f[0]}“<br><i>${f[1]}</i>`,[{l:'Įdomu!',fn:()=>setMood(4)}])});
    pool.push(()=>choice('👜','Kišenvagis?','You feel sleepy. Someone keeps looking at your bag.',[{l:'Laikyti kuprinę',fn:()=>log('You stayed awake. Nothing happened.','good')},{l:'Pasnausti',fn:()=>{if(Math.random()<.5){const n=Math.min(50,Math.round(P.money*.1));P.money-=n;log(`Woke up ${eur(n)} lighter.`,'bad')}else{P.energy=Math.min(100,P.energy+20);log('A good nap.','good')}}}]));
    pool.push(()=>{log(pick(['The radio plays Lithuanian pop the whole way. „Mėnulio takas“ three times.','A grandmother shares her kibinai with you.','The driver stops for 20 minutes at a petrol station for a hot dog.']),'amb');setMood(3)});
    if(mode==='blabla')pool.push(()=>choice('🚙','BlaBla vairuotojas',pick(['The driver thinks he is in Formula 1. 160 km/h in the rain.','The driver is a philosopher and explains the meaning of life for two hours.','The driver is a grandmother who drives 70 and feeds you pancakes.']),[{l:'Nu gerai…',fn:()=>setMood(pick([-4,6]))}]));
    if(mode==='train')pool.push(()=>choice('🎫','Kontrolė','„Bilietėlius, prašau.“ You show your ticket. The controller nods.',[{l:'Gerai',fn:()=>{}}]));
  }
  pick(pool)()}

/* ---------- owned cars on maps, home ---------- */
function ensureHome(){if(MAP.id!==P.city)return;if(POIS.some(q=>q.id===P.home))return;let b=P.homeB!=null&&BUILDINGS[P.homeB];if(!b||b.poi||b.landmark||!doorOK(b))b=chooseHome(P.city,P.cls);
  const hp=addPOI(cityById(P.city),'home','Namai',b,{});hp.id=P.home||('home_'+P.city);P.home=hp.id;P.homeB=b.id}
function chooseHome(cityId,cls){const types={low:['soviet'],mid:['soviet','center'],upper:['center','modern','old'],rich:['private','resort']}[cls];
  return freeBuildingT(types,null,2)||freeBuildingT(null,null,2)||kiosk()||BUILDINGS.find(b=>!b.landmark)}

/* ---------- Lithuania overview map ---------- */
function drawLithuania(cv2,curId){const g=cv2.getContext('2d'),w=cv2.width,h=cv2.height;const lo0=20.9,lo1=26.9,la0=56.5,la1=53.85;
  const P2=(lat,lon)=>[(lon-lo0)/(lo1-lo0)*w,(la0-lat)/(la0-la1)*h];g.fillStyle='#5B6669';g.fillRect(0,0,w,h);
  g.fillStyle='#3D6D8D';g.beginPath();[[56.6,20.8],[56.6,21.07],[56.07,21.05],[55.7,21.1],[55.28,21.0],[54.9,20.95],[54.9,20.8]].forEach(([la,lo],i)=>{const[x,y]=P2(la,lo);i?g.lineTo(x,y):g.moveTo(x,y)});g.fill();
  g.fillStyle='rgba(255,255,255,.35)';g.font='700 13px "IBM Plex Sans",sans-serif';[['LATVIJA',56.45,24.5],['BALTARUSIJA',54.3,26.4],['LENKIJA',54.0,22.9],['RUSIJA',54.7,21.6],['BALTIJOS JŪRA',55.6,20.95]].forEach(([t,la,lo])=>{const[x,y]=P2(la,lo);g.fillText(t,x,y)});
  g.fillStyle='#86A85F';g.strokeStyle='#F7F8F4';g.lineWidth=2;g.beginPath();LT_OUTLINE.forEach(([lo,la],i)=>{const[x,y]=P2(la,lo);i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath();g.fill();g.stroke();
  g.strokeStyle='rgba(226,161,27,.8)';g.lineWidth=2;Object.keys(ROAD_NAMES).forEach(k=>{const[a,b]=k.split('-');if(!PLACE(a)||!PLACE(b))return;const[x1,y1]=P2(...placeLL(a)),[x2,y2]=P2(...placeLL(b));g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()});
  g.font='800 15px "Big Shoulders Display",sans-serif';g.textAlign='center';
  ALL_PLACES().forEach(id=>{const[x,y]=P2(...placeLL(id));const isC=!!cityById(id),cur=id===curId;g.fillStyle=cur?'#E2A11B':isC?'#1D2724':'#6B4FA0';g.beginPath();g.arc(x,y,cur?8:isC?6:4.5,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    g.fillStyle='rgba(20,28,26,.8)';const nm=PLACE(id).name;const tw=g.measureText(nm).width+8;g.fillRect(x-tw/2,y-26,tw,17);g.fillStyle=P.visited&&P.visited[id]?'#fff':'#C4CFCA';g.fillText(nm,x,y-13)});g.textAlign='left'}

/* ---------- balloon drops in the border forest ---------- */
function placeBalloon(){const M=G.mission;if(!M)return;let t=null;for(let k=0;k<600&&!t;k++){const x=ri(10,W-10),y=ri(10,H-10);if(tileAt(x,y)===T.FOREST&&(tileAt(x+8,y)===T.ABROAD||tileAt(x+16,y)===T.ABROAD))t=[x,y]}
  if(!t)t=nearestTile(W-60,H>>1,tt=>tt===T.FOREST)||[W>>1,H>>1];M.target={x:t[0]*TS+16,y:t[1]*TS+16,label:'Balionas',map:'pasienis'};
  ENT.pickups.push({k:'kontra',n:3,x:M.target.x,y:M.target.y,keep:true,balloon:true});const hq=POIS.find(p=>p.hq==='pasienio');if(hq)M.dest={x:hq.x,y:hq.y,label:hq.name,map:'pasienis'};M.step='Find the balloon near the border fence'}

/* ---------- trolleybus and bus stops inside town ---------- */
function rideStop(p){const veh=p.troll?'Troleibusas':'Autobusas';const others=POIS.filter(q=>q.kind==='stop'&&q!==p).sort((a,b)=>dist(a.x,a.y,p.x,p.y)-dist(b.x,b.y,p.x,p.y)).slice(0,10);
  let h=mHead(p.troll?'T':'A',esc(p.name),`${veh} · bilietas €1 (vaikams €0,50)`)+'<div class="mbody">';
  if(!others.length)h+='<p class="note">No other stops on this map.</p>';
  others.forEach(q=>{const km=(dist(q.x,q.y,p.x,p.y)/TS*MPT/1000).toFixed(1);h+=`<div class="act"><div class="at"><b>→ ${esc(q.name.replace('Stotelė ',''))}</b><div>${km} km</div></div><div style="display:flex;gap:6px"><button class="btn sm green" onclick="rideTo('${q.id}',1)">Bilietas</button><button class="btn sm ghost" onclick="rideTo('${q.id}',0)">Zuikiu</button></div></div>`});
  openModal(h+'</div>')}
function rideTo(id,paid){const q=POIS.find(x=>x.id===id);if(!q)return;const fare=P.age<13?.5:1;if(paid&&!pay(fare))return;closeModal();
  const go=()=>{fadeScreen();P.x=q.x;P.y=q.y+18;skipHours(dist(q.x,q.y,P.x,P.y)/TS/2000+.25);crewList().forEach(e=>{e.x=P.x+rnd(-20,20);e.y=P.y+16});ENT.peds.forEach(e=>{if(e.kind==='dog'){e.x=P.x+12;e.y=P.y+8}});cam.x=P.x-VW/2/ZOOM;cam.y=P.y-VH/2/ZOOM;log('Stotelė. You get off.','good')};
  if(!paid&&Math.random()<.3){choice('🎫','Kontrolieriai!','Two people in plain clothes flash their badges: „Bilietėlius, prašau.“ <i>Ticket inspectors. You are a zuikis (fare dodger).</i>',[
    {l:'Mokėti baudą €20',fn:()=>{P.money=Math.max(0,P.money-20);go()}},
    {l:'Bėgti!',fn:()=>{if(P.energy>25&&Math.random()<.65){P.energy-=15;log('You jumped out at the next stop and ran. Zuikis escaped!','good');go()}else{P.money=Math.max(0,P.money-35);log('Caught. €35 fine and a lecture.','bad');go()}}},
    {l:'„Aš turistas…“',fn:()=>{if(Math.random()<.3){log('„Ok… next time buy a ticket.“ It worked.','good')}else{P.money=Math.max(0,P.money-20);log('„Nice try.“ €20 fine.','bad')}go()}}]);return}
  go()}
const POI_HANDLERS={stop:rideStop};
