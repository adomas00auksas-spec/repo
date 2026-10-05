
/* =====================================================================
   PEOPLE — marozai, centriniai, barygos, the Rėksnys, the Night Bat,
   angry people, tourists, metalistai, skaters and the rapper-clothes
   seller at the White Bridge. All fictional; the two "famous" characters
   are parodies, not real people.
   ===================================================================== */
const RU=(ru,lt)=>[ru,lt];
const MAROZ_LINES=[RU('Слышь, пацан, есть закурить?','Klausyk, vaike, turi parūkyt?'),RU('Чё смотришь?','Ko žiūri?'),RU('С какого района?','Iš kurio rajono?'),RU('Деньги есть?','Pinigų turi?'),
 RU('Ну чё, пацаны, по семкам?','Nu ką, vyrai, saulėgrąžų?'),RU('Давай, давай, иди отсюда.','Nu, nu, eik iš čia.'),RU('Братан, это наш двор.','Broli, čia mūsų kiemas.'),RU('Ты чё, умный?','Ką, protingas?')];
const CENTRAS_LINES=[['Žiauriai kietas bitas, klausyk.','This beat is insane, listen.'],['Eime į kebabinę?','Kebab?'],['Kas turi parūkyt?','Who has a smoke?'],['Marozai vėl prie tilto lindo…','Marozai were hanging round the bridge again…'],
 ['Mano naujas drip, matai?','See my new drip?'],['Rytoj koncertas Vingyje!','Concert in Vingis tomorrow!'],['Feikas, bičas, feikas.','That\'s fake, dude, fake.']];
const METAL_LINES=[['\\m/ Metalas amžinas!','Metal is eternal!'],['Marozai vėl kabinėjosi…','The marozai were picking on us again…'],['Šįvakar „Devilstone“ koncertas.','Concert tonight.']];
const TOURIST_LINES=[['Excuse me, where is the Gate of Dawn?','Atsiprašau, kur Aušros Vartai?'],['Entschuldigung, wo ist die Kathedrale?','Kur katedra?'],['Is this the famous Užupis?','Ar čia tas garsusis Užupis?'],['Where can I eat cepelinai?','Kur pavalgyti cepelinų?']];
const REKSNYS_LINES=[['Ko čia stovi?! Čia mano stotelė!','Why are you standing here?! This is my bus stop!'],['Visi jūs vienodi!','You are all the same!'],['Aš čia gyvenu nuo 1987-ųjų!','I\'ve lived here since 1987!'],
 ['Policija nieko nedaro!','The police do nothing!'],['Kas čia per muzika?! Išjunk!','What is this music?! Turn it off!'],['Ей, ты! Да, ты! Иди сюда!','Hey, you! Yes, you! Come here!'],['Valdžia kalta! Viskas brangsta!','The government\'s fault! Everything costs more!'],
 ['Jaunimas dabar… telefonai, telefonai!','Young people now… phones, phones!'],['Aš tau parodysiu, kas čia šeimininkas!','I\'ll show you who\'s boss here!']];
const BAT_LINES=[['Aš – Naktinis Šikšnosparnis. Mieste ramu?','I am the Night Bat. Is the city quiet?'],['Teisingumas niekada nemiega. Aš irgi. Rytoj į darbą 8:00.','Justice never sleeps. Neither do I. Work at 8 tomorrow.'],
 ['Policija – mano draugai. Jie nežino, bet draugai.','The police are my friends. They don\'t know it yet.'],['Mama sakė grįžti iki pusiaunakčio.','Mum said to be home by midnight.']];
const ANGRY_LINES=[['Ko čia stovi kelyje?!','Why are you standing in the way?!'],['Ar tu aklas?!','Are you blind?!'],['Jaunimas…','Young people…'],['Žiūrėk, kur eini!','Watch where you\'re going!'],['Eilė, ponia, čia eilė!','There\'s a queue, madam!']];

