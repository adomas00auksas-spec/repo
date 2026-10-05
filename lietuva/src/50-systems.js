
/* =====================================================================
   SYSTEMS: time, economy, factions, missions, quests
   ===================================================================== */
const isNight=()=>G.time.min<6*60||G.time.min>=21*60;
function nightLevel(){const h=G.time.min/60;if(h>=7&&h<19)return 0;if(h>=19&&h<22)return (h-19)/3*.62;if(h>=22||h<5)return .62;return (7-h)/2*.62}
function give(id,n){P.inv[id]=(P.inv[id]||0)+n;if(P.inv[id]<=0)delete P.inv[id];renderHotbar()}
function has(id){return P.inv[id]||0}
function setMood(n){P.mood=clamp(P.mood+n,0,100)}
function price(p,kind){let f=1;if(P.parent==='market'&&kind==='food')f=.7;if(P.parent==='mech'&&kind==='car')f=.6;if(P.job==='mechanic'&&kind==='car')f*=.85;return Math.round(p*f*100)/100}
function pay(n){if(P.money<n){log(`Not enough money (need ${eur(n)}).`,'bad');SND.blip(200);return false}P.money-=n;SND.coin();return true}
function gainRep(fid,n){if(!fid)return;const before=rankIdx(fid);P.rep[fid]=(P.rep[fid]||0)+n;const after=rankIdx(fid);
  if(after>before){const f=FACTIONS[fid];toast(f.short.slice(0,3).toUpperCase(),'Naujas rangas: '+rankName(fid),`${f.name} now call you ${rankName(fid)}.`);SND.fanfare();chron(`Became ${rankName(fid)} in ${f.name}.`);if(after===RANKS[rankTable(f)].length-1)topRankScene(fid)}}
function chron(t){G.hist.push(`${dateStr()}: ${t}`);if(G.hist.length>80)G.hist.shift()}
function dateStr(){const d=doyToDate(G.time.doy);return `${d.m+1}/${d.d} (${P.age} m.)`}
function doyToDate(doy){let m=0,d=doy%365;while(d>=MDAYS[m]){d-=MDAYS[m];m++}return{m,d:d+1}}
function log(html,cls){const el=document.createElement('div');el.className=cls||'';el.innerHTML=html;const L=$('#log');L.appendChild(el);while(L.children.length>5)L.firstChild.remove();
  setTimeout(()=>{el.style.opacity=0;setTimeout(()=>el.remove(),1000)},6500)}
let toastQ=[],toastOn=false;
function toast(k,t,s){toastQ.push([k,t,s]);if(!toastOn)nextToast()}
function nextToast(){const n=toastQ.shift();if(!n){toastOn=false;return}toastOn=true;$('#toastK').textContent=n[0];$('#toastT').textContent=n[1];$('#toastS').textContent=n[2]||'';
  $('#toast').classList.add('show');setTimeout(()=>{$('#toast').classList.remove('show');setTimeout(nextToast,500)},3600)}

function tickTime(dt){G.time.min+=dt*2;if(G.time.min>=1440){G.time.min-=1440;newDay()}
  P.food=Math.max(0,P.food-dt*.055);P.energy=Math.max(0,P.energy-dt*.035);if(P.food<8)P.hp-=dt*.3;
  if(P.hp<P.maxHp&&P.food>40)P.hp=Math.min(P.maxHp,P.hp+dt*.4);
  if(P.hp<=0)wipeOut()}
function newDay(){G.time.day++;G.time.doy=(G.time.doy+1)%365;G.time.dow=(G.time.dow+1)%7;
  seasonCheck();holidayCheck();armyCheck();familyEvent();if(G.flags.hangover===G.time.day){P.energy=Math.max(0,P.energy-30);setMood(-10);log('Pagirios. Your head is splitting. Never again (you say every time).','bad')}G.weather=Math.random()<.22?(WINTER?'Sniegas':'Lietus'):Math.random()<.4?'Debesuota':'Giedra';
  const b=doyToDate(G.time.doy);if(b.m===P.bm&&b.d===P.bd){P.age++;toast('🎂',`Gimtadienis! ${P.age} m.`,'Happy birthday. Su gimtadieniu!');chron(`Turned ${P.age}.`)}
  // allowance
  const cls=CLASSES.find(c=>c.id===P.cls);if(P.age<24){let a=cls.allow[P.age<10?0:P.age<16?1:2];if(P.parent==='office')a*=1.2;if(G.skipped>=3){a=Math.round(a*.3);log('Tamo told your parents you keep skipping school. Allowance cut.','bad')}P.money+=a;log(`Parents gave you pocket money: ${eur(a)}`,'good')}
  if(P.parent==='gangster'&&P.age>=13){P.money+=8;}
  G.skipped=G.time.dow>=1&&G.time.dow<=5&&!G.attended&&P.age<18?(G.skipped||0)+1:Math.max(0,(G.skipped||0)-(G.attended?1:0));G.attended=false;
  // territory income
  const mf=myFac();if(mf&&mf.league==='street'){const own=DISTRICTS.filter(d=>d.owner===P.faction).length;if(own){const inc=own*(10+rankIdx(P.faction)*6);P.money+=inc;log(`Territory income from ${own} district${own>1?'s':''}: ${eur(inc)}`,'good')}}
  if(G.biz&&G.biz.length){const inc=G.biz.reduce((a,id)=>{const p=POIS.find(q=>q.id===id);return a+(p&&BIZ[p.kind]?BIZ[p.kind].income:0)},0);if(inc){P.money+=inc;log(`Business income: ${eur(inc)}`,'good')}}
  // district attacks resolve / roll
  (G.events||[]).forEach(ev=>{if(ev.done)return;const d=DISTRICTS[ev.d];if(d.owner===P.faction){d.owner=ev.by;log(`You lost ${d.name} to ${FACTIONS[ev.by].name}.`,'bad');chron(`Lost ${d.name}.`);refreshOverlay()}});
  G.events=[];
  if(mf&&mf.league==='street'){DISTRICTS.filter(d=>d.owner===P.faction).forEach(d=>{if(Math.random()<.13){const rivals=Object.keys(FACTIONS).filter(k=>FACTIONS[k].league==='street'&&k!==P.faction&&(FACTIONS[k].city===d.city||FACTIONS[k].type==='cartel'));
      if(rivals.length){const by=pick(rivals);G.events.push({d:d.id,by,spawned:false});toast('!!',`${FACTIONS[by].short} puola ${d.name}!`,`Defend it before midnight or lose it.`);SND.alarm()}}})}
  // AI factions shuffle a little
  if(Math.random()<.35){const d=pick(DISTRICTS.filter(d=>d.owner&&d.owner!==P.faction));const rivals=Object.keys(FACTIONS).filter(k=>FACTIONS[k].league==='street'&&(FACTIONS[k].city===d.city||FACTIONS[k].type==='cartel')&&k!==d.owner&&k!==P.faction);
    if(d&&rivals.length){const by=pick(rivals);G.news.unshift(`${dateStr()}: ${FACTIONS[by].name} took ${d.name} (${cityById(d.city).name}) from ${FACTIONS[d.owner].short}.`);d.owner=by;refreshOverlay()}}
  if(G.news.length>20)G.news.length=20;
  saveGame(true)}
