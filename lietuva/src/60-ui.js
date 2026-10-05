
/* =====================================================================
   PLACES & PANELS
   ===================================================================== */
function mHead(gl,t,s){return `<div class="mhead"><div class="gl">${gl}</div><div><h2>${t}</h2>${s?`<p>${s}</p>`:''}</div><button class="x" onclick="closeModal()" aria-label="Close">✕</button></div>`}
function openModal(html,wide){$('#mcard').innerHTML=html;$('#mcard').classList.toggle('wide',!!wide);$('#modal').classList.remove('hidden');paused=true;keys.clear()}
function closeModal(){$('#modal').classList.add('hidden');paused=false;keys.clear();hudUpdate()}
function act(title,sub,btn,fn,dis){const id='a'+Math.random().toString(36).slice(2,8);ACTS[id]=fn;return `<div class="act"><div class="at"><b>${title}</b><div>${sub||''}</div></div><button class="btn sm${dis?'':' green'}" ${dis?'disabled':''} onclick="runAct('${id}')">${btn}</button></div>`}
const ACTS={};function runAct(id){const f=ACTS[id];if(f)f();hudUpdate()}
function skipHours(h){const before=G.time.min;G.time.min+=h*60;while(G.time.min>=1440){G.time.min-=1440;newDay()}void before}