/* ---------- style ---------- */
const REP_ITEMS=[
 {id:'hoodie',t:'Oversized džemperis „Drip“',en:'Huge hoodie, any colour',price:45,fake:18},
 {id:'baggy',t:'Platūs džinsai',en:'Baggy jeans down to the ground',price:35},
 {id:'bucket',t:'Panamos kepurė',en:'Bucket hat',price:20},
 {id:'bandana',t:'Bandana',en:'Bandana on the forehead',price:8},
 {id:'chunky',t:'Balti „Air“ sportbačiai',en:'Chunky white sneakers',price:90,fake:25},
 {id:'silver',t:'Sidabrinė grandinė',en:'Silver chain. Marozai love these too',price:60},
 {id:'print',t:'Marškinėliai su užrašu',en:'T-shirt with a big print',price:15},
];
function styleOf(){const L=P.look||{};const o=L.outfit;let rep=(L.hoodie?1:0)+(L.baggy?1:0)+(L.bucket?1:0)+(L.bandana?1:0)+(L.chunky?1:0)+(L.print?1:0);
  const maroz=(o==='track'?2:0)+(L.silver?1:0)+(L.cap?1:0)-(L.hoodie?1:0);if(maroz>=3)return'maroz';if(rep>=2)return'rep';if(o==='suit')return'office';if(o==='jacket'&&L.color==='#1E1F22')return'metal';return'normal'}
const STYLE_NAME={maroz:'Marozo stilius',rep:'Repo stilius',office:'Biuro stilius',metal:'Metalisto stilius',normal:'Paprastas'};
function applyStyle(lk){const L=P.look||{};if(L.hoodie){lk.hoodie=true;lk.outfit=L.hoodieCol||lk.outfit;lk.stripe=false}if(L.baggy){lk.baggy=true;lk.pants='#3F5E86'}if(L.bucket)lk.bucket=L.bucketCol||'#1D1F22';
  if(L.bandana)lk.bandana='#B5332B';if(L.chunky)lk.chunky=true;if(L.silver&&!L.chain){lk.chain=true;lk.chainCol='#D9DCDD'}if(L.print)lk.print='#E2A11B';if(L.bucket)lk.cap=null;return lk}
function openRepShop(){P.owned=P.owned||{};const cols=['#1D1F22','#E9E6DA','#6B4FA0','#3FA7D6','#59B86A','#E0458A','#E2A11B'];
  let h=mHead('DRIP','Dominyko „Drip“ prekės','Rapper clothes from the Centras crew. Real or feikas, your choice.')+`<div class="mbody"><p class="note">Your style now: <b>${STYLE_NAME[styleOf()]}</b>. Centriniai respect repo stilius, marozai laugh at it (and the other way round).</p>`;
  REP_ITEMS.forEach(it=>{const own=P.owned['rep_'+it.id];const on=!!(P.look[it.id]);
    if(own)h+=act(it.t,it.en+(P.owned['fake_'+it.id]?' · <span class="pill r">feikas</span>':''),on?'Nusiimti':'Dėvėti',()=>{P.look[it.id]=!on;openRepShop()});
    else h+=`<div class="act"><div class="at"><b>${esc(it.t)}</b><div>${esc(it.en)}</div></div><div style="display:flex;gap:6px"><button class="btn sm green" onclick="buyRep('${it.id}',0)">${eur(it.price)}</button>${it.fake?`<button class="btn sm ghost" onclick="buyRep('${it.id}',1)">Feikas ${eur(it.fake)}</button>`:''}</div></div>`});
  if(P.owned.rep_hoodie)h+='<div class="row" style="margin:6px 0 12px">'+cols.map(c=>`<button class="sw" style="background:${c}" aria-label="hoodie colour" onclick="P.look.hoodieCol='${c}';openRepShop()"></button>`).join('')+'</div>';
  openModal(h+'</div>')}
function buyRep(id,fake){const it=REP_ITEMS.find(x=>x.id===id);if(!pay(fake?it.fake:it.price))return;P.owned['rep_'+id]=true;if(fake)P.owned['fake_'+id]=true;P.look[id]=true;
  if(id==='bucket')P.look.cap=false;log(`${it.t}${fake?' (feikas)':''}. ${fake?'Hope nobody notices…':'Drip.'}`,'good');setMood(5);openRepShop()}