function wipeOut(){if(P.dead)return;P.dead=true;leaveScene(true,true);exitCar(true);const h=respawnAt('hospital');
  const fee=P.age<18?0:Math.min(P.money,Math.round(P.money*.1+20));P.money-=fee;P.hp=P.maxHp*.6;P.heat=0;G.time.min+=180;setMood(-15);
  ENT.peds.forEach(e=>{e.angry=false;e.attacker=false});
  openModal(mHead('+','Ligoninė',`You woke up in hospital in ${esc(MAP.name)}.`)+`<div class="mbody scene"><p>Everything hurts. A nurse tells you someone called an ambulance.</p><p>${fee?`The bill: <b>${eur(fee)}</b>.`:'Kids are treated for free.'}</p></div><div class="mfoot"><button class="btn" onclick="closeModal()">Gerai</button></div>`);
  setTimeout(()=>P.dead=false,500);missionFail('You were knocked out.')}
function busted(){BUST.t=0;leaveScene(true,true);exitCar(true);const st=respawnAt('police')||{name:'policijos komisariatas'};P.busts=(P.busts||0)+1;
  const fine=Math.round(P.money*.15)+P.heat*25,lost=has('kontra');P.money=Math.max(0,P.money-fine);if(lost)give('kontra',-lost);
  P.heat=0;G.time.min+=240;setMood(-12);
  ENT.cars=ENT.cars.filter(c=>c.ai!=='police');ENT.peds.forEach(e=>{if(e.kind==='police')e.angry=false});
  const mf=myFac();if(mf&&mf.league==='street')gainRep(P.faction,5);setTimeout(prisonCheck,1500);
  openModal(mHead('★','Areštinė','Busted. Sulaikytas.')+`<div class="mbody scene"><p>A few hours in a cell at the ${esc(st.name)}. An officer reads you a lecture about wasting your life.</p><p>Fine: <b>${eur(fine)}</b>.${lost?` Contraband confiscated: <b>${lost}</b> boxes.`:''}${mf&&mf.league==='street'?' You kept your mouth shut. Your crew respects that.':''}</p></div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`);
  missionFail('Busted by the police.')}

/* ---------- vehicles: enter / exit ---------- */
function nearestCar(r){let best=null,bd=r;for(const c of ENT.cars){if(c.ai==='police'||c.ai==='race')continue;const d=dist(c.x,c.y,P.x,P.y);if(d<bd){bd=d;best=c}}return best}
function enterCar(c){const m=CARS[c.model];
  if(m.kind!=='bike'&&P.age<16){log('Per jaunas vairuoti. You are too young to drive a car. Take the bus or a bike.','bad');return}
  if(m.bus)return;
  if(c.owned===undefined&&!c.exam){
    if(c.ai==='traffic'||c.ai==='hwy'){const drv=spawnPed('civ',c.x+24,c.y,null);drv.state='flee';drv.t=5;bubble(drv,'Vagis!');crime(1,'Carjacking')}
    else if(Math.random()<.5)crime(1,'Car theft');
    log(`Stole a ${m.name}. It is not yours, police may notice.`,'amb')}
  c.ai=null;c.vx=c.vx||0;c.vy=c.vy||0;P.inCar=c;SND.door();$('#speedo').classList.remove('hidden');$('#hud').classList.add('driving');$('#spN').textContent=m.name}
function exitCar(force){const c=P.inCar;if(!c)return;if(!force&&Math.hypot(c.vx,c.vy)>60){log('Slow down first.','');return}
  c.ai='parked';c.vx*=.2;c.vy*=.2;P.inCar=null;const a=c.ang+Math.PI/2;let ok=false;
  for(const s of[1,-1,2,-2]){const nx=c.x+Math.cos(a)*22*s,ny=c.y+Math.sin(a)*22*s;if(!blocked(nx,ny,8,SOLID_FOOT)){P.x=nx;P.y=ny;ok=true;break}}
  if(!ok){P.x=c.x;P.y=c.y}
  if(c.owned!==undefined){P.cars[c.owned].pos={x:c.x,y:c.y,ang:c.ang}}
  bankDrift();SND.door();$('#speedo').classList.add('hidden');$('#hud').classList.remove('driving');ENGINE.target=0}