function poiMenu(p){
  G.flags.lastPOI=p.id;const c=cityById(p.city)||{name:'',loc:''};
  if(p.kind==='landmark'){if(p.hq){return openHQ(p)}
    let h=mHead('◆',esc(p.name),c.name||'Lietuva')+`<div class="mbody scene"><p>${esc(p.desc)}</p></div><div class="mfoot">`;
    if(p.meet){const f=FACTIONS[p.meet];h+=`<span class="pill" style="align-self:center">${esc(f.name)} meet spot</span>`}
    h+=`<button class="btn ghost" onclick="selfie()">Selfis</button><button class="btn" onclick="closeModal()">Gerai</button></div>`;return openModal(h)}
  if(p.kind==='home')return openHome(p);
  if(p.kind==='hq')return openHQ(p);
  if(p.kind==='school')return openSchool(p);
  if(p.kind==='garage')return openGarage(p);
  if(p.kind==='bus')return openBus(p);
  if(p.kind==='ferry')return openTravel('ferry',p);
  const sh=SHOPS[p.kind];
  if(sh){let h=mHead(p.kind==='shop'?'M':p.kind==='kebab'?'K':p.kind==='market'?'T':'C',esc(p.name),c.name)+'<div class="mbody">';
    if(p.kind==='kiosk')h+=act('Dirbti kioske','A five-hour shift behind the counter. Know who not to sell to.','Dirbti',()=>{closeModal();kioskShift()});
    if(p.kind==='kiosk')h+=act('🚬 Cigaretės','Legal cigarettes, €5.50. ID checked.','€5,50',()=>{if(P.age<18){log('Kioskininkė: „Parodyk pasą! Kiek tau metų?!“ No sale.','bad');setMood(-2);return}if(pay(5.5)){give('cigs',1)}});
    if(p.kind==='shop'){const b=has('bottle');h+=act('Taromatas',`Return empty bottles, 10 ct each. You have ${b}.`,`Priduoti (${eur(b*.1)})`,()=>{const n=has('bottle');if(!n)return;give('bottle',-n);P.money+=n*.1;P.stats.bottles=(P.stats.bottles||0)+n;SND.coin();G.flags.tara=true;
      const M=G.mission;if(M&&M.type==='bottles'){M.pay=1;missionDone(`${n} bottles`)}log(`Taromatas: ${n} × €0.10`,'good');poiMenu(p)},!b)}
    const mushIds=Object.keys(P.inv).filter(k=>ITEMS[k]&&ITEMS[k].mush&&ITEMS[k].sell&&P.inv[k]>0);if(p.kind==='market'&&mushIds.length){const tot=mushIds.reduce((a,k)=>a+ITEMS[k].sell*P.inv[k],0);h+=act('Parduoti grybus',`Sell mushrooms: ${mushIds.map(k=>ITEMS[k].n+' ×'+P.inv[k]).join(', ')}.`,eur(tot),()=>{mushIds.forEach(k=>give(k,-P.inv[k]));P.money+=tot;SND.coin();poiMenu(p)})}
    if(p.kind==='market')h+=act('Derėtis su močiute','Cheese, pickles and a kibinas. Haggle the price down — but respect your elders.','Derėtis',()=>{closeModal();setTimeout(haggleFood,30)});
    const fishIds=Object.keys(P.inv).filter(k=>ITEMS[k]&&ITEMS[k].fish&&P.inv[k]>0);if(p.kind==='market'&&fishIds.length){const tot=fishIds.reduce((a,k)=>a+ITEMS[k].sell*P.inv[k],0);h+=act('Parduoti žuvį',`Sell your catch: ${fishIds.map(k=>ITEMS[k].n+' ×'+P.inv[k]).join(', ')}.`,eur(tot),()=>{fishIds.forEach(k=>give(k,-P.inv[k]));P.money+=tot;SND.coin();poiMenu(p)})}
    if(p.kind==='market'&&!P.dog)h+=act('Šuniukas iš prieglaudos','A volunteer from the animal shelter has puppies that need a home. Free, just love it.','Priglausti',()=>{adoptDog();poiMenu(p)});
    if(p.kind==='market'&&has('amber'))h+=act('Parduoti gintarą',`Sell amber, €15 a piece. You have ${has('amber')}.`,'Parduoti',()=>{const n=has('amber');give('amber',-n);P.money+=n*15;SND.coin();poiMenu(p)});
    sh.items.forEach(id=>{const it=ITEMS[id];const pr=price(it.price,'food');const too=it.min&&P.age<it.min;
      h+=act(`${it.ic} ${it.n}`,`${it.en}${too?` · age ${it.min}+`:''}`,eur(pr).replace('€','€ ')+(pr%1?'':''),()=>{if(pay(pr)){give(id,1);G.flags.bought=true;log(`Bought: ${it.n}`)}poiMenu(p)},too)});
    h+=`</div><div class="mfoot"><span style="margin-right:auto;align-self:center;font-weight:700">${eur(P.money)}</span><button class="btn" onclick="closeModal()">Išeiti</button></div>`;
    h=h.replace(/€ (\d+),(\d+)/g,'€$1,$2');return openModal(h)}
  if(p.kind==='bar'){let h=mHead('B',esc(p.name),c.name)+'<div class="mbody">';
    h+=act('Gira prie baro','Bread kvass and small talk. +mood','€1,50',()=>{if(pay(1.5)){setMood(8);P.energy=Math.min(100,P.energy+5);log('„Nu, kaip sekasi?“ the bartender asks.')}});
    h+=act('Paklausyti gandų','Ask who runs which district these days.','Klausyti',()=>{const n=G.news[0]||'Quiet week. Everyone is watching basketball.';log(`Rumour: ${esc(n)}`,'amb')});
    if(P.age>=18)h+=act('Biliardas','A game of pool with the locals. Win some, lose some.','€5',()=>{if(pay(5)){const w=Math.random()<.45+P.mood/400;if(w){P.money+=12;log('You won the pool game. +€12','good')}else log('Lost. „Nu, kitą kartą.“','bad');skipHours(1)}});
    else h+=`<p class="note">The bartender looks at you: „Tau dar per anksti, vaike.“ Under 18 you only get gira.</p>`;
    return openModal(h+`</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
  if(p.kind==='police'){let h=mHead('P',esc(p.name),c.name)+'<div class="mbody">';const f=Math.ceil(P.heat)*60;
    h+=act('Sumokėti baudą','Pay a fine and clear your police attention.',f?eur(f):'Nėra',()=>{if(P.heat>0&&pay(f)){P.heat=0;log('Fine paid. The officer sighs.','good');closeModal()}},!f);
    h+=act('Pasikalbėti su pareigūnu','„Laba diena. Kuo galiu padėti?“','Kalbėti',()=>log(pick(['„Neik su gaujomis, tai blogai baigiasi.“','„Lenktyniauk trasoje, ne gatvėje.“','„Turi teises? Ne? Tada nevairuok.“']),'amb'));
    return openModal(h+`</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
  if(p.kind==='hospital'){const cost=P.age<18?0:40;return openModal(mHead('+',esc(p.name),c.name)+`<div class="mbody">${act('Gydytis','Patch up to full health.'+(cost?'':' Free for kids.'),cost?eur(cost):'Nemokamai',()=>{if(cost&&!pay(cost))return;P.hp=P.maxHp;skipHours(1);log('All patched up.','good');closeModal()},P.hp>=P.maxHp)}</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
  if(p.kind==='gym'){return openModal(mHead('G',esc(p.name),'Treniruotė · training')+`<div class="mbody">${act('Treniruotis',`Fighting skill ${P.fight}/10. Two hours, -25 energy.`,'€15',()=>{if(P.age<13){log('Kids train at the school gym. Come back at 13.','bad');return}if(P.energy<25){log('Too tired. Sleep first.','bad');return}if(P.fight>=10){log('Maxed out.');return}if(pay(15)){P.fight++;P.energy-=25;skipHours(2);setMood(4);log(`Fighting skill: ${P.fight}/10`,'good');poiMenu(p)}},P.fight>=10)}
    ${act('Krepšinis su draugais','Pickup basketball. +mood, -energy','Žaisti',()=>openHoops(()=>{}))}</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
  if(p.kind==='office'){const h=G.time.min/60,can=P.job==='office'&&h>=8&&h<12&&G.time.dow>=1&&G.time.dow<=5;
    return openModal(mHead('V',esc(p.name),'Business centre')+`<div class="mbody">${P.job==='office'?act('Dirbti','Work until 17:00. €85. Come between 8:00 and 12:00 on a weekday.','Dirbti',()=>{skipHours(17-h);P.money+=85;P.energy-=30;setMood(-6);log('Spreadsheets. +€85','good');closeModal()},!can):
      act('Darbo pokalbis','Interview for an office job. Needs age 18+.','Bandyti',()=>{if(P.age<18){log('„Grįžk, kai baigsi mokyklą.“','bad');return}if(Math.random()<.6){P.job='office';log('Hired! You are a biuro darbuotojas now.','good');chron('Got an office job.')}else log('„Mes jums paskambinsime.“ (They will not call.)','bad');skipHours(1);poiMenu(p)})}</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
}
function selfie(){setMood(5);log('Nice selfie. 12 likes already.','good');closeModal()}

function openHome(p){const cls=CLASSES.find(c=>c.id===P.cls);const nxt=AGES.find(a=>a.a>P.age);let h=mHead('⌂','Namai',`${cls.home} · ${cityById(P.city).loc}`)+'<div class="mbody">';
  h+=act('Miegoti','Sleep until 7:00. Restores energy and saves the game.','Miegoti',()=>{const m=G.time.min;const add=m<7*60?7*60-m:1440-m+7*60;skipHours(add/60);P.energy=100;P.hp=P.maxHp;setMood(5);saveGame();closeModal();log('Labas rytas! Good morning.','good')});
  h+=act('Pavalgyti namie','Whatever is in the fridge. Free.','Valgyti',()=>{if(G.flags.ateAt===G.time.day){log('The fridge is empty until tomorrow.','bad');return}G.flags.ateAt=G.time.day;P.food=Math.min(100,P.food+45);log('Mum\'s cepelinai. Skanu!','good')});
  if(nxt)h+=act(`Užaugti iki ${nxt.a} m.`,`Skip ahead to age ${nxt.a}: ${nxt.en.toLowerCase()} life unlocks. Years pass, you keep your money and memories.`,'Užaugti',()=>growUp(nxt.a));
  h+=act('Persirengti','Change your outfit colour.','Spinta',()=>openWardrobe());
  if(P.cars.length)h+=act('Pasiimti automobilį','Have your vehicle parked outside.','Atvaryti',()=>{openCars()});
  return openModal(h+`</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
function growUp(age){const from=P.age,yrs=age-from;P.age=age;const cls=CLASSES.find(c=>c.id===P.cls);const gift=Math.round(cls.money[AGES.findIndex(a=>a.a===age)]*.6);P.money+=gift;
  if(age>=16&&!P.cars.some(c=>c.model!=='bike')){const m=P.parent==='mech'?'e36':cls.car;if(m){P.cars.push({model:m,color:CARS[m].col,tune:{},hp:100});log(`Your family gave you a car: ${CARS[m].name}.`,'good')}}
  if(age>=16&&P.job==='student'&&age>=19)P.job='none';
  P.maxHp=100+(P.parent==='army'?25:0);P.hp=P.maxHp;P.fight=Math.max(P.fight,age>=16?3:2);G.qi=0;
  const lines={13:'Primary school flew by. You know every yard, every taromatas and which neighbour gives the best treats.',16:'Teen years: first fights in the yard, first crush, first time someone called you „bičas“. Now people take you seriously.',24:'School is done. Some friends left for London, some for Vilnius. You stayed for your own reasons.',30:'Your twenties went fast. You have a reputation now, and it follows you into every room.'};
  chron(`Grew up from ${from} to ${age}.`);
  openModal(mHead(age,`Praėjo ${yrs} m.`,`${yrs} years pass`)+`<div class="mbody scene"><p>${lines[age]}</p><p>You are now <b>${age}</b>. ${gift?`Family gift: <b>${eur(gift)}</b>.`:''}</p><p>${age>=16?'You can drive cars, join a car club or a gang.':''}${age>=18?' Cartels will now talk to you.':''}${age===13?'You can join your school yard crew or, in Vilnius, the Centras kids.':''}</p></div><div class="mfoot"><button class="btn" onclick="closeModal()">Tęsti</button></div>`);
  spawnStartVehicles()}
function openWardrobe(){let h=mHead('👕','Spinta','Wardrobe')+'<div class="mbody"><div class="row">';
  OUTFITS.forEach(o=>{if(o.shop&&!(P.owned&&P.owned[o.id]))return;h+=`<button class="chip ${P.look.outfit===o.id?'on':''}" onclick="P.look.outfit='${o.id}';P.look.color=null;openWardrobe()">${o.t}</button>`});
  h+='</div><div class="row" style="margin-top:12px">';['#1E1F22','#5B6B73','#7A3B3B','#2D5DA8','#1E6B4A','#E2A11B','#C0392B','#F1EBDD','#6B4FA0'].forEach(col=>h+=`<button class="sw ${P.look.color===col?'on':''}" style="background:${col}" onclick="P.look.color='${col}';openWardrobe()" aria-label="colour"></button>`);
  h+=`</div><div class="row" style="margin-top:12px"><button class="chip ${P.look.cap?'on':''}" onclick="P.look.cap=!P.look.cap;openWardrobe()">Kepurė (cap)</button></div></div><div class="mfoot"><button class="btn" onclick="closeModal()">Gerai</button></div>`;openModal(h)}

function openHQ(p){const fid=p.hq,f=FACTIONS[fid];G.flags.hqVisit=true;const mine=P.faction===fid;const r=mine?rankName(fid):null;
  let h=mHead(f.short.slice(0,3).toUpperCase(),esc(f.name),`${f.type==='gang'?'Gauja':f.type==='cartel'?'Kartelis':f.type==='crew'?'Kompanija':'Automobilių klubas'} · ${cityById(f.city).name} · boss: ${esc(f.boss)}`)+'<div class="mbody">';
  h+=`<p class="scene" style="font-size:14.5px">${esc(f.desc)}</p>`;
  if(f.league==='street'){const own=DISTRICTS.filter(d=>d.owner===fid);h+=`<p class="note">Districts held: <b>${own.length}</b>${own.length?' · '+own.map(d=>esc(d.name)).join(', '):''}</p>`}
  if(mine){h+=`<p><span class="pill g">Tavo ${f.type==='auto'?'klubas':'gauja'}</span> Rank <b>${r}</b> · rep ${repOf(fid)}</p>`;
    availableJobs().filter(j=>j.fac===fid).forEach(j=>{h+=act(j.title,j.desc+` <b>${j.pay}</b>`,'Imtis',()=>{closeModal();startMission(j.type)})});
    h+=crewHQActs(p);
    h+=act('Išeiti iš '+(f.type==='auto'?'klubo':'gaujos'),'Leave. You lose half your rep with them.','Išeiti',()=>{P.rep[fid]=Math.floor(repOf(fid)/2);P.faction=null;log(`You left ${f.name}.`,'bad');chron(`Left ${f.name}.`);closeModal()})}
  else{const why=P.age<f.minAge?`Age ${f.minAge}+ only. „Ateik, kai paaugsi.“`:P.faction?`You are already with ${FACTIONS[P.faction].name}. Leave them first.`:null;
    const pen=f.league==='street'&&P.parent==='police'?' Your mum being a cop makes them suspicious: you start with less rep.':'';
    h+=act('Prisijungti',why||`Join ${f.name} as ${RANKS[rankTable(f)][0]}.${pen}`,'Prisijungti',()=>{P.faction=fid;if(P.parent==='police'&&f.league==='street')P.rep[fid]=(P.rep[fid]||0)-10;if(P.parent==='gangster'&&f.league==='street'&&f.type==='gang')P.rep[fid]=Math.max(repOf(fid),40);
      toast(f.short.slice(0,3).toUpperCase(),`Sveikas, ${rankName(fid)}!`,`You joined ${f.name}. Open the phone (T) for jobs.`);chron(`Joined ${f.name}.`);SND.fanfare();closeModal();joinScene(fid)},!!why)}
  h+=`</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`;openModal(h)}
function openSchool(p){const f=FACTIONS[p.fac],mineSchool=P.school===p.fac,h0=G.time.min/60,wd=G.time.dow>=1&&G.time.dow<=5;G.flags.schoolVisit=G.flags.schoolVisit||mineSchool;
  let h=mHead('M',esc(p.name),mineSchool?'Tavo mokykla · your school':'Rival school')+'<div class="mbody">';
  if(mineSchool&&examsAvailable(p)){h+=act('Šimtadienis','100 days before the final exams: the school party.','Švęsti',()=>{closeModal();simtadienis()},!!G.flags.simt);h+=act('Brandos egzaminai','The final school exams: 5 questions, 3 to pass.','Laikyti',()=>{closeModal();takeExams()})}
  if(mineSchool&&P.age<19){h+=act('Eiti į pamokas','Attend classes until 14:00. Tamo stays happy, parents keep paying allowance.','Į pamokas',()=>{if(!(wd&&h0>=7.5&&h0<11)){log('Lessons run on weekdays, arrive between 7:30 and 11:00.','bad');return}skipHours(14-h0);G.attended=true;P.energy-=15;setMood(-4);P.money+=0;log(pick(['Math test: 8/10. Tamo: „Puiku!“','History: the Grand Duchy reached the Black Sea. Cool.','PE: you won the basketball game.','Lithuanian: a whole lesson about Donelaitis.']),'good');closeModal()},false);
    h+=act('Mėtyti į krepšį','Shoot hoops in the yard. Timing game.','Žaisti',()=>openHoops((s)=>{if(P.faction===p.fac)gainRep(p.fac,s)}));
    if(P.age>=13){const mine=P.faction===p.fac;if(mine){h+=`<p><span class="pill g">Kiemo gauja</span> Rank <b>${rankName(p.fac)}</b> · rep ${repOf(p.fac)}</p>`;availableJobs().filter(j=>j.fac===p.fac).forEach(j=>h+=act(j.title,j.desc+` <b>${j.pay}</b>`,'Imtis',()=>{closeModal();startMission(j.type)}))}
      else h+=act('Prisijungti prie kiemo gaujos',P.faction?`You are with ${FACTIONS[P.faction].name}.`:`Run with the ${esc(f.short)} yard crew. Boss: ${esc(f.boss)}.`,'Prisijungti',()=>{P.faction=p.fac;chron(`Joined the ${f.name} yard crew.`);closeModal();joinScene(p.fac)},!!P.faction)}}
  else h+=`<p class="scene" style="font-size:14.5px">This is ${esc(f.name)}. ${P.faction&&FACTIONS[P.faction].league==='school'?'Their kids do not like your colours. Watch yourself here.':'Not your school.'}</p>`;
  openModal(h+`</div><div class="mfoot"><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
function openHoops(done){let shots=0,score=0,pos=0,dir=1,zone=rnd(30,62),run=true;const zw=14;
  openModal(mHead('🏀','Krepšinis','Press SPACE or tap when the marker is in the green. 5 shots.')+`<div class="mbody mg"><div class="mgbar"><div class="zone2" style="left:${zone}%;width:${zw}%"></div><div class="mark" id="hm"></div></div><p id="hr" class="note" style="font-size:15px">Taikykis… (aim)</p></div><div class="mfoot"><button class="btn green" id="hs">Mesti</button><button class="btn ghost" onclick="HOOP.run=false;closeModal()">Baigti</button></div>`);
  const shoot=()=>{if(!run)return;shots++;const inz=pos>=zone&&pos<=zone+zw;if(inz){score++;SND.blip(900)}else SND.blip(250);$('#hr').textContent=`${inz?'Pataikei! Swish.':'Pro šalį.'} ${score}/${shots}`;zone=rnd(20,70);$('.zone2').style.left=zone+'%';
    if(shots>=5){run=false;HOOP.run=false;G.flags.hoops=true;if(score>=4)G.flags.hoops4=true;setMood(score*3);P.energy-=8;done(score*2);$('#hr').textContent=`Rezultatas: ${score}/5. ${score>=4?'Kaip Sabonis!':score>=2?'Neblogai.':'Treniruokis.'}`}};
  $('#hs').onclick=shoot;HOOP.shoot=shoot;HOOP.run=true;
  const tick=()=>{if(!HOOP.run||!$('#hm'))return;pos+=dir*1.6;if(pos>100||pos<0)dir*=-1;$('#hm').style.left=pos+'%';requestAnimationFrame(tick)};tick()}
const HOOP={run:false,shoot:null};
function openGarage(p){let h=mHead('A',esc(p.name),P.parent==='mech'?'Dad\'s friend runs it: 40% off':'Autoservisas · garage')+'<div class="mbody">';
  const c=garageCar(p);
  if(c){const oc=P.cars[c.owned];const rep=price(Math.round((100-c.hp)*4),'car');
    h+=`<h3 style="font:800 20px var(--display);margin:0 0 8px">${esc(CARS[oc.model].name)}</h3>`;
    h+=act('Remontas',`Condition ${Math.round(c.hp)}%.`,rep?eur(rep):'OK',()=>{if(pay(rep)){c.hp=100;oc.hp=100;openGarage(p)}},!rep);
    if(CARS[oc.model].kind!=='bike')TUNES.forEach(t=>{const lv=(oc.tune[t.id]||0);const pr=lv<t.max?price(t.price[lv],'car'):0;h+=act(`${t.name}${t.max>1?` (${lv}/${t.max})`:''}`,t.en,lv>=t.max?'Įdiegta':eur(pr),()=>{if(pay(pr)){oc.tune[t.id]=lv+1;c.tune=oc.tune;c.neon=!!oc.tune.neon;log(`Installed: ${t.name}`,'good');openGarage(p)}},lv>=t.max)});
    h+='<div class="row" style="margin:6px 0 12px">'+PAINTS.map(col=>`<button class="sw" style="background:${col}" aria-label="paint" onclick="paintCar('${col}')"></button>`).join('')+'</div><p class="note">Dažymas (paint): €120 per colour.</p>'}
  else h+='<p class="note">Drive your own car in here to repair or tune it.</p>';
  h+=`<h3 style="font:800 20px var(--display);margin:14px 0 8px">Pirkti · buy</h3>`;
  SALE_MODELS.forEach(m=>{const d=CARS[m];const pr=price(d.price,'car');const too=d.kind!=='bike'&&P.age<16;h+=act(d.name,`${d.drive==='rwd'?'Rear-wheel drive, slides nicely':d.drive==='awd'?'All-wheel drive, grippy':d.drive==='fwd'?'Front-wheel drive':'Pedal power'} · top ${Math.round(d.max*.34)} km/h${too?' · age 16+':''}`,eur(pr),()=>{if(pay(pr)){P.cars.push({model:m,color:d.col,tune:{},hp:100});const[x,y]=freeSpotNear(p.x,p.y+40,t=>DRIVE[t]||t===T.LOT);spawnOwnedCar(P.cars.length-1,x,y,0);log(`Bought: ${d.name}. It's parked outside.`,'good');chron(`Bought a ${d.name}.`);openGarage(p)}},too)});
  if(P.job==='mechanic'){const hr=G.time.min/60;h+=act('Pamaina','Work a shift until 17:00 (come before 12:00). €70.','Dirbti',()=>{if(hr>=12||hr<8){log('Shift starts 8:00–12:00.','bad');return}skipHours(17-hr);P.money+=70;P.energy-=25;closeModal()})}
  openModal(h+`</div><div class="mfoot"><span style="margin-right:auto;align-self:center;font-weight:700">${eur(P.money)}</span><button class="btn" onclick="closeModal()">Išeiti</button></div>`)}
function paintCar(col){const c=P.inCar;if(!c||c.owned===undefined)return;if(!pay(price(120,'car')))return;c.color=col;P.cars[c.owned].color=col;log('Fresh paint.','good')}
function openBus(p){openTravel('bus',p)}

function openPanel(k){
  if(k==='quests')return openQuests();if(k==='map')return openMap();if(k==='phone')return openPhone();if(k==='self')return openSelf();if(k==='items')return openItems();if(k==='gloss')return openGloss();if(k==='menu')return openMenu()}
function openQuests(){const S=baseSteps();const full=questSteps();const CH=G.chap?full.slice(S.length):[];let h=mHead('U','Užduotys','Quests and goals')+'<div class="mbody">';
  if(G.mission){const M=G.mission;h+=`<div class="quest main"><h4>${esc(M.title)}</h4><div class="sub">Current job${M.timer!==undefined&&M.type!=='race'?` · ${Math.ceil(M.timer)}s left`:''}</div><p style="margin:4px 0 8px">${esc(M.step||'')}</p><button class="btn sm red" onclick="missionFail('Cancelled.');openQuests()">Atšaukti</button></div>`}
  h+=`<div class="quest"><h4>Naujas gyvenimas</h4><div class="sub">Story · ${Math.min(G.qi,S.length)}/${S.length}</div><ol>${S.map((s,i)=>`<li class="${i<G.qi?'done':i===G.qi?'cur':''}">${esc(s.t)} <span class="note">${esc(s.en)}</span></li>`).join('')}</ol></div>`;
  if(G.chap){const ch=CHAPTERS[G.chap.path];h+=`<div class="quest main"><h4>${esc(ch.t)}</h4><div class="sub">Chapter · ${esc(ch.en)} · ${Math.max(0,G.qi-S.length)}/${CH.length}</div><ol>${CH.map((s,i)=>`<li class="${i<G.qi-S.length?'done':i===G.qi-S.length?'cur':''}">${esc(s.t)} <span class="note">${esc(s.en)}</span></li>`).join('')}</ol></div>`}
  if((G.chDone||[]).length)h+=`<p class="note">Finished chapters: ${(G.chDone).map(k=>esc(CHAPTERS[k].t)).join(', ')}</p>`;
  h+=`<div class="quest"><h4>Tikslai</h4><div class="sub">Goals</div><ol>${GOALS.map(g=>`<li class="${P.goals[g.id]?'done':''}">${esc(g.t)} <span class="note">${esc(g.en)}${g.prog?' · '+g.prog():''}</span></li>`).join('')}</ol></div>`;
  openModal(h+'</div>')}
function openPhoneJobs(){const jobs=availableJobs();let h=mHead('T','Telefonas',`${DAYS[G.time.dow]} · ${fmtTime()} · ${eur(P.money)}`)+'<div class="mbody">'+phoneTabs('darbai');
  h+=`<h3 style="font:800 20px var(--display);margin:0 0 8px">Kelionės · travel</h3><div class="row" style="margin-bottom:12px"><button class="btn sm" onclick="openTravel('blabla')">BlaBla</button><button class="btn sm" onclick="openTravel('taxi')">Taksi</button>${P.inCar?`<button class="btn sm" onclick="openTravel('car')">Savo mašina</button>`:''}<button class="btn sm ghost" onclick="openMap('lt')">Žemėlapis</button></div>`;
  h+='<h3 style="font:800 20px var(--display);margin:0 0 8px">Darbai · jobs</h3>';
  if(!jobs.length)h+='<p class="note">No jobs right now.</p>';
  jobs.forEach(j=>{const f=j.fac?FACTIONS[j.fac]:null;h+=act(j.title,`${f?`<span class="pill" style="background:${f.color};color:#fff">${esc(f.short)}</span> `:''}${j.desc} <b>${j.pay}</b>`,'Imtis',()=>{closeModal();startMission(j.type)},!!G.mission)});
  if(!P.faction&&P.age>=13)h+=`<p class="note">Want more work? Join a crew: visit a gang HQ, a club garage${P.age<19?', your school':''}${P.city==='vilnius'||P.visited.vilnius?' or the White Bridge in Vilnius':''}.</p>`;
  h+='<h3 style="font:800 20px var(--display);margin:16px 0 8px">Naujienos · news</h3>';h+=(G.news.length?G.news.slice(0,6):['Nieko naujo. Nothing new.']).map(n=>`<p class="note" style="margin:0 0 6px">${esc(n)}</p>`).join('');
  if(P.age<19)h+=`<h3 style="font:800 20px var(--display);margin:16px 0 8px">Tamo</h3><p class="note">${G.skipped>=3?'⚠ Praleista pamokų: '+G.skipped+' dienos. Your parents have been notified.':'Lankomumas geras. Attendance is fine.'}</p>`;
  openModal(h+'</div>')}
function openSelf(){const c=cityById(P.city),cls=CLASSES.find(x=>x.id===P.cls),par=PARENTS.find(x=>x.id===P.parent),job=JOBS.find(x=>x.id===P.job);
  let h=mHead('A',esc(P.name+' '+P.surname),`${P.age} m. · ${c.name} · ${cls.t}`)+'<div class="mbody"><div class="grid2"><dl class="kv">';
  h+=`<dt>Tėvai</dt><dd>${par.t} (${par.en})</dd><dt>Užsiėmimas</dt><dd>${job?job.t:'Vaikas'}</dd><dt>Namai</dt><dd>${cls.home}</dd><dt>Gauja / klubas</dt><dd>${P.faction?esc(FACTIONS[P.faction].name)+' · '+rankName(P.faction):'Niekas · none'}</dd>`;
  h+=`<dt>Stilius</dt><dd>${STYLE_NAME[styleOf()]}</dd><dt>Teisės</dt><dd>${P.license?'B kategorija':'Neturi'}</dd><dt>Sekėjai</dt><dd>${P.followers||0}</dd><dt>Muštynės</dt><dd>${P.fight}/10</dd><dt>Nokautai</dt><dd>${P.stats.ko||0}</dd><dt>Geriausias šoninis</dt><dd>${P.stats.bestDrift||0}</dd><dt>Buteliai</dt><dd>${P.stats.bottles||0}</dd><dt>Miestai</dt><dd>${Object.keys(P.visited).map(k=>cityById(k).name).join(', ')}</dd></dl>`;
  h+='<div><b style="font:800 18px var(--display)">Reputacija</b>'+(Object.keys(P.rep).filter(k=>P.rep[k]&&FACTIONS[k]).map(k=>`<div class="bar"><span>${esc(FACTIONS[k].short)}</span><span>${rankName(k)} · ${P.rep[k]}</span></div>`).join('')||'<p class="note">No reputation yet.</p>');
  h+='<b style="font:800 18px var(--display);display:block;margin-top:10px">Kronika</b>'+G.hist.slice(-8).reverse().map(t=>`<p class="note" style="margin:0 0 4px">${esc(t)}</p>`).join('')+'</div></div></div>';
  openModal(h+`<div class="mfoot"><button class="btn ghost" onclick="openCars()">Transportas</button><button class="btn" onclick="closeModal()">Gerai</button></div>`)}
function openCars(){let h=mHead('🚗','Transportas','Your vehicles')+'<div class="mbody">';
  if(!P.cars.length)h+='<p class="note">You do not own anything with wheels. Garages (autoservisas) sell cars and bikes.</p>';
  P.cars.forEach((oc,i)=>{const d=CARS[oc.model],t=oc.tune||{};h+=act(d.name,`${Object.keys(t).filter(k=>t[k]).map(k=>TUNES.find(x=>x.id===k).name).join(', ')||'Stock'} · ${Math.round(oc.hp||100)}%`,'Atvaryti (€15)',()=>{if(d.kind!=='bike'&&P.age<16){log('Too young to drive it.','bad');return}if(!pay(15))return;const[x,y]=freeSpotNear(P.x,P.y,(t,X,Y)=>(DRIVE[t]||t===T.LOT||t===T.WALK)&&dist(X*TS,Y*TS,P.x,P.y)>30);if(MAP.kind==='road'){log('Not on the highway.','bad');return}P.cars[i].map=MAP.id;P.cars[i].pos=null;spawnOwnedCar(i,x,y,0);closeModal();log(`${d.name} is parked next to you.`,'good')})});
  openModal(h+`</div><div class="mfoot"><button class="btn" onclick="closeModal()">Gerai</button></div>`)}
function openItems(){let h=mHead('D','Daiktai','Belongings')+'<div class="mbody">';const ids=Object.keys(P.inv).filter(k=>P.inv[k]>0);
  if(!ids.length)h+='<p class="note">Empty pockets.</p>';
  ids.forEach(id=>{const it=ITEMS[id];h+=act(`${it.ic} ${it.n} ×${P.inv[id]}`,it.en,it.food||it.heal||it.energy?'Naudoti':it.gear?(P.gear.bat?'Nusiimti':'Pasiimti'):'—',()=>{useItem(id);openItems()},!(it.food||it.heal||it.energy||it.gear))});
  openModal(h+'</div>')}
function useItem(id){const it=ITEMS[id];if(!it||!has(id))return;if(it.read){give(id,-1);const f=pick(LORE);log(`Laikraštis: ${esc(G.news[0]||f[0])} <i>${esc(G.news[0]?'':f[1])}</i>`,'amb');return}if(it.smoke||it.drink){give(id,-1);setMood(it.mood);vice(it);log(it.smoke?'You smoke. Cough.':'Glug. The world gets wobbly.','amb');renderHotbar();return}if(id==='ledai')G.flags.ateIce=true;
  if(it.poison){give(id,-1);P.hp=Math.max(5,P.hp-40);P.hitFlash=.3;SND.hit(.4);setMood(-15);log('You ate a musmirė. Very bad idea. Pilvas skauda, pasaulis sukasi.','bad');renderHotbar();return}
  if(it.gear){P.gear.bat=!P.gear.bat;log(P.gear.bat?'Bat in hand.':'Bat away.');renderHotbar();return}
  if(it.food||it.heal||it.energy||it.mood){give(id,-1);if(it.food)P.food=Math.min(100,P.food+it.food);if(it.heal)P.hp=Math.min(P.maxHp,P.hp+it.heal);if(it.energy)P.energy=Math.min(100,P.energy+it.energy);if(it.mood)setMood(it.mood);SND.blip(600);log(`${it.n}: ${pick(['skanu!','nu jo.','gerai.'])}`)}}
function openGloss(){let h=mHead('Aa','Žodynėlis','Little dictionary of words you hear in the game')+'<div class="mbody"><div class="gloss">';
  GLOSS.forEach(([a,b])=>h+=`<div><b>${esc(a)}</b>${esc(b)}</div>`);openModal(h+'</div></div>',true)}
function openMenu(){openModal(mHead('≡','Meniu','')+`<div class="mbody">${act('Išsaugoti','Save to this browser.','Saugoti',()=>{saveGame();log('Saved.','good')})}
  ${act('Muzika',`Background folk tune: ${MUSIC.on?'on':'off'}.`,MUSIC.on?'Išjungti':'Įjungti',()=>{MUSIC.on=!MUSIC.on;openMenu()})}
  ${act('Valdymas','WASD/arrows move · Shift sprint (turbo in tuned cars) · E talk/enter/hold to tag · F car in/out · J or click punch · Space handbrake · H horn · M map · Q quests · T phone · C self · I items · L dictionary · 1–6 hotbar','—',()=>{},true)}
  ${act('Epilogas','End this life here and see the ending you earned.','Epilogas',()=>epilogue())}
  ${act('Į pradžią','Back to the title screen. Unsaved progress since the last save is lost.','Išeiti',()=>{saveGame();location.reload()})}</div>`)}

/* ---------- map ---------- */
let OVC=null;
function refreshOverlay(){OVC=document.createElement('canvas');OVC.width=W;OVC.height=H;const g=OVC.getContext('2d'),im=g.createImageData(W,H),d=im.data;
  const col={};Object.entries(FACTIONS).forEach(([k,f])=>col[k]=[parseInt(f.color.slice(1,3),16),parseInt(f.color.slice(3,5),16),parseInt(f.color.slice(5,7),16)]);
  for(let i=0;i<W*H;i++){const di=DISTA[i];if(!di)continue;const o=DISTRICTS[di-1].owner;if(!o)continue;const c=col[o];d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=120}
  g.putImageData(im,0,0)}
let MAPTAB='city';
function openMap(tab){if(tab)MAPTAB=tab;if(MAPTAB==='lt'||MAP.kind==='road'&&!tab){return openLtMap()}
  const sc=Math.min(1.6,(Math.min(innerWidth,1000)-80)/W,(innerHeight*.66)/H);const w=Math.round(W*sc),h2=Math.round(H*sc);
  openModal(mHead('Ž',esc(MAP.name),'Click to set a waypoint. Coloured areas are gang territory.')+`<div class="mbody"><div class="row" style="margin-bottom:10px"><button class="chip on">${esc(MAP.name)}</button><button class="chip" onclick="openMap('lt')">Lietuva</button></div><div class="mapwrap"><canvas id="bigmap" width="${w*2}" height="${h2*2}" style="width:${w}px;height:${h2}px"></canvas></div><div class="legend" id="mleg"></div></div>`,true);
  const cvm=$('#bigmap'),g=cvm.getContext('2d');g.scale(sc*2,sc*2);g.imageSmoothingEnabled=false;g.drawImage(MMC,0,0);g.drawImage(OVC,0,0);
  g.textAlign='center';g.font=`700 ${11/sc}px "IBM Plex Sans",sans-serif`;STREETS.forEach(st=>{if(!st.name||st.rail)return;const p=st.pts[Math.floor(st.pts.length/2)];g.fillStyle='rgba(20,28,26,.7)';const tw=g.measureText(st.name).width+6/sc;g.fillRect(p[0]-tw/2,p[1]-8/sc,tw,13/sc);g.fillStyle='#fff';g.fillText(st.name,p[0],p[1]+2/sc)});
  if(MAP.kind==='city'){g.font=`800 ${13/sc}px "Big Shoulders Display",sans-serif`;DISTRICTS.filter(d=>d.city===MAP.id&&d.cnt).forEach(d=>{g.fillStyle='rgba(255,255,255,.85)';g.fillText(d.name.toUpperCase(),d.cx,d.cy)})}
  POIS.forEach(p=>{if(p.kind==='landmark'){g.fillStyle=P.landmarks[p.id]?'#E2A11B':'#fff';g.beginPath();g.arc(p.x/TS,p.y/TS,3/sc,0,7);g.fill()}else if(p.kind==='stop'){g.fillStyle=p.troll?'#B5332B':'#1F618D';g.fillRect(p.x/TS-2/sc,p.y/TS-2/sc,4/sc,4/sc)}
    else if(['bus','train','hospital','police','garage','market'].includes(p.kind)){g.fillStyle=POI_COL[p.kind]||'#26343A';g.fillRect(p.x/TS-3/sc,p.y/TS-3/sc,6/sc,6/sc)}});
  POIS.forEach(p=>{if(p.kind==='hq'||p.hq){g.fillStyle=FACTIONS[p.hq].color;g.fillRect(p.x/TS-4/sc,p.y/TS-4/sc,8/sc,8/sc)}});
  const mark=(x,y,col,r)=>{g.fillStyle=col;g.strokeStyle='#fff';g.lineWidth=2/sc;g.beginPath();g.arc(x/TS,y/TS,r/sc,0,7);g.fill();g.stroke()};
  {const h=POIS.find(q=>q.id===P.home);if(h){g.fillStyle='#E2A11B';g.fillRect(h.x/TS-5/sc,h.y/TS-5/sc,10/sc,10/sc)}}(G.biz||[]).forEach(id=>{const q=POIS.find(x=>x.id===id);if(q){g.fillStyle='#59B86A';g.fillRect(q.x/TS-4/sc,q.y/TS-4/sc,8/sc,8/sc)}});
  const qt=questTarget();if(qt)mark(qt.x,qt.y,'#B5332B',6);if(G.way&&(!G.way.map||G.way.map===MAP.id))mark(G.way.x,G.way.y,'#2D5DA8',6);mark(worldPos().x,worldPos().y,'#E2A11B',7);
  cvm.onclick=e=>{const r=cvm.getBoundingClientRect();const x=(e.clientX-r.left)/sc*TS,y=(e.clientY-r.top)/sc*TS;G.way={x,y,label:'Waypoint',map:MAP.id};openMap('city')};
  const used=[...new Set(DISTRICTS.filter(d=>d.city===MAP.id).map(d=>d.owner).filter(Boolean))];$('#mleg').innerHTML=used.map(k=>`<span><i style="background:${FACTIONS[k].color}"></i>${esc(FACTIONS[k].name)}</span>`).join('')+'<span><i style="background:#E2A11B"></i>Namai / tu</span><span><i style="background:#B5332B;border-radius:50%"></i>Tikslas</span><span><i style="background:#1F618D"></i>Stotelė</span><span><i style="background:#fff;border-radius:50%"></i>Lankytina vieta</span>'}
function openLtMap(){const w=Math.min(860,innerWidth-80),h2=Math.round(w*.76);
  openModal(mHead('LT','Lietuva','Towns and places. Travel from bus and train stations, by car at the edge of town, or with BlaBla and taxi from your phone.')+`<div class="mbody"><div class="row" style="margin-bottom:10px">${MAP.kind!=='road'?`<button class="chip" onclick="openMap('city')">${esc(MAP.name)}</button>`:''}<button class="chip on">Lietuva</button></div><div class="mapwrap"><canvas id="ltmap" width="${w*2}" height="${h2*2}" style="width:${w}px;height:${h2}px"></canvas></div>
    <p class="note">Visited: ${Object.keys(P.visited).filter(k=>PLACE(k)).map(k=>PLACE(k).name).join(', ')}</p></div>`,true);drawLithuania($('#ltmap'),MAP.kind==='road'?null:MAP.id)}
/* ---------- HUD ---------- */
const fmtTime=()=>{const m=Math.floor(G.time.min);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
function partOfDay(){const h=G.time.min/60;return h<5?'Naktis':h<11?'Rytas':h<17?'Diena':h<22?'Vakaras':'Naktis'}
function hudUpdate(){if(!G)return;const d=doyToDate(G.time.doy);$('#hDate').textContent=`${DAYS[G.time.dow]}, ${MONTHS[d.m]} ${d.d} d.`;
  $('#hHour').textContent=`${fmtTime()} · ${partOfDay()} · ${G.weather}`;$('#hSun').style.width=(G.time.min/1440*100)+'%';$('#hMoney').textContent=eur(P.money).replace('€','€ ');
  const f=myFac();$('#hRole').innerHTML=`<div class="rk" style="background:${f?f.color:'#56645F'}">${f?f.short[0]:P.age<13?'V':'—'}</div><div><b>${f?rankName(P.faction):P.age<13?'Vaikas':P.age<16?'Paauglys':'Pilietis'}</b><span>${f?esc(f.short):'be gaujos'} · ${cityById(P.city).name} · ${P.age} m.</span></div>`;
  const bars=[['Sveikata',P.hp/P.maxHp,'#B5332B'],['Energija',P.energy/100,'#E2A11B'],['Sotumas',P.food/100,'#1E6B4A'],['Nuotaika',P.mood/100,'#6B4FA0']];
  if(f){const tb=RANK_REP[rankTable(f)],ri2=rankIdx(P.faction),lo=tb[ri2],hi=tb[ri2+1];bars.push(['Reputacija',hi?(repOf(P.faction)-lo)/(hi-lo):1,f.color])}
  $('#hStats').innerHTML=bars.map(([n,v,c])=>`<div class="bar"><span>${n}</span><span class="tr"><i style="width:${clamp(v,0,1)*100}%;background:${c}"></i></span></div>`).join('')+
    (P.heat>0?`<div class="stars">Policija ${[1,2,3,4,5].map(i=>`<i class="${i<=Math.ceil(P.heat)?'on':''}">★</i>`).join('')}</div>`:'');
  renderTracker()}
function renderTracker(){const el=$('#hTrack');const M=G.mission;const S=questSteps();
  if(M){el.classList.remove('hidden');el.innerHTML=`<div class="qh"><span>Darbas</span><span>${M.timer!==undefined&&M.type!=='race'?Math.ceil(M.timer)+'s':''}</span></div><div class="qt">${esc(M.title)}</div><div class="qs">${esc(M.step||'')}</div>${M.target?(M.target.map&&M.target.map!==MAP.id?`<div class="qd">Važiuok: ${esc(PLACE(M.target.map).name)}</div>`:`<div class="qd">${esc(M.target.label||'')} · ${Math.round(dist(worldPos().x,worldPos().y,M.target.x,M.target.y)/TS*MPT)} m</div>`):''}`}
  else if(G.qi<S.length){const s=S[G.qi],t=s.tg&&s.tg();el.classList.remove('hidden');el.innerHTML=`<div class="qh"><span>${s.ch?esc(s.ch):'Istorija'}</span><span>${G.qi}/${S.length}</span></div><div class="qt">${esc(s.t)}</div><div class="qs">${esc(s.en)}</div>${t?`<div class="qd">${esc(t.name||t.label||'')} · ${Math.round(dist(worldPos().x,worldPos().y,t.x,t.y)/TS*MPT)} m</div>`:''}`}
  else el.classList.add('hidden')}
function questTarget(){const okm=t=>t&&(!t.map||t.map===MAP.id);if(G.mission){if(okm(G.mission.target))return G.mission.target;if(G.mission.target)return null}const S=questSteps();if(G.qi<S.length&&S[G.qi].tg){const t=S[G.qi].tg();if(t)return{x:t.x,y:t.y,label:t.name}}return G.way||null}
function renderHotbar(){const slots=['kibinas','kepta','ledai','bandage','spray','bat'];const extra=Object.keys(P.inv).filter(k=>!slots.includes(k)&&(ITEMS[k].food||ITEMS[k].energy)&&P.inv[k]>0);
  const list=[...slots.filter(k=>has(k)),...extra].slice(0,6);HOTBAR=list;
  $('#hotbar').innerHTML=[0,1,2,3,4,5].map(i=>{const k=list[i];return k?`<button class="slot full" title="${esc(ITEMS[k].n)}" onclick="useItem('${k}')"><span class="k">${i+1}</span>${ITEMS[k].ic}<span class="n">${k==='bat'?(P.gear.bat?'✓':''):P.inv[k]}</span></button>`:`<div class="slot"><span class="k">${i+1}</span></div>`}).join('')}
let HOTBAR=[];
function updateZone(){$('#minimap').classList.toggle('hidden',!!SCENE);if(SCENE){const el=$('#hZone');el.classList.remove('hidden');el.innerHTML=`<i style="background:#E2A11B"></i><b>${esc(SCENE.title)}</b> · ${esc(SCENE.sub)}`;return}const d=districtAt(P.x,P.y),c=cityAtPx(P.x,P.y),el=$('#hZone');
  if(d){const o=d.owner?FACTIONS[d.owner]:null;el.classList.remove('hidden');el.innerHTML=`<i style="background:${o?o.color:'#9CA79F'}"></i><b>${esc(d.name)}</b> · ${o?esc(o.name):'neutrali zona'}${G.events&&G.events.some(e=>!e.done&&e.d===d.id)?' · <b style="color:#ff8a7a">UNDER ATTACK</b>':''}`}
  else if(c){el.classList.remove('hidden');el.innerHTML=`<b>${esc(c.name)}</b>`}
  else if(MAP.kind!=='city'){el.classList.remove('hidden');el.innerHTML=`<b>${esc(MAP.name)}</b>`}else el.classList.add('hidden');
  $('#mmT').textContent=MAP.kind==='road'?roadName(MAP.from,MAP.to):MAP.name}
function nearHwy(){return MAP.kind==='road'?MAP.name:null}

/* ---------- interaction prompt ---------- */
let PROMPT=null;
function findPrompt(){
  if(SCENE)return findPromptI();
  if(P.inCar&&MAP.kind==='city'&&EXITS.some(e=>dist(e.x,e.y,P.x,P.y)<6*TS))return{key:'E',text:'Išvažiuoti iš miesto · leave town',fn:()=>openTravel('car')};
  if(P.inCar){const gp=POIS.find(q=>q.kind==='garage'&&dist(q.x,q.y,P.x,P.y)<80);if(gp&&Math.hypot(P.inCar.vx,P.inCar.vy)<40)return{key:'E',text:'Autoservisas · drive in (F išlipti)',fn:()=>poiMenu(gp)}}
  const ha=holdAction();if(ha)return{key:'E',text:ha.label,hold:ha};
  if(P.inCar){return{key:'F',text:'Išlipti · get out'}}
  let best=null,bd=46;
  POIS.forEach(p=>{const d=dist(p.x,p.y,P.x,P.y);if(d<bd){bd=d;best={key:'E',text:poiPrompt(p),fn:()=>openPOI(p)}}});
  for(const e of ENT.peds){if(e.ko>0||e.ride)continue;const d=dist(e.x,e.y,P.x,P.y);if(d<30&&d<bd){bd=d;best={key:'E',text:e.name?`${e.name}${e.special==='drip'?' · drabužiai':e.special==='baryga'?' · „ko reikia?“':''}`:'Kalbėti · talk',fn:()=>talkTo(e)}}}
  if(!best){const fp=funTalkDecor();if(fp)best=fp}
  if(!best){const ep=extraPrompt();if(ep)best=ep}
  const c=nearestCar(40);if(c&&!best)return{key:'F',text:c.owned!==undefined?`Sėsti · ${CARS[c.model].name}`:CARS[c.model].kind==='bike'?'Sėsti ant dviračio':P.age<16?'Per jaunas vairuoti':'Pavogti automobilį · steal',car:c};
  return best}
function poiPrompt(p){if(G&&HOURS[p.kind]&&!isOpen(p.kind))return (p.kind==='school'?p.name:{shop:'Parduotuvė',cafe:'Kavinė',bar:'Baras',market:'Turgus',office:'Verslo centras',gym:'Sporto klubas',garage:'Autoservisas',bus:'Autobusų stotis'}[p.kind]||p.name)+' · uždaryta';const m={fuel:'Degalinė',home:'Namai',shop:'Parduotuvė',kebab:'Kebabinė',cafe:'Kavinė',bus:'Autobusų stotis',garage:'Autoservisas',police:'Policija',hospital:'Ligoninė',gym:'Sporto klubas',market:'Turgus',office:'Verslo centras',bar:'Baras',school:p.name,hq:p.name,ferry:p.name,landmark:p.name};return m[p.kind]||p.name}
function talkTo(e){if(e.special||e.fac==='centras'||e.kind==='gang'&&e.fac&&FACTIONS[e.fac].maroz){if(specialTalk(e))return}if(e.talk>0)return;e.talk=4;let line;if(e.kind==='dog'){bubble(e,pick(['Au!','*vizgina uodegą*']));setMood(3);log(`You pet ${e.name}. Good dog. Geras šuo.`,'good');return}
  if(e.kind==='gang'){line=pick(TALK_GANG);const f=FACTIONS[e.fac];if(!P.faction&&P.age>=f.minAge){const hq=POIS.find(p=>p.hq===e.fac);if(hq){G.way={x:hq.x,y:hq.y,label:hq.name};log(`„Nori būti savas? Ateik į būstinę.“ <i>Want in? Come to HQ.</i> (waypoint set)`,'amb')}}}
  else if(e.kind==='police')line=['Laba diena. Viskas gerai?','Good afternoon. Everything OK?'];
  else if(e.kind==='school')line=e.fac===P.faction?['Labas! Eime į kiemą.','Hi! Let\'s go to the yard.']:['Ko čia atėjai?','What are you doing here?'];
  else if(e.kind==='kid')line=pick([['Nori pažaisti slėpynių?','Want to play hide and seek?'],['Mama neleidžia kalbėti su nepažįstamais.','Mum says don\'t talk to strangers.'],['Turiu 3 butelius!','I have 3 bottles!']]);
  else if(e.kind==='elder')line=pick([['Vaikeli, kur tavo kepurė?','Child, where is your hat?'],['Anksčiau buvo geriau.','It was better before.'],['Ar valgei šiandien?','Have you eaten today?']]);
  else line=pick(TALK_CIV);
  bubble(e,line[0]);log(`„${esc(line[0])}“ <i>${esc(line[1])}</i>`)}

/* =====================================================================
   AUDIO (tiny synth)
   ===================================================================== */
const SND={on:false,ctx:null,
 init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.5;this.master.connect(this.ctx.destination);
  this.eng=this.ctx.createOscillator();this.eng.type='sawtooth';this.engG=this.ctx.createGain();this.engG.gain.value=0;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=700;this.eng.connect(f);f.connect(this.engG);this.engG.connect(this.master);this.eng.start();
  this.sir=this.ctx.createOscillator();this.sir.type='triangle';this.sirG=this.ctx.createGain();this.sirG.gain.value=0;this.sir.connect(this.sirG);this.sirG.connect(this.master);this.sir.start()}catch(e){this.ctx=null}},
 tone(f,d,type,v){if(!this.on||!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type||'square';o.frequency.value=f;g.gain.value=(v||.15);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+d)},
 noise(d,v,fq){if(!this.on||!this.ctx)return;const b=this.ctx.createBuffer(1,this.ctx.sampleRate*d,this.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
  const s=this.ctx.createBufferSource();s.buffer=b;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fq||900;const g=this.ctx.createGain();g.gain.value=v||.3;s.connect(f);f.connect(g);g.connect(this.master);s.start()},
 blip(f){this.tone(f||800,.09,'square',.08)},coin(){this.tone(988,.08,'square',.07);setTimeout(()=>this.tone(1319,.12,'square',.07),70)},
 hit(v){this.noise(.12,v||.4,500)},whoosh(){this.noise(.08,.08,2500)},horn(){this.tone(392,.25,'sawtooth',.06);this.tone(494,.25,'sawtooth',.05)},
 door(){this.noise(.06,.2,300)},spray(){this.noise(.5,.12,4000)},alarm(){[0,200,400].forEach(t=>setTimeout(()=>this.tone(660,.15,'square',.08),t))},
 fanfare(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.tone(f,.18,'triangle',.12),i*110))},
 update(){if(!this.ctx)return;const t=this.ctx.currentTime;const sp=ENGINE.target;const inCar=P&&P.inCar&&CARS[P.inCar.model].kind!=='bike';
  this.eng.frequency.setTargetAtTime(48+sp*.28,t,.1);this.engG.gain.setTargetAtTime(this.on&&inCar&&!paused?.05+Math.min(.05,sp/8000):0,t,.1);
  const pol=P&&P.heat>0&&ENT.cars.some(c=>c.siren&&dist(c.x,c.y,P.x,P.y)<20*TS);this.sir.frequency.setTargetAtTime(700+Math.sin(t*5)*250,t,.05);this.sirG.gain.setTargetAtTime(this.on&&pol&&!paused?.025:0,t,.1)}};
const ENGINE={target:0};

/* =====================================================================
   SAVE / LOAD
   ===================================================================== */
const SAVE_KEY='lietuva-gyvenimas-v2';
function saveGame(quiet){if(!G)return;try{const p=Object.assign({},P);delete p.inCar;const cars=P.cars.map((oc,i)=>{const e=ownedCarEntity(i);if(e)oc.pos={x:e.x,y:e.y,ang:e.ang};return oc});p.cars=cars;
  p.x=worldPos().x;p.y=worldPos().y;p.map=MAP.kind==='road'?MAP.to:MAP.id;if(MAP.kind==='road'){p.x=null}
  localStorage.setItem(SAVE_KEY,JSON.stringify({G:Object.assign({},G,{p:undefined}),p,owners:DISTRICTS.map(d=>d.owner),decor:DECOR.filter(d=>d.k==='tag')}));if(!quiet)toast('💾','Išsaugota','Saved in this browser.')}catch(e){if(!quiet)log('Could not save in this browser (storage blocked).','bad')}}
function loadSaved(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null}catch(e){return null}}

/* =====================================================================
   CHARACTER CREATOR
   ===================================================================== */
const CR={sex:'m',name:'Lukas',surname:'Kazlauskas',sur:0,age:16,city:'vilnius',cls:'mid',parent:'office',job:'student',skin:SKINS[0],hair:HAIRS[0],outfit:'track',color:null,cap:true};
function chip(on,label,sub,fn,dis,big){const id='c'+Math.random().toString(36).slice(2,8);ACTS[id]=fn;return `<button class="chip ${big?'big':''} ${on?'on':''}" ${dis?'disabled':''} onclick="runAct('${id}');renderCreator()">${label}${sub?`<span class="sub">${sub}</span>`:''}</button>`}
function renderCreator(){const o=$('#opts');const okJobs=JOBS.filter(j=>CR.age>=j.min);if(!okJobs.some(j=>j.id===CR.job))CR.job=okJobs.length?okJobs[0].id:'student';
  CR.surname=CR.surname||SURN[CR.sur][CR.sex==='f'?1:0];
  let h=`<div class="sect"><h3>Vardas <small>Name. Surnames change with gender, as in Lithuanian.</small></h3><div class="names"><label>Vardas<input type="text" id="iName" value="${esc(CR.name)}"></label><label>Pavardė<input type="text" id="iSur" value="${esc(CR.surname)}"></label></div>
    <div class="row" style="margin-top:8px">${chip(CR.sex==='m','Vaikinas','Boy / man',()=>{CR.sex='m';CR.name=pick(NAMES.m);CR.surname=SURN[CR.sur][0]})}${chip(CR.sex==='f','Mergina','Girl / woman',()=>{CR.sex='f';CR.name=pick(NAMES.f);CR.surname=SURN[CR.sur][1]})}</div></div>`;
  h+=`<div class="sect"><h3>Amžius <small>Where your life begins</small></h3><div class="row">${AGES.map(a=>chip(CR.age===a.a,`<b class="g">${a.a} m. · ${a.t}</b>`,a.sub,()=>CR.age=a.a,false,true)).join('')}</div></div>`;
  h+=`<div class="sect"><h3>Miestas <small>Your home town</small></h3><div class="row">${CITIES.map(c=>chip(CR.city===c.id,`<b class="g">${c.name}</b>`,c.blurb,()=>CR.city=c.id,false,true)).join('')}</div></div>`;
  h+=`<div class="sect"><h3>Šeima <small>Family class: money, home and first car</small></h3><div class="row">${CLASSES.map(c=>chip(CR.cls===c.id,`<b class="g">${c.t}</b>`,`${c.en}. ${c.sub}`,()=>CR.cls=c.id,false,true)).join('')}</div></div>`;
  h+=`<div class="sect"><h3>Tėvų darbas <small>What your parents do</small></h3><div class="row">${PARENTS.map(c=>chip(CR.parent===c.id,`<b class="g">${c.t}</b>`,`${c.en}. ${c.sub}`,()=>CR.parent=c.id,false,true)).join('')}</div></div>`;
  if(CR.age>=13)h+=`<div class="sect"><h3>Užsiėmimas <small>What you do. Gangs and clubs you join later, in the game.</small></h3><div class="row">${JOBS.map(j=>chip(CR.job===j.id,`<b class="g">${j.t}</b>`,`${j.en}. ${j.sub}${CR.age<j.min?` (age ${j.min}+)`:''}`,()=>CR.job=j.id,CR.age<j.min,true)).join('')}</div></div>`;
  h+=`<div class="sect"><h3>Išvaizda <small>Look</small></h3><div class="row">${SKINS.map(s=>`<button class="sw ${CR.skin===s?'on':''}" style="background:${s}" aria-label="skin" onclick="CR.skin='${s}';renderCreator()"></button>`).join('')}</div>
    <div class="row" style="margin-top:8px">${HAIRS.map(s=>`<button class="sw ${CR.hair===s?'on':''}" style="background:${s}" aria-label="hair" onclick="CR.hair='${s}';renderCreator()"></button>`).join('')}</div>
    <div class="row" style="margin-top:8px">${OUTFITS.filter(x=>!x.shop).map(x=>chip(CR.outfit===x.id,x.t,'',()=>{CR.outfit=x.id;CR.color=null})).join('')}${chip(CR.cap,'Kepurė','cap',()=>CR.cap=!CR.cap)}</div></div>`;
  o.innerHTML=h;$('#iName').oninput=e=>{CR.name=e.target.value;drawPreview()};$('#iSur').oninput=e=>{CR.surname=e.target.value;drawPreview()};drawPreview()}
function drawPreview(){const c=$('#pcan'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);const city=cityById(CR.city);
  g.fillStyle='#E2E7DF';g.fillRect(0,0,c.width,c.height);g.font='900 150px "Big Shoulders Display",sans-serif';g.fillStyle='rgba(38,52,58,.08)';g.textAlign='center';g.fillText(city.code,200,190);
  g.fillStyle='#FDB913';g.fillRect(0,c.height-18,c.width,6);g.fillStyle='#006A44';g.fillRect(0,c.height-12,c.width,6);g.fillStyle='#C1272D';g.fillRect(0,c.height-6,c.width,6);
  const o=OUTFITS.find(x=>x.id===CR.outfit);const lk={skin:CR.skin,hair:CR.hair,female:CR.sex==='f',outfit:CR.color||o.col,stripe:o.stripe,cap:CR.cap?'#141414':null,pants:o.id==='suit'?'#2A3140':'#2C3440',scale:CR.age<10?.74:CR.age<15?.88:1,bag:CR.age<16?'#2D5DA8':null};
  drawPerson(g,200,350,lk,1,0,{big:5.2});
  const cls=CLASSES.find(x=>x.id===CR.cls),par=PARENTS.find(x=>x.id===CR.parent),job=JOBS.find(x=>x.id===CR.job);
  $('#cName').textContent=`${CR.name} ${CR.surname}`;
  $('#cSum').innerHTML=`<b>${CR.age} m.</b> · <b>${city.name}</b>. ${cls.en}, ${cls.home.toLowerCase()}.<br>Parents: <b>${par.en}</b>. ${CR.age>=13&&job?`You: <b>${job.en}</b>.`:'You: a kid with big plans.'}<br><i>${AGES.find(a=>a.a===CR.age).sub}</i>`}

/* =====================================================================
   START A LIFE
   ===================================================================== */
function newLife(){const ai=AGES.findIndex(a=>a.a===CR.age),cls=CLASSES.find(c=>c.id===CR.cls),c=cityById(CR.city);
  const sch=pick([0,1]);loadMap(CR.city);const b=chooseHome(CR.city,CR.cls);const hp=addPOI(c,'home','Namai',b,{});hp.id='home_'+CR.city;
  P={name:CR.name.trim()||'Lukas',surname:CR.surname.trim()||'Kazlauskas',sex:CR.sex,age:CR.age,city:CR.city,cls:CR.cls,parent:CR.parent,job:CR.age>=13?CR.job:'student',
    look:{skin:CR.skin,hair:CR.hair,outfit:CR.outfit,color:CR.color,cap:CR.cap},money:cls.money[ai],hp:100,maxHp:100+(CR.parent==='army'?25:0),energy:90,food:70,mood:60,heat:0,fight:CR.age>=16?3:CR.age>=13?2:1,
    faction:null,rep:{},school:'sch_'+CR.city+sch,inv:{kibinas:1},gear:{bat:false},cars:[],home:hp.id,homeB:b.id,visited:{},landmarks:{},stats:{},goals:{},
    x:hp.x,y:hp.y+18,dir:1,anim:0,punchCd:0,punchT:0,inv_t:0,hitFlash:0,bm:ri(0,11),bd:ri(1,28)};
  P.hp=P.maxHp;if(Math.random()<.6){const f=Math.random()<.5,age=Math.random()<.5?Math.max(4,P.age-ri(2,5)):P.age+ri(2,4);P.sib={f,age,name:(f?'Sesė ':'Brolis ')+pick(f?NAMES.f:NAMES.m)}}
  if(CR.parent==='gangster'){const gf=Object.keys(FACTIONS).find(k=>FACTIONS[k].city===CR.city&&FACTIONS[k].type==='gang')||'gopai';P.rep[gf]=40;P.dadGang=gf}
  G={v:1,time:{day:0,min:7*60,doy:243,dow:2},weather:'Giedra',qi:0,flags:{},mission:null,events:[],news:[],hist:[],skipped:0,attended:false,way:null};
  chron(`Born into a ${cls.en.toLowerCase()} family in ${c.name}.`);
  spawnStartVehicles();startGame(true)}
function spawnStartVehicles(){const cls=CLASSES.find(c=>c.id===P.cls);const h=POIS.find(p=>p.id===P.home);
  if(P.age<16&&!P.cars.some(c=>c.model==='bike'))P.cars.push({model:'bike',color:'#C0392B',tune:{},hp:100});
  if(P.age>=16&&!P.cars.some(c=>c.model!=='bike')){const m=P.parent==='mech'?(cls.car&&CARS[cls.car].price>2300?cls.car:'e36'):cls.car;if(m)P.cars.push({model:m,color:CARS[m].col,tune:{},hp:100})}
  P.cars.forEach((oc,i)=>{if(!oc.map)oc.map=P.city;if(oc.map!==MAP.id||ownedCarEntity(i))return;const hh=h||{x:P.x,y:P.y};let x,y,a=0;if(oc.pos){x=oc.pos.x;y=oc.pos.y;a=oc.pos.ang}else{[x,y]=freeSpotNear(hh.x+(i*40),hh.y+30,(t,X,Y)=>(oc.model==='bike'?WALKABLE[t]:DRIVE[t]||t===T.LOT)&&dist(X*TS,Y*TS,hh.x,hh.y)>24)}spawnOwnedCar(i,x,y,a)})}
function loadLife(s){s.owners.forEach((o,i)=>{if(DISTRICTS[i])DISTRICTS[i].owner=o});
  P=s.p;G=s.G;G.p=undefined;P.inCar=null;P.punchCd=0;P.punchT=0;P.inv_t=0;P.hitFlash=0;
  const m=P.map&&PLACE(P.map)?P.map:P.city;loadMap(m);ensureHome();
  if(P.x==null||!inb(tx(P.x),tx(P.y))||SOLID_FOOT[tileAt(tx(P.x),tx(P.y))]){const sp=arrivalSpot('bus');P.x=sp.x;P.y=sp.y}
  (s.decor||[]).filter(d=>!d.map||d.map===MAP.id).forEach(d=>DECOR.push(d));spawnStartVehicles();startGame(false)}
function startGame(isNew){refreshOverlay();$('#title').classList.add('hidden');$('#creator').classList.add('hidden');$('#hud').classList.remove('hidden');
  if(IS_PHONE||matchMedia('(pointer:coarse)').matches)$('#touch').classList.remove('hidden');
  running=true;WINTER=null;seasonCheck();setTimeout(()=>{syncCrew();syncDog()},50);LASTCITY=MAP.id;P.visited[P.city]=true;renderHotbar();hudUpdate();cam.x=P.x-VW/2/ZOOM;cam.y=P.y-VH/2/ZOOM;
  if(isNew){const c=cityById(P.city),cls=CLASSES.find(x=>x.id===P.cls);const sch=FACTIONS[P.school];
    const intro={6:`Tomorrow is your first day at ${sch.name}. Mum already bought the flowers for the teacher. Today the yard is yours: bottles to collect, a taromatas that pays 10 cents each, and an ice cream van somewhere.`,
      13:`Rugsėjo 1-oji. A new school year at ${sch.name}. The older kids say the ${FACTIONS[pick(Object.keys(FACTIONS).filter(k=>FACTIONS[k].city===P.city&&FACTIONS[k].type==='school'&&k!==P.school))||P.school].short} crowd are planning something. ${P.city==='vilnius'?'And everyone cool hangs out at the White Bridge.':''}`,
      16:`You are sixteen, which in ${c.name} means people start asking whose side you are on. The gangs want runners. The car clubs want drivers. Your parents want you to finish school.`,
      24:`You have your own place, your own money and nobody to answer to. ${c.name} is full of doors. Some of them lead to a desk job, some to a garage full of tyre smoke, some to people you should not trust.`,
      30:`Thirty. You know this town and this town knows you. The question is what you do with the next ten years.`};
    openModal(mHead(c.code,`${esc(P.name)} pradeda naują gyvenimą`,`„Kiemo žinios“ · ${DAYS[G.time.dow]}, rugsėjo 1 d.`)+`<div class="mbody scene"><p class="news">Kiemo žinios · ${c.name}</p><p>${intro[P.age]||intro[16]}</p>
      <p>${cls.en} family, ${cls.home.toLowerCase()}. ${P.cars.length?`Outside: your <b>${esc(CARS[P.cars[P.cars.length-1].model].name)}</b>.`:''} In your pocket: <b>${eur(P.money)}</b>.</p>
      <p class="note">E talk / enter · F vehicle · J punch · Space handbrake · M map · Q quests · T phone (jobs). All gangs, crews and clubs are fictional.</p></div><div class="mfoot"><button class="btn amber" onclick="closeModal()">Pradėti dieną</button></div>`)}
  saveGame(true)}