/* ---------- special NPCs (spawned per map) ---------- */
function spawnSpecial(kind,x,y,extra){const lk=randomLook('civ');const e=spawnPed('civ',x,y,null,Object.assign({special:kind,keep:true,talkCd:0},extra||{}));e.lk=Object.assign(lk,extra&&extra.look||{});return e}
function specialsTick(dt){if(SCENE||!G)return;const h=G.time.min/60,city=MAP.kind==='city'?MAP.id:null;
  const has=k=>ENT.peds.some(e=>e.special===k);const near=(p,r)=>dist(p.x,p.y,P.x,P.y)<r*TS;
  // centriniai at the White Bridge (Vilnius) or Laisvės alėja (Kaunas), evenings
  const hang=city==='vilnius'?POIS.find(p=>p.hq==='centras'):city==='kaunas'?POIS.find(p=>p.name==='Laisvės alėja'||p.name.startsWith('Šv. Arkangelo')):null;
  if(hang&&(h>=15||h<2)&&near(hang,35)&&!has('centras')){for(let k=0;k<8;k++){const t=nearestTile(tx(hang.x)+ri(-6,6),tx(hang.y)+ri(-4,6),t=>WALKABLE[t]);if(!t)continue;
      const e=spawnPed('gang',t[0]*TS+16,t[1]*TS+16,'centras',{special:'centras',keep:true,idle:true});e.lk=applyRepLook(e.lk);if(k%3===0)e.lk.smoke=true;if(k%4===1)e.lk.bottle=true;if(k%4===2)e.lk.skate=true}
    const t=nearestTile(tx(hang.x)+3,tx(hang.y)+2,t=>WALKABLE[t]);if(t){const s=spawnSpecial('drip',t[0]*TS+16,t[1]*TS+16,{name:'Dominykas „Drip“'});s.lk=applyRepLook(s.lk);s.lk.chain=true;s.lk.chainCol='#E2B63A';s.idle=true}}
  if(hang&&!(h>=15||h<2)&&has('centras'))ENT.peds=ENT.peds.filter(e=>e.special!=='centras'&&e.special!=='drip');
  // barygos at night near garages, lots and the bridge
  if(city&&(h>=20||h<4)&&!has('baryga')&&Math.random()<.02){const t=randomTileNear(P.x,P.y,10,22,(t,x,y)=>WALKABLE[t]&&(tileAt(x,y-1)===T.BUILD||t===T.LOT));if(t){const e=spawnSpecial('baryga',t[0]*TS+16,t[1]*TS+16,{name:'Baryga',look:{outfit:'#1D1F22',hoodie:true,pants:'#1D1F22',cap:'#111'}});e.idle=true}}
  if(!(h>=20||h<4))ENT.peds=ENT.peds.filter(e=>e.special!=='baryga');
  // Rajono Rėksnys (Vilnius, daytime) and the Night Bat
  if(city==='vilnius'&&h>=9&&h<20&&!has('reksnys')&&G.flags.reksT!==G.time.day&&Math.random()<.02){
    const t=randomTileNear(P.x,P.y,12,20,t=>WALKABLE[t]);if(t){spawnSpecial('reksnys',t[0]*TS+16,t[1]*TS+16,{name:'Rajono Rėksnys',sp:60,look:{outfit:'#6B5B4B',hair:'#9A9A9A',cap:'#3B3F45',pants:'#3B3F45',scale:1}});G.flags.reksT=G.time.day}}
  if(city&&(h>=20||h<3)&&!has('bat')&&(city==='vilnius'||Math.random()<.002)&&Math.random()<.03){const t=randomTileNear(P.x,P.y,12,20,t=>WALKABLE[t]);if(t)spawnSpecial('bat',t[0]*TS+16,t[1]*TS+16,{name:'Naktinis Šikšnosparnis',hp:150,sp:70,look:{outfit:'#1D1F22',pants:'#1D1F22',cape:true,mask:true,hair:'#1D1F22',vest:'#E2A11B',scale:1.02}})}
  if(!(h>=20||h<3))ENT.peds=ENT.peds.filter(e=>e.special!=='bat');
  // tourists in old towns, metalistai at the cathedral, skaters
  const D=districtAt(P.x,P.y);if(D&&D.type==='old'&&h>=9&&h<21&&ENT.peds.filter(e=>e.special==='tourist').length<3&&Math.random()<.05){const t=randomTileNear(P.x,P.y,10,22,t=>WALKABLE[t]);if(t){const e=spawnSpecial('tourist',t[0]*TS+16,t[1]*TS+16,{keep:false,look:{outfit:pick(['#E8E1D2','#6FA8DC','#E06666']),cap:pick([null,'#E8E1D2']),bag:'#8C6A3C'}});e.lines=TOURIST_LINES}}
  if(city==='vilnius'&&h>=17&&h<23&&!has('metal')){const cat=POIS.find(p=>p.name==='Vilniaus katedra');if(cat&&near(cat,30))for(let k=0;k<4;k++){const t=nearestTile(tx(cat.x)+8+ri(-3,3),tx(cat.y)+ri(-2,3),t=>WALKABLE[t]);if(t){const e=spawnSpecial('metal',t[0]*TS+16,t[1]*TS+16,{look:{outfit:'#141414',pants:'#141414',longHair:true,hair:pick(['#1E1A18','#4A2F1E','#8A5A32']),print:'#B5332B'}});e.lines=METAL_LINES;e.idle=true}}}
  // marozai squat by the kiosks and blocks
  ENT.peds.forEach(e=>{if(e.kind==='gang'&&e.fac&&FACTIONS[e.fac].maroz&&!e.mzLook){e.mzLook=true;e.lk.stripe=true;e.lk.chain=Math.random()<.7;e.lk.chainCol='#D9DCDD';e.lk.cap=Math.random()<.7?'#141414':null;e.squat=Math.random()<.5}});
  marozEncounter();reksnysTick(dt);batTick(dt)}