function ownedCarEntity(i){return ENT.cars.find(c=>c.owned===i)}
function spawnOwnedCar(i,x,y,ang){const oc=P.cars[i];let c=ownedCarEntity(i);if(c){c.x=x;c.y=y;c.ang=ang||0;c.vx=c.vy=0;return c}
  c={type:'car',ai:'parked',owned:i,model:oc.model,color:oc.color,tune:oc.tune,neon:!!(oc.tune&&oc.tune.neon),x,y,ang:ang||0,vx:0,vy:0,hp:oc.hp||100};ENT.cars.push(c);return c}
function freeSpotNear(x,y,test){for(let r=0;r<10;r++){for(let k=0;k<24;k++){const a=k/24*Math.PI*2,X=tx(x)+Math.round(Math.cos(a)*r),Y=tx(y)+Math.round(Math.sin(a)*r);if(test(tileAt(X,Y),X,Y))return[X*TS+16,Y*TS+16]}}return[x,y]}

/* ---------- missions ---------- */
function poisOf(kind,city){return POIS.filter(p=>p.kind===kind&&(!city||p.city===city))}
function randomDoorIn(city,minD){const c=cityById(city);const bs=BUILDINGS.filter(b=>b.city===city&&!b.landmark&&b.kind!=='garages'&&WALKABLE[tileAt(...doorOf(b))]&&dist(b.x,b.y,tx(P.x),tx(P.y))>(minD||8));
  const b=pick(bs);if(!b)return{x:c.cx*TS,y:c.cy*TS};const[dx,dy]=doorOf(b);return{x:dx*TS+16,y:dy*TS+16}}
function roadPointIn(city,near,dmin,dmax){const c=cityById(city);for(let k=0;k<200;k++){const x=tx(near.x)+ri(-dmax,dmax),y=tx(near.y)+ri(-dmax,dmax);const d=dist(x,y,tx(near.x),tx(near.y));
  if(d<dmin||d>dmax)continue;if(!inb(x,y)||CITYA[idx(x,y)]!==c.i+1)continue;if(DRIVE[tileAt(x,y)])return{x:x*TS+16,y:y*TS+16}}return{x:c.cx*TS+16,y:c.cy*TS+16}}
function curCity(){return (cityAtPx(P.x,P.y)||nearestCity(P.x,P.y))}
function availableJobs(){const out=[],c=curCity(),mf=myFac(),age=P.age;
  if(age<13){out.push({type:'bottles',title:'Butelių medžioklė',desc:'Collect 10 empty bottles around the yards and return them at a taromatas (Maksi shop). 10 ct each.',pay:'€1 + 10 ct/bottle'});
    out.push({type:'bottlewar',title:'Butelių karas',desc:'Race Benas from entrance 5: first to grab 5 bottles in the yard wins.',pay:'€2 + glory'});
    out.push({type:'errand',title:'Mamos užduotis',desc:'Mum needs kibinai from the Maksi shop. Buy one and bring it home.',pay:'€3 + ice cream money'})}
  if(age>=13)out.push({type:'courier',title:'Kurjeris: cepelinai',desc:'Pick up an order from a café and deliver it before it gets cold. Bike or car.',pay:'€8–18'});
  if(age>=18)out.push({type:'norway',title:'Statybos Norvegijoje',desc:'Three months on a building site near Bergen. Big money, lots of rain.',pay:'€6,400'});
  if(age>=16&&P.cars.some(o=>o.model!=='bike'))out.push({type:'taxi',title:'Taksi programėlė',desc:'Pick up a passenger and drive them across town. Faster = better tip.',pay:'€12–35'});
  if(mf){const fid=P.faction,r=rankIdx(fid);
    if(mf.league==='street'){
      out.push({type:'beat',fac:fid,title:'Parodyti, kas čia šeimininkas',desc:'Knock out 3 members of a rival crew in their own district.',pay:`€${40+r*20}, rep +15`});
      out.push({type:'stogas',fac:fid,title:'Surinkti „stogą“',desc:'Collect protection money from 3 shops. Fictional 90s racket. Do not try this at home.',pay:`€${60+r*25}, rep +12`});
      out.push({type:'deliver',fac:fid,title:'Kontrabandos pervežimas',desc:'Pick up a load of contraband and drop it at a garage before the timer runs out. Police get very interested.',pay:`€${90+r*35}, rep +18`});
      if(mf.type==='cartel')out.push({type:'balloon',fac:fid,title:'Balionas iš rytų',desc:'A contraband weather balloon came down in the forest near the border. Find it and bring the boxes back to base.',pay:`€${200+r*60}, rep +30`});
      out.push({type:'turf',fac:fid,title:'Užimti teritoriją',desc:'Take a rival district: knock out their people there, then tag the district centre.',pay:'€150, rep +25, daily income'});
    }
    if(mf.league==='auto'){out.push({type:'race',fac:fid,title:'Gatvės lenktynės',desc:'Six checkpoints across the city against two club members. Fictional, closed-street racing only.',pay:`€${100+r*40}, rep +20`});
      out.push({type:'driftc',fac:fid,title:'Šoninio iššūkis',desc:'Score 6,000 drift points in 60 seconds. Handbrake (Space) to start a slide.',pay:`€${60+r*25}, rep +15`});
      if(r>=3&&!G.flags.bossWin)out.push({type:'bossrace',fac:fid,title:`Iššūkis bosui`,desc:`Race ${mf.boss} and their best driver. Win and the whole club knows your name.`,pay:'€600, rep +90'});
      if(r>=2)out.push({type:'hwyrace',fac:fid,title:'Lenktynės tarp miestų',desc:'Race two club drivers along a highway to the next town. Fictional, closed highway.',pay:`€${300+r*80}, rep +40`});
      out.push({type:'meet',fac:fid,title:'Naktinis susitikimas',desc:'Bring your own car to the club meet spot between 21:00 and 03:00. Better tuning, more respect.',pay:'rep by car'})}
    if(mf.league==='school'||mf.type==='crew'){out.push({type:'tag',fac:fid,title:'Pažymėti teritoriją',desc:'Tag 3 walls near the rival hangout with a spray can (hold E).',pay:'€10, rep +12'});
      out.push({type:'scuffle',fac:fid,title:'Kiemo muštynės',desc:'Win against 3 rivals in a yard scuffle. Fists only, nobody gets seriously hurt in this game.',pay:'rep +15'});
      if(mf.type==='crew'){out.push({type:'hangout',fac:fid,title:'Vakaras ant tilto',desc:'Hang out on the White Bridge for a while between 18:00 and 23:00.',pay:'rep +10, mood'});out.push({type:'turf',fac:fid,title:'Atsiimti rajoną',desc:'Push the gopai out of a district: knock out their people, then tag the centre.',pay:'rep +25'})}}}
  return out}
function startMission(type){if(G.mission){log('Finish or cancel your current job first (Q).','bad');return}
  const c=curCity(),mf=myFac(),fid=P.faction,r=mf?rankIdx(fid):0;let M={type,fac:fid,city:c.id,t0:now()};
  const rivalDistrict=()=>{const ds=DISTRICTS.filter(d=>d.city===MAP.id&&d.cnt&&d.owner&&d.owner!==fid&&FACTIONS[d.owner].league==='street'&&!d.peace);return ds.length?pick(ds):null};
  if(type==='bottlewar'){startBottleWar();return}
  switch(type){
  case 'bottles':M.title='Butelių medžioklė';M.need=10;M.start=has('bottle');M.step='Collect bottles';break;
  case 'errand':M.title='Mamos užduotis';M.step='Buy kibinai at Maksi';M.target=nearestPOI('shop');break;
  case 'courier':{const from=nearestPOI('cafe')||nearestPOI('kebab');if(!from){log('No food places here. Try in a town.','bad');return}M.title='Kurjeris';M.step='Pick up the order';M.target={x:from.x,y:from.y,label:from.name};M.dest=randomDoorIn(c.id,10);M.dest.label='Customer';M.timer=150;M.pay=ri(8,18);break}
  case 'taxi':{M.title='Taksi';M.step='Pick up the passenger';const p=roadPointIn(c.id,P,6,14);M.target={x:p.x,y:p.y,label:'Passenger'};M.dest=roadPointIn(c.id,p,16,30);M.dest.label='Destination';M.timer=180;M.pay=ri(12,25);break}
  case 'beat':{const d=rivalDistrict();if(!d){log('No rivals to fight right now.');return}M.title='Parodyti jėgą';M.d=d.id;M.need=3;M.got=0;M.target={x:d.cx*TS,y:d.cy*TS,label:d.name};M.step=`Knock out 3 ${FACTIONS[d.owner].short} in ${d.name}`;M.pay=40+r*20;M.rep=15;M.victim=d.owner;break}
  case 'stogas':{const shops=POIS.filter(p=>['shop','kebab','bar','cafe','kiosk'].includes(p.kind));if(shops.length<2){log('Not enough shops here.','bad');return}M.title='Surinkti „stogą“';M.list=shops.sort(()=>Math.random()-.5).slice(0,3).map(p=>({x:p.x,y:p.y,label:p.name}));M.i=0;M.target=M.list[0];M.step='Visit the shops';M.pay=60+r*25;M.rep=12;break}
  case 'deliver':{const near=randomDoorIn(c.id,6);M.title='Kontrabanda';M.step='Pick up the contraband';M.target={x:near.x,y:near.y,label:'Pickup'};const dc=curCity();M.dest=Object.assign(dc.id===c.id?randomDoorIn(dc.id,20):randomDoorIn(dc.id,0),{label:'Garage in '+dc.name});M.timer=dc.id===c.id?200:420;M.pay=90+r*35+(dc.id!==c.id?120:0);M.rep=18;break}
  case 'balloon':{M.title='Balionas iš rytų';M.travels=true;M.step='Travel to Pasienio miškas (car, BlaBla or taxi)';M.target=null;M.pay=200+r*60;M.rep=30;if(MAP.id==='pasienis'){G.mission=M;placeBalloon();toast('📱',M.title,M.step);return}break}
  case 'turf':{const d=rivalDistrict()||pick(DISTRICTS.filter(d=>d.city===MAP.id&&d.cnt&&!d.owner&&!d.peace));if(!d)return;M.title='Užimti teritoriją';M.d=d.id;M.target={x:d.cx*TS,y:d.cy*TS,label:d.name};M.step=`Take ${d.name} (${cityById(d.city).name})`;M.pay=150;M.rep=25;break}
  case 'race':startRace(M,r);return;
  case 'hwyrace':startRoadRace(r);return;
  case 'norway':norwayJob();return;
  case 'bossrace':startBossRace(r);return;
  case 'driftc':M.title='Šoninio iššūkis';M.need=6000;M.got=0;M.timer=60;M.step='Drift! 6,000 points';M.pay=60+r*25;M.rep=15;if(!P.inCar){log('Get in a car first (F).','bad');return}break;
  case 'meet':{const spot=POIS.find(p=>p.meet===fid)||POIS.find(p=>p.meet);M.title='Naktinis susitikimas';M.target={x:spot.x,y:spot.y,label:spot.name};M.step='Bring your car to the meet (21:00–03:00)';break}
  case 'tag':{const rivalSchool=mf.type==='crew'?null:POIS.find(p=>p.kind==='school'&&p.fac!==fid);const rd=DISTRICTS.find(d=>d.city===MAP.id&&d.cnt&&d.owner&&d.owner!==fid)||DISTRICTS.find(d=>d.city===MAP.id&&d.cnt);const base=rivalSchool||(rd?{x:rd.cx*TS,y:rd.cy*TS}:{x:P.x,y:P.y});
    M.title='Pažymėti teritoriją';M.list=[];for(let k=0;k<40&&M.list.length<3;k++){const t=randomTileNear(base.x,base.y,2,9,(t,x,y)=>t===T.WALK&&(tileAt(x,y-1)===T.BUILD||tileAt(x+1,y)===T.BUILD||tileAt(x-1,y)===T.BUILD));if(t&&!M.list.some(q=>dist(q.x,q.y,t[0]*TS,t[1]*TS)<64))M.list.push({x:t[0]*TS+16,y:t[1]*TS+16,label:'Wall'})}
    if(!M.list.length)M.list=[{x:base.x,y:base.y+40,label:'Wall'}];M.i=0;M.target=M.list[0];M.step='Tag the walls (hold E)';M.pay=10;M.rep=12;if(!has('spray'))log('You need a spray can (dažų balionėlis). Maksi sells them.','amb');break}
  case 'scuffle':{const rs=POIS.find(p=>p.kind==='school'&&p.fac!==fid);const tg=DISTRICTS.find(d=>d.city===MAP.id&&d.cnt&&d.owner&&d.owner!==fid);if(!rs&&!tg){log('No rivals around here.','bad');return}M.title='Kiemo muštynės';M.need=3;M.got=0;
    M.target=rs?{x:rs.x,y:rs.y,label:rs.name}:{x:tg.cx*TS,y:tg.cy*TS,label:tg.name};M.step='Win 3 scuffles with rivals';M.rep=15;M.pay=0;
    if(rs){for(let k=0;k<3;k++){const t=randomTileNear(rs.x,rs.y,1,5,(t)=>WALKABLE[t]);if(t)spawnPed('school',t[0]*TS+16,t[1]*TS+16,rs.fac,{keep:true})}}break}
  case 'hangout':{const wb=POIS.find(p=>p.hq==='centras');if(!wb){log('The White Bridge is in Vilnius. Travel there first.','bad');return}M.title='Vakaras ant tilto';M.target={x:wb.x,y:wb.y-60,label:'Baltasis tiltas'};M.need=40;M.got=0;M.step='Hang out on the bridge (18:00–23:00)';M.rep=10;break}
  }
  G.mission=M;toast('📱',M.title,M.step);SND.blip(990)}