function applyRepLook(lk){lk.hoodie=true;lk.outfit=pick(['#1D1F22','#E9E6DA','#6B4FA0','#3FA7D6','#59B86A','#E0458A']);lk.baggy=Math.random()<.6;if(lk.baggy)lk.pants='#3F5E86';lk.chunky=true;
  if(Math.random()<.4)lk.bucket=pick(['#1D1F22','#E9E6DA','#E2A11B']);else if(Math.random()<.3)lk.bandana='#B5332B';lk.cap=null;lk.stripe=false;lk.vest=null;lk.scale=.94;return lk}

/* ---------- marozai stop you in the street ---------- */
function marozEncounter(){if(P.age<13||P.inCar||SCENE||!$('#modal').classList.contains('hidden'))return;if(G.flags.mzT&&now()<G.flags.mzT)return;
  const mf=myFac();const m=ENT.peds.find(e=>e.kind==='gang'&&e.fac&&FACTIONS[e.fac].maroz&&e.fac!==P.faction&&!e.hostile&&!e.angry&&!(e.ko>0)&&dist(e.x,e.y,P.x,P.y)<5*TS);if(!m)return;
  if(!m.approach){m.approach=true;m.squat=false;bubble(m,'Ей, пацан!');return}
  const a=Math.atan2(P.y-m.y,P.x-m.x);if(dist(m.x,m.y,P.x,P.y)>40){moveCircle(m,Math.cos(a)*6,Math.sin(a)*6,7,SOLID_FOOT);m.anim+=.3;return}
  G.flags.mzT=now()+rnd(70,140);m.approach=false;const st=styleOf();const line=st==='rep'?RU('Ты чё, репер? Есть закурить?','Ką, reperis? Turi parūkyt?'):MAROZ_LINES[0];
  const fr=FACTIONS[m.fac];const friends=ENT.peds.filter(e=>e.fac===m.fac&&dist(e.x,e.y,m.x,m.y)<5*TS);const respect=P.respect||0;
  const fail=(msg)=>{log(msg,'bad');friends.forEach(e=>{e.angry=true;e.attacker=true})};const pass=(msg,rs)=>{log(msg,'good');P.respect=respect+(rs||0);setMood(rs?3:0)};
  choice('RU',`${fr.short} prie kiosko`,`A marozas in an Adidas tracksuit and a silver chain blocks your way, spitting sunflower seeds: <b>„${line[0]}“</b><br><i>„${line[1]}“</i>${friends.length>1?`<br>${friends.length-1} more squat behind him.`:''}`,[
   {l:'„Nerūkau.“',fn:()=>{const c=.45+(st==='maroz'?.3:0)-(st==='rep'?.2:0)+P.fight*.03+respect*.01;if(Math.random()<c)pass('„Ну ладно, иди.“ He lets you pass.',1);else{P.money=Math.max(0,P.money-5);log('„Тогда давай деньги.“ They take €5 off you.','bad');setMood(-6)}}},
   {l:'Rusiškai: „Нет, братан, сам ищу.“',fn:()=>{const c=.55+(st==='maroz'?.3:0)-(st==='rep'?.15:0)+respect*.01;if(Math.random()<c){pass('„Нормальный пацан.“ He even offers you seeds.',3);if(mf&&mf.league==='street')gainRep(P.faction,2)}else fail('„Ты чё, умный?“ It turns into a fight!')}},
   {l:'Ant bazaro: „Ko kabinėjiesi?“',fn:()=>{const strong=P.fight>=5||crewList().length>0||ENT.peds.some(e=>e.kind==='dog');if(strong&&Math.random()<.75)pass('They look at you, look at each other, and step back. Respect.',5);else fail('„Ну всё, тебе конец.“ Fight!')}},
   {l:'Duoti €2',fn:()=>{if(P.money>=2){P.money-=2;setMood(-3);log('„Нормально.“ They let you go, €2 poorer.','amb')}else fail('No money? They get angry.')}},
   {l:'Bėgti!',fn:()=>{P.energy=Math.max(0,P.energy-10);friends.forEach(e=>{e.angry=true;e.state='wander'});log('You sprint off. They chase you for a bit (hold Shift).','amb')}}])}

/* ---------- Rajono Rėksnys ---------- */
function reksnysTick(dt){const r=ENT.peds.find(e=>e.special==='reksnys');if(!r)return;r.talkCd-=dt;const d=dist(r.x,r.y,P.x,P.y);
  if(d<9*TS&&d>36&&!P.inCar){const a=Math.atan2(P.y-r.y,P.x-r.x);moveCircle(r,Math.cos(a)*55*dt,Math.sin(a)*55*dt,7,SOLID_FOOT);r.anim+=dt*8;r.dir=Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?0:2):(Math.sin(a)>0?1:3)}
  if(d<8*TS&&r.talkCd<=0){r.talkCd=rnd(3,5);const l=pick(REKSNYS_LINES);bubble(r,l[0]);if(d<5*TS)log(`Rėksnys: „${esc(l[0])}“ <i>${esc(l[1])}</i>`)}}
function reksnysTalk(r){choice('!!','Rajono Rėksnys','A man in a grey cap has been shouting at the whole street for an hour. Now he points at you. <b>„Tu! Ko čia stovi?!“</b><br><span class="note">(A parody character. Any resemblance is a coincidence.)</span>',[
  {l:'Ginčytis',fn:()=>wordBattle(r)},
  {l:'Filmuoti telefonu',fn:()=>{P.followers=(P.followers||0)+ri(20,80);log(`The video gets ${ri(2,40)}k views. Followers: ${P.followers}.`,'good');r.angry=Math.random()<.4;bubble(r,'Išjunk telefoną!!!')}},
  {l:has('kebabas')?'Duoti kebabą':'Ignoruoti',fn:()=>{if(has('kebabas')){give('kebabas',-1);bubble(r,'…Nu. Ačiū.');log('He calms down and tells you a rumour: „'+esc(G.news[0]||'In Naujininkai the marozai are fighting with the cartel.')+'“','amb');P.money+=5;ENT.peds=ENT.peds.filter(e=>e!==r)}else log('You walk on. He keeps shouting behind you.','amb')}}])}
function wordBattle(r){const rounds=[[['„Nuo 1987-ųjų čia gyvenu!“','„I\'ve lived here since 1987!“'],['Ir per 37 metus neišmokai šypsotis?','And in 37 years you never learned to smile?',2],['Aš irgi čia gyvenu.','I live here too.',1],['Atsiprašau…','Sorry…',0]],
  [['„Jaunimas dabar tik telefonuose!“','„Young people are just on their phones!“'],['O jūs – tik ant gatvės.','And you\'re just on the street.',2],['Telefonas – mano darbas.','My phone is my job.',1],['Tiesa…','True…',0]],
  [['„Policija nieko nedaro!“','„The police do nothing!“'],['Tai paskambinkit jiems, numeris 112.','So call them, the number is 112.',2],['Gal jie pavargo nuo jūsų.','Maybe they are tired of you.',1],['Mhm.','Mhm.',0]]];
  let i=0,score=0;const next=()=>{if(i>=rounds.length){const win=score>=4;choice(win?'🏆':'…',win?'Laimėjai ginčą':'Pralaimėjai ginčą',win?'„Nu tu ir kietas…“ The Rėksnys goes quiet for the first time in years. A crowd claps.':'He shouts louder. You give up.',[{l:'Gerai',fn:()=>{if(win){setMood(12);P.followers=(P.followers||0)+50;P.respect=(P.respect||0)+3;ENT.peds=ENT.peds.filter(e=>e!==r)}else setMood(-5)}}]);return}
    const R=rounds[i];choice('!!','Ginčas su Rėksniu',`<b>${R[0][0]}</b><br><i>${R[0][1]}</i>`,R.slice(1).map(o=>({l:o[0],fn:()=>{score+=o[2];i++;next()}})))};next()}