function nearestPOI(kind,city){let best=null,bd=1e12;POIS.forEach(p=>{if(p.kind!==kind)return;if(city&&p.city!==city)return;const d=dist(p.x,p.y,P.x,P.y);if(d<bd){bd=d;best=p}});return best}
function missionDone(extra){const M=G.mission;if(!M)return;if(M.type==='scuffle')G.flags.scuffleWin=true;G.mission=null;G.missionsDone=(G.missionsDone||0)+1;let pay=M.pay||0;if(M.timer!==undefined&&M.type!=='driftc'&&M.timer>0)pay+=Math.round(M.timer/10);
  if(pay)P.money+=pay;if(M.rep&&M.fac)gainRep(M.fac,M.rep);setMood(6);SND.fanfare();toast('✔',M.title+' · atlikta',`${pay?'+'+eur(pay)+' ':''}${M.rep?'· rep +'+M.rep:''}${extra?' · '+extra:''}`);chron(`Finished: ${M.title}.`);
  ENT.peds.forEach(e=>{if(e.keep&&e.kind==='school')e.keep=false});ENT.cars=ENT.cars.filter(c=>c.ai!=='race');}
function missionFail(why){const M=G.mission;if(!M)return;G.mission=null;log(`Job failed: ${M.title}. ${why||''}`,'bad');ENT.cars=ENT.cars.filter(c=>c.ai!=='race');ENT.pickups=ENT.pickups.filter(k=>!k.balloon);if(M.type==='deliver'||M.type==='balloon'){const n=has('kontra');if(n)give('kontra',-n)}}
function missionEvent(ev,arg){const M=G.mission;if(!M)return;
  if(ev==='ko'&&(M.type==='beat'||M.type==='scuffle')){if(M.type==='beat'){const d=districtAt(arg.x,arg.y);if(!(arg.fac===M.victim&&d&&d.id===M.d))return}M.got++;if(M.got>=M.need)missionDone()}
  if(ev==='drift'&&M.type==='driftc'){M.got+=arg;if(M.got>=M.need)missionDone()}
  if(ev==='kontra'&&(M.type==='balloon')){M.target=M.dest;M.step='Bring the boxes back to base';if(Math.random()<.6)crime(1,'Border guards spotted you')}}