/* ---------- Naktinis Šikšnosparnis ---------- */
function batTick(dt){const b=ENT.peds.find(e=>e.special==='bat');if(!b||b.ko>0)return;b.talkCd-=dt;const d=dist(b.x,b.y,P.x,P.y);
  let tgt=null;if(P.heat>0&&d<12*TS)tgt=P.inCar||P;const foe=ENT.peds.find(o=>o.hostile&&o.kind!=='police'&&!(o.ko>0)&&dist(o.x,o.y,P.x,P.y)<4*TS);if(!tgt&&foe)tgt=foe;
  if(tgt){const a=Math.atan2(tgt.y-b.y,tgt.x-b.x),dd=dist(tgt.x,tgt.y,b.x,b.y);if(dd>24){moveCircle(b,Math.cos(a)*145*dt,Math.sin(a)*145*dt,7,SOLID_FOOT);b.anim+=dt*12;b.dir=Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?0:2):(Math.sin(a)>0?1:3)}
    else if(tgt===P||tgt===P.inCar){BUST.t+=dt*.5;if(b.talkCd<=0){b.talkCd=3;bubble(b,'Stok, piliete! Policija jau važiuoja!')}}
    else{b.cd=(b.cd||0)-dt;if(b.cd<=0){b.cd=1;b.punch=.2;tgt.hp-=14;fxBurst(tgt.x,tgt.y-20,'#E2A11B');if(tgt.hp<=0)knockOut(tgt,false);if(b.talkCd<=0){b.talkCd=3;bubble(b,'Teisingumas atėjo!')}}}}
  else if(d<6*TS&&b.talkCd<=0){b.talkCd=rnd(6,10);bubble(b,pick(BAT_LINES)[0])}}
function batTalk(b){const step=G.flags.batStep||0;const quests=[
  {t:'Patrulis',en:'Walk with me to three corners of the district. Justice needs witnesses.',start:()=>startBatPatrol()},
  {t:'Dviračio vagis',en:'Someone stole a kid\'s bike nearby. Catch the thief!',start:()=>startBatThief()},
  {t:'Pamesta piniginė',en:'A grandmother lost her wallet in the park. Find it and bring it back.',start:()=>startBatWallet()}];
  const l=pick(BAT_LINES);const q=quests[step%3];
  choice('🦇','Naktinis Šikšnosparnis',`A forty-something man in a home-made cape and a mask with ears salutes you. <b>„${l[0]}“</b><br><i>${l[1]}</i><br><span class="note">(A parody character, not a real person.)</span>${P.heat>0?'<br><b>He frowns: „Tu… ieškomas.“</b>':''}`,[
   {l:`Užduotis: ${q.t}`,fn:()=>{if(G.mission){log('Finish your current job first.','bad');return}if(P.heat>0){log('„Pirmiau susitvarkyk su policija.“','bad');return}q.start()}},
   {l:'Nusifotografuoti',fn:()=>{P.followers=(P.followers||0)+15;setMood(5);log('Selfie with the Night Bat. Instant classic.','good')}},
   {l:'Viso gero',fn:()=>{}}])}
function batDone(){G.flags.batStep=(G.flags.batStep||0)+1;P.karma=(P.karma||0)+5;if(G.flags.batStep===3){toast('🦇','Šikšnosparnio padėjėjas','The police start nodding at you on the street.');chron('Became the Night Bat\'s sidekick.')}}
function startBatPatrol(){const pts=[];for(let k=0;k<3;k++){const t=randomTileNear(P.x,P.y,10,22,t=>WALKABLE[t]);if(t)pts.push({x:t[0]*TS+16,y:t[1]*TS+16,label:'Kampas '+(k+1)})}if(!pts.length)return;
  G.mission={type:'batpatrol',title:'Patrulis su Šikšnosparniu',list:pts,i:0,target:pts[0],step:'Walk to the corners',pay:15,rep:0,custom:true}}
function startBatThief(){const t=randomTileNear(P.x,P.y,10,18,t=>WALKABLE[t]);if(!t)return;const th=spawnPed('civ',t[0]*TS+16,t[1]*TS+16,null,{special:'thief',keep:true,hp:30,sp:90,name:'Vagis'});th.lk.outfit='#3B3F45';th.lk.cap='#111';
  G.mission={type:'batthief',title:'Dviračio vagis',target:{x:th.x,y:th.y,label:'Vagis'},th,step:'Catch the bike thief (knock him over)',pay:20,custom:true}}
function startBatWallet(){const t=randomTileNear(P.x,P.y,10,26,t=>t===T.PARK||t===T.YARD);if(!t)return;ENT.pickups.push({k:'wallet',x:t[0]*TS+16,y:t[1]*TS+16,keep:true});
  const g2=randomTileNear(P.x,P.y,6,12,t=>WALKABLE[t]);const gr=spawnPed('elder',g2[0]*TS+16,g2[1]*TS+16,null,{special:'granny',keep:true,name:'Močiutė Aldona'});gr.idle=true;
  G.mission={type:'batwallet',title:'Pamesta piniginė',target:{x:t[0]*TS+16,y:t[1]*TS+16,label:'Piniginė'},gr,step:'Find the wallet in the park',pay:10,custom:true}}
function tickCustomMission(dt){const M=G.mission;if(!M||!M.custom)return;const at=t=>t&&dist(P.x,P.y,t.x,t.y)<40;
  if(M.type==='batpatrol'&&at(M.target)){M.i++;SND.blip(900);if(M.i>=M.list.length){missionDone('„Miestas saugus.“');batDone()}else{M.target=M.list[M.i];M.step=`Corners: ${M.i}/3`}}
  if(M.type==='batthief'){const th=M.th;if(th.ko>0||th.dead){missionDone('You returned the bike.');batDone();th.keep=false}else{M.target.x=th.x;M.target.y=th.y;const a=Math.atan2(th.y-P.y,th.x-P.x);if(dist(th.x,th.y,P.x,P.y)<6*TS)moveCircle(th,Math.cos(a)*90*dt,Math.sin(a)*90*dt,7,SOLID_FOOT)}}
  if(M.type==='batwallet'){if(has('wallet')&&!M.found){M.found=true;M.target={x:M.gr.x,y:M.gr.y,label:'Močiutė Aldona'};M.step='Return the wallet'}if(M.found&&at(M.target)){give('wallet',-1);bubble(M.gr,'Ačiū, vaikeli! Dievas tave laimina.');missionDone('Grandma gives you a hug.');batDone();M.gr.keep=false}}}

/* ---------- barygos ---------- */
Object.assign(ITEMS,{cigs:{n:'Kontrabandinės cigaretės',en:'Smuggled cigarettes. Bad for your lungs, illegal to sell',ic:'🚬',price:0,mood:6,smoke:1},
 alus:{n:'Pigus alus',en:'Cheap beer. You will regret it tomorrow',ic:'🍺',price:0,mood:10,drink:1},
 samane:{n:'Samanė',en:'Home-made spirits. A very bad idea',ic:'🫙',price:0,mood:14,drink:2},
 vphone:{n:'„Pigus“ telefonas',en:'Probably stolen. Better camera, worse conscience',ic:'📱',price:0,tool:true},
 wallet:{n:'Piniginė',en:'Someone\'s lost wallet',ic:'👛',price:0},
 laikrastis:{n:'Laikraštis',en:'Today\'s paper',ic:'📰',price:1.2,read:1},
 kramtomoji:{n:'Kramtomoji guma',en:'Chewing gum',ic:'🍬',price:.8,mood:2}});
function barygaTalk(b){const minor=P.age<18;let h=mHead('?!','Baryga','A guy in a hood looks around before talking. „Ko reikia?“')+`<div class="mbody"><p class="note">Everything here is illegal or a bad idea. Police raids happen. Health effects are real (in the game).</p>`;
  const offers=[['cigs',3,'Pakelis iš Baltarusijos'],['alus',2,'Šiltas, bet pigus'],['samane',5,'Iš kaimo, „švari kaip ašara“'],['vphone',60,'„Radau.“ Sure you did'],['chunky_fake',25,'Feik „Air“ sportbačiai']];
  offers.forEach(([id,pr,sub])=>{const it=id==='chunky_fake'?{n:'Feik „Air“ sportbačiai',ic:'👟'}:ITEMS[id];h+=act(`${it.ic} ${it.n}`,sub+(minor&&(id==='alus'||id==='samane')?' · they sell to anyone':''),eur(pr),()=>{if(P.age<13){log('„Eik namo, vaike.“ Even the baryga has limits.','bad');return}buyBaryga(id,pr)})});
  openModal(h+'</div>')}
function buyBaryga(id,pr){if(!pay(pr))return;if(Math.random()<.12){choice('🚓','Reidas!','Plain-clothes police jump out of a car: „Policija! Rankas!“',[{l:'Bėgti',fn:()=>{crime(2,'Buying from a baryga')}},{l:'Pasiduoti',fn:()=>{P.money=Math.max(0,P.money-50);log('€50 fine and the goods confiscated.','bad')}}]);return}
  if(Math.random()<.1){log('You open the bag at home: empty packet. The baryga scammed you.','bad');closeModal();return}
  if(id==='chunky_fake'){P.owned=P.owned||{};P.owned.rep_chunky=true;P.owned.fake_chunky=true;P.look.chunky=true;log('Fake sneakers. They squeak.','amb')}else give(id,1);closeModal()}