function tickMission(dt){const M=G.mission;if(!M)return;
  if(M.timer!==undefined&&M.type!=='race'){M.timer-=dt;if(M.timer<=0){if(M.type==='driftc'){if(M.got+DRIFT.cur>=M.need)missionDone();else missionFail(`Scored ${Math.round(M.got)}.`)}else missionFail('Out of time.');return}}
  const me=P.inCar||P,at=t=>t&&(!t.map||t.map===MAP.id)&&dist(me.x,me.y,t.x,t.y)<(P.inCar?60:40);
  switch(M.type){
  case 'bottles':M.step=`Bottles: ${Math.min(has('bottle'),M.need)}/${M.need}`;if(has('bottle')>=M.need&&!M.full){M.full=true;M.target=nearestPOI('shop');M.step='Return them at the Maksi taromatas'}break;
  case 'errand':if(has('kibinas')&&(!M.bought||!M.target)){M.bought=true;const h=POIS.find(p=>p.id===P.home);M.target=h?{x:h.x,y:h.y,label:'Namai'}:null;M.step=h?'Bring the kibinai home':'Go back to your home town'}if(M.bought&&M.target&&at(M.target)&&has('kibinas')){give('kibinas',-1);M.pay=3;missionDone('Mum says ačiū')}break;
  case 'courier':case 'taxi':if(!M.picked&&at(M.target)){if(M.type==='taxi'&&!P.inCar)break;M.picked=true;M.target=M.dest;M.step=M.type==='taxi'?'Drive to the destination':'Deliver the order';SND.blip(700);if(M.type==='taxi')bubble(P.inCar,'Labas, į '+pick(['centrą','stotį','Akropolį','namus'])+', prašau.')}
    else if(M.picked&&at(M.target)){if(M.type==='taxi'&&!P.inCar)break;missionDone(M.type==='taxi'?'Passenger: „Ačiū!“':'Customer: „Dar šilti!“')}break;
  case 'stogas':if(at(M.target)){M.i++;SND.coin();log(`${M.target.label}: the owner pays up, scowling.`);if(M.i>=M.list.length){missionDone();crime(1,'Racketeering')}else{M.target=M.list[M.i];M.step=`Shops: ${M.i}/${M.list.length}`}}break;
  case 'deliver':if(!M.picked&&at(M.target)){M.picked=true;give('kontra',2);M.target=M.dest;M.step='Drop the boxes at the garage';if(Math.random()<.5)crime(1,'Someone tipped off the police')}
    else if(M.picked&&at(M.target)){if(!has('kontra')){missionFail('You lost the boxes.');break}give('kontra',-has('kontra'));missionDone()}break;
  case 'balloon':if(M.target===M.dest&&at(M.dest)&&has('kontra')){give('kontra',-has('kontra'));missionDone('The Generolas is pleased')}break;
  case 'turf':{const d=DISTRICTS[M.d];if(d.owner===P.faction)missionDone();M.step=d.owner===P.faction?'Done':`${d.name}: ${Math.min(CAP[d.id]||0,capNeed(d))}/${d.owner?capNeed(d):0} down, then tag the centre`;break}
  case 'meet':{const h=G.time.min/60;if(at(M.target)&&P.inCar&&P.inCar.owned!==undefined&&(h>=21||h<3)){const oc=P.cars[P.inCar.owned],t=oc.tune||{};const score=Math.round(CARS[oc.model].price/250+(t.eng||0)*4+(t.turbo?8:0)+(t.drift?5:0)+(t.neon?6:0));M.rep=clamp(score,4,40);missionDone(`Crowd rating ${score}`)}break}
  case 'tag':break;
  case 'hangout':{const h=G.time.min/60;if(at(M.target)&&!P.inCar&&h>=18&&h<23){M.got+=dt;M.step=`Hang out: ${Math.round(M.got)}/${M.need}s`;if(Math.random()<dt*.5)bubble(pick(ENT.peds.filter(e=>e.fac==='centras'))||P,pick(['Nu ką, kaip?','Kieta lenta!','Eime į kebabinę.','Žiauriai šilta šiandien.']));if(M.got>=M.need){setMood(15);missionDone()}}break}
  case 'race':tickRace(M,dt);break;
  }}
function startRace(M,r,cps){const c=curCity();if(!P.inCar||CARS[P.inCar.model].kind==='bike'){log('You need a car for a race. Get in one (F).','bad');return}
  M.title='Gatvės lenktynės';M.cps=cps||[];let at={x:P.inCar.x,y:P.inCar.y};if(!cps)for(let k=0;k<6;k++){const p=roadPointIn(c.id,at,9,16);M.cps.push(p);at=p}M.i=0;M.target=Object.assign({label:`Checkpoint 1/${M.cps.length}`},M.cps[0]);
  M.step='3…';M.count=3.5;M.pay=100+r*40;M.rep=20;M.timer=0;M.ai=[];
  for(let k=0;k<2;k++){const a=P.inCar.ang+Math.PI/2*(k?1:-1);const x=P.inCar.x+Math.cos(a)*30-Math.cos(P.inCar.ang)*40*(k+1),y=P.inCar.y+Math.sin(a)*30-Math.sin(P.inCar.ang)*40*(k+1);
    const m=pick(['e36','e46','audi80','golf','w124']);const car={type:'car',ai:'race',model:m,color:FACTIONS[M.fac].color,x,y,ang:P.inCar.ang,vx:0,vy:0,hp:100,cp:0,skill:rnd(.72,.9)-(r*.0),stuck:0};ENT.cars.push(car);M.ai.push(car)}
  G.mission=M;if(!cps)toast('🏁','Gatvės lenktynės','Six checkpoints. Fictional race on closed streets.')}