function vice(it){if(it.smoke){P.nicotine=(P.nicotine||0)+12;P.lungs=(P.lungs||0)+1;if(P.lungs%4===0){P.maxHp=Math.max(60,P.maxHp-1);log('Your lungs feel it. Max health −1.','bad')}}
  if(it.drink){P.drunk=(P.drunk||0)+40*it.drink;P.energy=Math.max(0,P.energy-8*it.drink);G.flags.hangover=G.time.day+1;if(P.age<18)G.flags.parentsKnow=(G.flags.parentsKnow||0)+1}
  if(P.age<18&&(it.smoke||it.drink)&&Math.random()<.35){const p=PARENTS.find(x=>x.id===P.parent);log(`${p.id==='army'||p.id==='gangster'||p.id==='mech'?'Tėtis':'Mama'} smelled it on you. „Ar tu normalus?!“ Allowance cut for a week.`,'bad');G.skipped=Math.max(G.skipped||0,3);setMood(-8)}
  if(it.drink&&P.inCar){crime(2,'Drunk driving')}}
function viceTick(dt){if(P.drunk>0){P.drunk-=dt*1.5;if(P.drunk<0)P.drunk=0}if((P.nicotine||0)>0){P.nicotine-=dt*.02;if(P.nicotine>40&&Math.random()<dt*.01){setMood(-4);log('Norisi rūkyti… You crave a cigarette. (Quit in the phone: Sveikata.)','amb')}}}

/* ---------- angry people ---------- */
let ANGRY_T=60;
function angryTick(dt){ANGRY_T-=dt;if(ANGRY_T>0||SCENE||P.inCar||MAP.kind!=='city')return;ANGRY_T=rnd(70,160);const e=ENT.peds.find(e=>(e.kind==='civ'||e.kind==='elder')&&!e.special&&dist(e.x,e.y,P.x,P.y)<4*TS);if(!e)return;
  const l=pick(ANGRY_LINES);bubble(e,l[0]);log(`Piktas praeivis: „${esc(l[0])}“ <i>${esc(l[1])}</i>`);setMood(-1)}
function queueEvent(p){if(Math.random()>.25)return false;choice('🛒','Eilė prie kasos',`A grandmother with a full trolley pushes in front of you: <b>„Aš tik vieną duonelę!“</b> (She has forty items.)`,[
  {l:'Praleisti',fn:()=>{P.karma=(P.karma||0)+1;setMood(-2);log('You let her go. She counts coins for five minutes.','amb');poiMenu(p)}},
  {l:'„Ponia, čia eilė!“',fn:()=>{if(Math.random()<.5){log('„Jaunimas visai be gėdos!“ But she goes to the back.','good');poiMenu(p)}else{log('The whole queue takes her side. Embarrassing.','bad');setMood(-5);poiMenu(p)}}}]);return true}

/* ---------- talk hooks ---------- */
function specialTalk(e){if(e.special==='chessman')return chessPuzzle(),true;if(e.special==='rivalkid')return bubble(e,pick(['Netrukdyk!','Mano buteliai!','Mama sakė, kad laimėsiu.'])),true;if(e.special==='reksnys')return reksnysTalk(e),true;if(e.special==='bat')return batTalk(e),true;if(e.special==='baryga')return barygaTalk(e),true;if(e.special==='drip')return openRepShop(),true;
  if(e.special==='tourist'){const l=pick(TOURIST_LINES);choice('📷','Turistas',`„${l[0]}“<br><i>${l[1]}</i>`,[{l:'Parodyti kelią',fn:()=>{const tip=ri(1,5);P.money+=tip;bubble(e,'Thank you! Ačiū!');log(`You point the way. Tip: ${eur(tip)}.`,'good')}},{l:'„No English…“',fn:()=>{}}]);return true}
  if(e.special==='metal'){const l=pick(METAL_LINES);bubble(e,l[0]);log(`Metalistas: „${esc(l[0])}“ <i>${esc(l[1])}</i>`);if(styleOf()==='metal')setMood(4);return true}
  if(e.special==='centras'||e.fac==='centras'){const l=pick(CENTRAS_LINES);bubble(e,l[0]);log(`Centrinis: „${esc(l[0])}“ <i>${esc(l[1])}</i>`);const st=styleOf();if(st==='rep'){P.respect=(P.respect||0)+1;if(P.owned&&Object.keys(P.owned).some(k=>k.startsWith('fake_')&&P.look[k.slice(5)])&&Math.random()<.25){bubble(e,'Feikas, bičas!');setMood(-5)}}else if(st==='maroz'){bubble(e,'Ką, marozas?');setMood(-2)}return true}
  if(e.kind==='gang'&&e.fac&&FACTIONS[e.fac].maroz){const l=pick(MAROZ_LINES);bubble(e,l[0]);log(`Marozas: „${esc(l[0])}“ <i>${esc(l[1])}</i>`);return true}
  return false}