function tickRace(M,dt){if(M.count>0){M.count-=dt;M.step=M.count>0?Math.ceil(M.count)+'…':'Važiuojam!';if(P.inCar){P.inCar.vx*=.8;P.inCar.vy*=.8}return}
  M.timer+=dt;const me=P.inCar;if(!me){missionFail('You left the car.');return}
  if(dist(me.x,me.y,M.target.x,M.target.y)<70){M.i++;SND.blip(1000);if(M.i>=M.cps.length){const ahead=M.ai.filter(a=>a.cp>=M.cps.length).length;const place=ahead+1;
      if(place===1){G.flags[M.hwy?'hwyWin':'raceWin']=true;if(M.boss)G.flags.bossWin=true;missionDone(`1st place in ${M.timer.toFixed(1)}s`)}else{M.pay=place===2?30:0;M.rep=place===2?8:2;missionDone(`${place}. vieta`)}return}
    M.target=Object.assign({label:`Checkpoint ${M.i+1}/${M.cps.length}`},M.cps[M.i])}
  M.ai.forEach(a=>{if(a.cp>=M.cps.length){a.vx*=.95;a.vy*=.95;carMove(a,dt);return}const t=M.cps[a.cp];const st=carStats(a);const ang=Math.atan2(t.y-a.y,t.x-a.x);let da=((ang-a.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
    const fx=Math.cos(a.ang),fy=Math.sin(a.ang),rx=-fy,ry=fx;let vF=a.vx*fx+a.vy*fy,vR=a.vx*rx+a.vy*ry;
    if(a.rev>0){a.rev-=dt;vF=Math.max(vF-st.acc*dt,-100)}else{a.ang+=clamp(da,-1,1)*2.4*dt*clamp(Math.abs(vF)/100,.3,1);const want=st.max*a.skill*(Math.abs(da)>.9?.45:1);vF+=(vF<want?st.acc:-st.acc)*dt}
    if(Math.hypot(a.vx,a.vy)<20){a.stuck+=dt;if(a.stuck>1.5){a.rev=.8;a.stuck=0}}else a.stuck=0;
    vR*=Math.exp(-st.grip*dt);a.vx=fx*vF+rx*vR;a.vy=fy*vF+ry*vR;carMove(a,dt);if(dist(a.x,a.y,t.x,t.y)<70)a.cp++});
  const pos=1+M.ai.filter(a=>a.cp>M.i||(a.cp===M.i&&dist(a.x,a.y,M.target.x,M.target.y)<dist(me.x,me.y,M.target.x,M.target.y))).length;M.step=`Position ${pos}/3 · ${M.timer.toFixed(1)}s`}

/* ---------- hold-E actions (tagging) ---------- */
const HOLD={t:0,act:null};
function holdAction(){const M=G.mission;const me=P;if(P.inCar)return null;
  if(M&&M.type==='tag'&&M.target&&dist(me.x,me.y,M.target.x,M.target.y)<44)return{label:'Hold E: tag the wall',dur:1.4,fn:()=>{if(!has('spray')){log('No spray can.','bad');return}give('spray',-1);G.flags.tags=(G.flags.tags||0)+1;DECOR.push({k:'tag',x:M.target.x-14,y:M.target.y-26,col:FACTIONS[P.faction].color,txt:FACTIONS[P.faction].short.slice(0,4).toUpperCase()});SND.spray();
    M.i++;if(M.i>=M.list.length)missionDone();else{M.target=M.list[M.i];M.step=`Walls: ${M.i}/${M.list.length}`}if(Math.random()<.3)crime(1,'Vandalism')}};
  const mf=myFac();if(mf&&mf.league==='street'){const d=districtAt(P.x,P.y);if(d&&d.owner!==P.faction&&dist(P.x,P.y,d.cx*TS,d.cy*TS)<3*TS){
    const need=d.owner?capNeed(d):0,got=CAP[d.id]||0;if(got>=need)return{label:`Hold E: tag ${d.name} for ${mf.short}`,dur:2,fn:()=>{if(!has('spray')){log('You need a spray can to tag the district.','bad');return}give('spray',-1);captureDistrict(d)}};
    return{label:`${d.name}: knock out ${need-got} more ${FACTIONS[d.owner].short} first`,dur:0}}}
  return null}
function captureDistrict(d){G.flags.captured=true;const old=d.owner;d.owner=P.faction;CAP[d.id]=0;refreshOverlay();SND.fanfare();gainRep(P.faction,25);P.money+=50;
  DECOR.push({k:'tag',x:d.cx*TS-14,y:d.cy*TS-30,col:FACTIONS[P.faction].color,txt:FACTIONS[P.faction].short.slice(0,4).toUpperCase()});
  toast(cityById(d.city).code,`${d.name} · ${FACTIONS[P.faction].short}`,old?`Taken from ${FACTIONS[old].name}. +€50 and daily income.`:'Claimed for your crew. Daily income.');chron(`Took ${d.name} (${cityById(d.city).name}).`);
  G.news.unshift(`${dateStr()}: ${FACTIONS[P.faction].name} took ${d.name}.`);
  ENT.peds.forEach(e=>{if(e.fac===old&&districtAt(e.x,e.y)===d){e.state='flee';e.t=6;e.angry=false}})}
function tickEvents(){(G.events||[]).forEach(ev=>{if(ev.done)return;const d=DISTRICTS[ev.d];if(d.owner!==P.faction){ev.done=true;return}
  const inD=districtAt(P.x,P.y)===d;if(inD&&!ev.spawned){ev.spawned=true;ev.foes=[];for(let k=0;k<5;k++){const t=randomTileNear(P.x,P.y,6,12,(t)=>WALKABLE[t]);if(t){const e=spawnPed('gang',t[0]*TS+16,t[1]*TS+16,ev.by,{keep:true,angry:true});ev.foes.push(e)}}log(`${FACTIONS[ev.by].short} are here. Fight them off!`,'bad')}
  if(ev.spawned&&ev.foes.every(e=>e.ko>0||e.dead)){ev.done=true;ev.foes.forEach(e=>e.keep=false);gainRep(P.faction,15);toast('✔',`${d.name} apginta`,'You defended the district.');chron(`Defended ${d.name}.`)}})}

/* ---------- main quest ---------- */
function baseSteps(){const a=P.age,home=POIS.find(p=>p.id===P.home),c=cityById(P.city),lm=POIS.find(p=>p.kind==='landmark'&&p.city===c.id);
  const S=[{t:'Nusipirk ką nors parduotuvėje „Maksi“',en:'Buy anything at a Maksi shop',done:()=>G.flags.bought,tg:()=>nearestPOI('shop',c.id)}];
  if(a<13)S.push({t:'Surink 5 butelius',en:'Collect 5 empty bottles in the yards',done:()=>has('bottle')>=5||G.flags.tara},{t:'Priduok butelius taromate',en:'Return them at the Maksi taromatas',done:()=>G.flags.tara,tg:()=>nearestPOI('shop',c.id)});
  else if(a<16)S.push({t:'Nueik į mokyklą',en:'Go to your school',done:()=>G.flags.schoolVisit,tg:()=>POIS.find(p=>p.fac===P.school)});
  else S.push({t:'Susipažink su gauja ar klubu',en:'Visit any gang HQ or club garage',done:()=>G.flags.hqVisit,tg:()=>nearestPOI('hq')});
  S.push({t:`Aplankyk: ${lm?lm.name:'lankytina vieta'}`,en:'See a landmark in your city',done:()=>Object.keys(P.landmarks).length>0,tg:()=>lm});
  S.push({t:'Nuvažiuok į kitą miestą',en:'Travel to another town (bus station, car or ferry)',done:()=>Object.keys(P.visited).length>=2,tg:()=>nearestPOI('bus',c.id)});
  if(a<13)S.push({t:'Užaugk',en:'Grow up: use „Užaugti“ at home',done:()=>P.age>=13,tg:()=>home});
  else if(a<16)S.push({t:'Prisijunk prie kiemo gaujos ar Centro',en:'Join your school yard crew or the Centras kids',done:()=>!!P.faction,tg:()=>POIS.find(p=>p.fac===P.school)});
  else S.push({t:'Prisijunk prie gaujos, kartelio ar klubo',en:'Join a gang, a cartel or a car club',done:()=>!!P.faction,tg:()=>nearestPOI('hq')});
  return S}
function questSteps(){const base=baseSteps();if(G.qi<base.length)return base;
  if(!G.chap){const path=pathNow();if((G.chDone||[]).includes(path))return base;G.chap={path,start:base.length};const ch=CHAPTERS[path];toast('§',ch.t,ch.en+' · new story chapter');chron(`Started chapter: ${ch.t}.`)}
  if(G.chap.start!==base.length){G.qi=base.length+Math.max(0,G.qi-G.chap.start);G.chap.start=base.length}
  return base.concat(CHAPTERS[G.chap.path].steps.map(s=>Object.assign({ch:CHAPTERS[G.chap.path].t},s)))}
function checkQuest(){let S=questSteps();let guard=0;while(G.qi<S.length&&S[G.qi].done()&&guard++<20){G.qi++;P.money+=G.chap?40:5;SND.blip(1200);
    if(G.qi<S.length)log(`Next: <b>${S[G.qi].t}</b> <i>${S[G.qi].en}</i>`,'amb');
    else if(G.chap){const ch=CHAPTERS[G.chap.path];G.chDone=(G.chDone||[]);G.chDone.push(G.chap.path);G.chap=null;P.money+=500;toast('★',`${ch.t} · baigta`,'Chapter complete. +€500.');chron(`Finished chapter: ${ch.t}.`);SND.fanfare()}
    else{toast('LT','Naujas gyvenimas · baigta','Your life is yours now. A new chapter starts based on the path you choose.');chron('Settled into a new life.')}
    S=questSteps()}}
const GOALS=[
 {id:'gang',t:'Gangsteris',en:'Reach the top street rank',ok:()=>Object.keys(P.rep).some(k=>FACTIONS[k]&&FACTIONS[k].league==='street'&&FACTIONS[k].type!=='crew'&&rankIdx(k)>=5)},
 {id:'auto',t:'Klubo legenda',en:'Top rank in a car club',ok:()=>Object.keys(P.rep).some(k=>FACTIONS[k]&&FACTIONS[k].league==='auto'&&rankIdx(k)>=4)},
 {id:'school',t:'Mokyklos karalius',en:'Top rank in your school yard',ok:()=>Object.keys(P.rep).some(k=>FACTIONS[k]&&FACTIONS[k].league==='school'&&rankIdx(k)>=3)},
 {id:'travel',t:'Keliautojas',en:'Visit all 8 towns',ok:()=>Object.keys(P.visited).length>=8,prog:()=>Object.keys(P.visited).length+'/8'},
 {id:'sights',t:'Lankytinos vietos',en:'See 12 landmarks',ok:()=>Object.keys(P.landmarks).length>=12,prog:()=>Object.keys(P.landmarks).length+'/12'},
 {id:'rich',t:'Turtuolis',en:'Have €100,000',ok:()=>P.money>=100000,prog:()=>eur(P.money)},
 {id:'turf',t:'Teritorijų valdovas',en:'Your crew holds 10 districts',ok:()=>P.faction&&DISTRICTS.filter(d=>d.owner===P.faction).length>=10,prog:()=>P.faction?DISTRICTS.filter(d=>d.owner===P.faction).length+'/10':'0/10'},
 {id:'drift',t:'Šoninio karalius',en:'One drift of 10,000 points',ok:()=>(P.stats.bestDrift||0)>=10000,prog:()=>(P.stats.bestDrift||0)+''},
 {id:'bottles',t:'Taromato meistras',en:'Return 200 bottles',ok:()=>(P.stats.bottles||0)>=200,prog:()=>(P.stats.bottles||0)+'/200'},
 {id:'m5',t:'Svajonių BMW',en:'Own a BMW M5',ok:()=>P.cars.some(c=>c.model==='m5')},
];
function checkGoals(){GOALS.forEach(g=>{if(!P.goals[g.id]&&g.ok()){P.goals[g.id]=true;toast('★',g.t,g.en+' · tikslas pasiektas');SND.fanfare();chron(`Goal reached: ${g.t}.`)}})}
function checkVisits(){POIS.forEach(p=>{if(p.kind==='landmark'&&!P.landmarks[p.id]&&dist(p.x,p.y,P.x,P.y)<3*TS){P.landmarks[p.id]=true;setMood(8);toast('◆',p.name,p.desc);SND.blip(800)}})}
let LASTCITY=null;
