
/* =====================================================================
   LIFE — phone apps, driving licence, army, emigration, school exams,
   new jobs (club bouncer, kiosk, Norway), health, family and endings.
   ===================================================================== */
function msg(from,text){G.msgs=G.msgs||[];G.msgs.unshift({from,text,d:dateStr()});if(G.msgs.length>40)G.msgs.length=40;G.unread=(G.unread||0)+1}
function skipDays(n){for(let k=0;k<n;k++){G.time.day++;G.time.doy=(G.time.doy+1)%365;G.time.dow=(G.time.dow+1)%7;const b=doyToDate(G.time.doy);if(b.m===P.bm&&b.d===P.bd)P.age++}G.events=[];seasonCheck()}

/* ---------- phone ---------- */
const PHONE_TABS=[['darbai','Darbai'],['skelbimai','Skelbimai'],['social','Fotogramas'],['msgs','Žinutės'],['health','Sveikata']];
function openPhone(tab){tab=tab||'darbai';if(tab==='darbai')return openPhoneJobs(true);
  let h=mHead('T','Telefonas',`${DAYS[G.time.dow]} · ${fmtTime()} · ${eur(P.money)}`)+'<div class="mbody">'+phoneTabs(tab);
  if(tab==='skelbimai')h+=adsHtml();if(tab==='social')h+=socialHtml();if(tab==='msgs'){G.unread=0;h+=(G.msgs||[]).map(m=>`<div class="quest"><h4 style="font-size:16px">${esc(m.from)}</h4><div class="sub">${esc(m.d)}</div><p style="margin:4px 0 0">${m.text}</p></div>`).join('')||'<p class="note">Žinučių nėra.</p>'}
  if(tab==='health')h+=healthHtml();openModal(h+'</div>')}
function phoneTabs(cur){return `<div class="row" style="margin-bottom:12px">${PHONE_TABS.map(([k,t])=>`<button class="chip ${k===cur?'on':''}" onclick="openPhone('${k}')">${t}${k==='msgs'&&G.unread?` (${G.unread})`:''}</button>`).join('')}</div>`}

/* Skelbimai: used cars (and scams) */
const AD_TEXT=['Važiuoja kaip nauja, tik kartais keistai kvepia.','Rida tik 180 000 (tikra!).','Vokiška, neseniai atvaryta, nedaužta.','Važiavo pensininkas tik į bažnyčią.','Skubiai, išvažiuoju į Norvegiją.','Yra mažas defektas, bet nieko baisaus.'];
function adsList(){if(!G.ads||G.ads.day!==G.time.day){const list=[];for(let k=0;k<5;k++){const m=pick(['golf','golf','audi80','passat','w124','e36','e39','e46','lada','x5']);const d=CARS[m];list.push({m,price:Math.round(d.price*rnd(.45,.8)/10)*10,txt:pick(AD_TEXT),scam:Math.random()<.18,bad:Math.random()<.25,col:pick(PAINTS),id:k})}G.ads={day:G.time.day,list}}return G.ads.list}
function adsHtml(){let h='<p class="note">„Skelbk.lt“ – used cars from private sellers. Cheaper than the garage, but check before you pay.</p>';
  adsList().forEach(a=>{if(a.sold)return;h+=act(`${CARS[a.m].name}`,`„${esc(a.txt)}“`,eur(a.price),()=>buyAd(a.id),P.age<16)});
  if(P.cars.length){h+='<h3 style="font:800 20px var(--display);margin:14px 0 8px">Parduoti · sell yours</h3>';P.cars.forEach((oc,i)=>{const v=Math.round(CARS[oc.model].price*.55*((oc.hp||100)/100));h+=act(CARS[oc.model].name,`Condition ${Math.round(oc.hp||100)}%`,`+${eur(v)}`,()=>sellCar(i,v))})}return h}
function buyAd(id){const a=G.ads.list.find(x=>x.id===id);if(!a||a.sold)return;if(MAP.kind==='road'){log('Not on the highway.','bad');return}if(!pay(a.price))return;a.sold=true;
  if(a.scam){msg('Skelbk.lt',`The seller of the ${CARS[a.m].name} took your ${eur(a.price)} and stopped answering. Classic.`);log('Scam! The seller vanished with your money.','bad');setMood(-10);openPhone('skelbimai');return}
  P.cars.push({model:a.m,color:a.col,tune:{},hp:a.bad?45:90,map:MAP.id});const[x,y]=freeSpotNear(P.x,P.y,(t,X,Y)=>(DRIVE[t]||t===T.LOT)&&dist(X*TS,Y*TS,P.x,P.y)>30);spawnOwnedCar(P.cars.length-1,x,y,0);
  log(`Bought a used ${CARS[a.m].name}. ${a.bad?'The „small defect“ is the gearbox.':'It actually runs!'}`,a.bad?'amb':'good');chron(`Bought a used ${CARS[a.m].name} online.`);openPhone('skelbimai')}
function sellCar(i,v){const e=ownedCarEntity(i);if(e&&P.inCar===e){log('Get out of it first.','bad');return}ENT.cars=ENT.cars.filter(c=>c!==e);P.cars.splice(i,1);ENT.cars.forEach(c=>{if(c.owned>i)c.owned--});P.money+=v;log(`Sold for ${eur(v)}.`,'good');openPhone('skelbimai')}

/* Fotogramas: followers and posts */
function socialHtml(){const f=P.followers||0;let h=`<div class="quest main"><h4>@${esc((P.name+P.surname).toLowerCase().replace(/[^a-ząčęėįšųūž]/g,''))}</h4><div class="sub">${f} sekėjų · ${STYLE_NAME[styleOf()]}</div>`;
  h+=act('Įkelti nuotrauką','Post a photo of where you are. Landmarks, night meets and the White Bridge get more likes.','Įkelti',()=>postPhoto())+'</div>';
  if(f>=1000&&!G.flags.inflQ)h+=act('Gintarė „Glow“ rašo','„Labas! Gal nufilmuotum mane prie Baltojo tilto? Pasidalinsiu sekėjais.“','Sutikti',()=>{G.flags.inflQ=1;msg('Gintarė „Glow“','Meet me at the White Bridge in Vilnius in the evening!');closeModal()});
  const feed=[`${pick(Object.values(FACTIONS).filter(x=>x.maroz)).short}: *nuotrauka prie kiosko su saulėgrąžomis*`,'Sostinės Šoninis: naujas driftas Europos aikštėje 🔥','Lrytas: Benzinas vėl brangsta','Žalgiris: Pergalė! 💚',`Močiutė Aldona: Kas pametė katiną Naujininkuose?`,'Naktinis Šikšnosparnis: Šiąnakt mieste ramu. 🦇'];
  h+='<h3 style="font:800 20px var(--display);margin:14px 0 8px">Srautas</h3>'+feed.map(t=>`<p class="note" style="margin:0 0 6px">${esc(t)} · ❤ ${ri(3,900)}</p>`).join('');return h}
function postPhoto(){if(G.flags.postDay===G.time.day&&G.flags.posts>=3){log('You already posted three times today. Nobody likes spam.','bad');return}if(G.flags.postDay!==G.time.day){G.flags.postDay=G.time.day;G.flags.posts=0}G.flags.posts++;
  const lm=POIS.find(p=>p.kind==='landmark'&&dist(p.x,p.y,P.x,P.y)<8*TS);const night=nightLevel()>.3;let gain=ri(2,12)+(lm?ri(15,60):0)+(styleOf()==='rep'?10:0)+(night&&lm?20:0);
  if(lm&&lm.hq==='centras')gain+=30;P.followers=(P.followers||0)+gain;setMood(4);log(`${lm?esc(lm.name)+': ':''}+${gain} sekėjų (followers). Total ${P.followers}.`,'good');
  if(G.flags.inflQ===1&&lm&&lm.hq==='centras'&&night){G.flags.inflQ=2;P.followers+=500;msg('Gintarė „Glow“','Ačiū!!! Pažymėjau tave. 💖');toast('📸','Influencerės draugas','+500 followers from Gintarė „Glow“.')}openPhone('social')}

/* Sveikata */
function healthHtml(){const n=Math.round(P.nicotine||0),l=P.lungs||0;let h=`<dl class="kv"><dt>Sveikata</dt><dd>${Math.round(P.hp)}/${P.maxHp}</dd><dt>Plaučiai</dt><dd>${l?`${l} pakeliai surūkyta`:'Švarūs'}</dd><dt>Priklausomybė</dt><dd>${n>40?'Stipri':n>10?'Silpna':'Nėra'}</dd><dt>Girtumas</dt><dd>${P.drunk>0?'Taip':'Ne'}</dd></dl>`;
  if(n>5)h+=act('Mesti rūkyti','Patches from the pharmacy. Cravings fade faster, a few grumpy days.','€15',()=>{if(pay(15)){P.nicotine=Math.max(0,n-30);setMood(-6);log('Day one without smoking. You feel proud and irritated.','good');openPhone('health')}});
  h+=act('Profilaktinis patikrinimas','The doctor checks you over and restores a little lung health.','€30',()=>{if(pay(30)){P.lungs=Math.max(0,l-2);P.hp=P.maxHp;log('„Mažiau rūkykit, daugiau judėkit.“','good');openPhone('health')}});return h}

/* ---------- Regitra: theory + practical ---------- */
const ROAD_Q=[['Leistinas greitis gyvenvietėje?','Speed limit in a town?',['50 km/h','70 km/h','90 km/h'],0],['Leistinas greitis už gyvenvietės asfaltuotu keliu?','Outside towns on asphalt?',['70 km/h','90 km/h','110 km/h'],1],
 ['Greitis automagistralėje vasarą?','Motorway limit in summer?',['110 km/h','130 km/h','150 km/h'],1],['Artimųjų šviesų žibintai dieną?','Dipped headlights in daytime?',['Privalomi visada','Tik žiemą','Nebūtini'],0],
 ['Alkoholio norma pradedančiajam vairuotojui?','Alcohol limit for a new driver?',['0,4 ‰','0,2 ‰','0,0 ‰'],2],['Žieminės padangos privalomos…','Winter tyres are required…',['lapkričio 10 – kovo 31','gruodžio 1 – vasario 28','visada'],0],
 ['Prie nereguliuojamos pėsčiųjų perėjos…','At an uncontrolled crossing…',['privalai praleisti pėsčiąjį','pėsčiasis turi palaukti','pypteli ir važiuoji'],0],['Kalbėti telefonu vairuojant galima…','Talking on the phone while driving…',['tik su laisvų rankų įranga','jei trumpai','niekada negalima net su įranga'],0],
 ['Vaikui, žemesniam nei 135 cm, reikia…','A child under 135 cm needs…',['vaiko kėdutės','tik saugos diržo','sėdėti priekyje'],0],['Ženklas „Pagrindinis kelias“ yra…','The „priority road“ sign is…',['geltonas rombas','raudonas trikampis','mėlynas apskritimas'],0]];
function openRegitra(){let h=mHead('B','Regitra','Vairuotojo pažymėjimas · driving licence (B category, 18+)')+'<div class="mbody">';
  if(P.license)h+='<p><span class="pill g">Turi teises</span> You already have a licence.</p>';
  else if(P.age<18)h+='<p class="note">„Grįžk, kai tau bus 18.“ Until then, driving is illegal (and the police will remember).</p>';
  else h+=act('Teorijos egzaminas','5 questions about Lithuanian road rules. 4 right to pass. Then the practical test.','€20',()=>{if(pay(20))theoryExam()});
  openModal(h+'</div>')}
function quiz(title,qs,need,done){let i=0,ok=0;const next=()=>{if(i>=qs.length){done(ok>=need,ok);return}const q=qs[i];
  choice('?',`${title} · ${i+1}/${qs.length}`,`<b>${esc(q[0])}</b><br><i>${esc(q[1])}</i>`,q[2].map((a,k)=>({l:a,fn:()=>{if(k===q[3]){ok++;SND.blip(900)}else SND.blip(220);i++;next()}})))};next()}
function theoryExam(){const qs=ROAD_Q.slice().sort(()=>Math.random()-.5).slice(0,5);quiz('Teorija',qs,4,(pass,ok)=>{if(!pass){choice('✗','Neišlaikei',`${ok}/5. „Pasimokyk ir ateik kitą savaitę.“`,[{l:'Gerai',fn:()=>{}}]);return}
  choice('✓',`Teorija: ${ok}/5`,'Now the practical test. A Škoda with a nervous examiner waits outside. Drive through 4 points, do not go over 60 km/h and do not hit anything.',[{l:'Važiuojam',fn:()=>practicalExam()}])})}
function practicalExam(){if(SCENE)leaveScene(true);const reg=POIS.find(p=>p.kind==='regitra');const sp=freeSpotNear(reg?reg.x:P.x,(reg?reg.y:P.y)+30,t=>DRIVE[t]);
  const car={type:'car',ai:'parked',model:'golf',color:'#E9E6DA',x:sp[0],y:sp[1],ang:0,vx:0,vy:0,hp:100,exam:true};ENT.cars.push(car);P.x=car.x;P.y=car.y;enterCar(car);
  const cps=[];let at={x:car.x,y:car.y};for(let k=0;k<4;k++){const p=roadPointIn(curCity().id,at,6,12);cps.push(p);at=p}
  G.mission={type:'exam',title:'Praktinis egzaminas',custom:true,cps,i:0,target:Object.assign({label:'Taškas 1/4'},cps[0]),step:'Max 60 km/h, no crashes',timer:90,speedT:0,car,pay:0}}
function tickExam(dt){const M=G.mission;if(!M||M.type!=='exam')return;M.timer-=dt;const c=M.car;if(P.inCar!==c){examEnd(false,'You left the car.');return}
  const kmh=Math.hypot(c.vx,c.vy)*.34;if(kmh>62){M.speedT+=dt;if(M.speedT>1.2){examEnd(false,'Over 60 km/h. „Ačiū, galite išlipti.“');return}}else M.speedT=Math.max(0,M.speedT-dt);
  if(c.hp<92){examEnd(false,'You hit something. The examiner screamed.');return}if(M.timer<=0){examEnd(false,'Too slow.');return}
  if(dist(c.x,c.y,M.target.x,M.target.y)<60){M.i++;SND.blip(1000);if(M.i>=M.cps.length){examEnd(true);return}M.target=Object.assign({label:`Taškas ${M.i+1}/4`},M.cps[M.i])}M.step=`${Math.round(kmh)} km/h · ${Math.ceil(M.timer)}s`}
function examEnd(ok,why){const M=G.mission;G.mission=null;exitCar(true);ENT.cars=ENT.cars.filter(c=>!c.exam);if(ok){P.license=true;toast('B','Teisės!','You passed. Your licence arrives by post.');chron('Got a driving licence.');SND.fanfare()}else{log(`Egzaminas neišlaikytas: ${why}`,'bad');setMood(-6)}}

/* ---------- army ---------- */
function armyCheck(){if(P.army||P.age<18||P.age>26||G.flags.armyAsked||Math.random()>.012)return;G.flags.armyAsked=true;msg('Karo prievolės tarnyba','Jūs esate įtrauktas į šauktinių sąrašą. Atvykite į Ruklą.');
  setTimeout(()=>choice('🎖','Šaukimas į kariuomenę','A letter arrives: you were drawn in the conscription lottery. Nine months of basic service in Rukla.',[
   {l:'Tarnauti (9 mėn.)',fn:()=>armyServe()},
   {l:P.job==='student'?'Atidėti (studijos)':'Išsisukti',fn:()=>{if(P.job==='student'){log('Deferred while you study.','good');G.flags.armyAsked=false}else{G.flags.armyDodge=true;log('You ignored the letter. That might come back later.','amb')}}}]),300)}
function armyServe(){skipDays(270);P.army=true;P.fight=Math.min(10,P.fight+2);P.maxHp+=10;P.hp=P.maxHp;P.money+=1800;setMood(5);chron('Served nine months in the army in Rukla.');
  scene('🎖','Rukla',['Nine months of 6:00 wake-ups, marches in the rain, guard duty and terrible soup. You learned to make a bed in 40 seconds and to stay calm when everything goes wrong.','You come back stronger. +2 fighting, +10 max health, €1,800 saved. The police treat you a little differently now.'])}

/* ---------- emigration and Norway ---------- */
function emigrate(){choice('✈','Į Londoną?','A cousin says there is work in a warehouse in Luton. Many people from your town already went.',[
  {l:'1 metams',fn:()=>emigYears(1)},{l:'3 metams',fn:()=>emigYears(3)},{l:'Ne, likti Lietuvoje',fn:()=>{}}])}
function emigYears(n){if(P.age<18){log('You need to be 18.','bad');return}if(!pay(80))return;exitCar(true);skipDays(365*n);const earned=n*ri(6500,9500);P.money+=earned;P.emigrated=(P.emigrated||0)+n;P.mood=55;
  scene('🇬🇧',`${n} m. Anglijoje`,[`${n===1?'A year':n+' years'} of night shifts in a warehouse, a shared house with five other Lithuanians, Maxima\'s „lietuviškos prekės“ shelf in Tesco and calls home every Sunday.`,`You come back with ${eur(earned)} and a slight English accent when you say „ok“.`]);chron(`Worked ${n} year(s) in England.`)}
function norwayJob(){if(P.age<18){log('You need to be 18.','bad');return}choice('🇳🇴','Statybos Norvegijoje','Three months on a construction site near Bergen. Rain, fjords and €2,200 a month.',[
  {l:'Važiuoti',fn:()=>{exitCar(true);skipDays(90);P.money+=6400;P.energy=40;P.fight=Math.min(10,P.fight+1);scene('🇳🇴','Grįžai iš Norvegijos',['Three months of concrete, rain and very expensive bread. You come back with €6,400 and a new respect for Norwegian salmon.']);chron('Worked three months in Norway.')}},{l:'Ne',fn:()=>{}}])}

/* ---------- school exams, šimtadienis, išleistuvės ---------- */
const EXAM_Q=[['Kada paskelbtas Lietuvos Nepriklausomybės aktas (1918)?','When was the 1918 Act of Independence signed?',['Vasario 16','Kovo 11','Liepos 6'],0],['Kas buvo vienintelis karūnuotas Lietuvos karalius?','Who was the only crowned king of Lithuania?',['Vytautas','Mindaugas','Gediminas'],1],
 ['Kada vyko Žalgirio mūšis?','When was the Battle of Grunwald (Žalgiris)?',['1410','1569','1918'],0],['Kas parašė poemą „Metai“?','Who wrote the poem „Metai“?',['Maironis','K. Donelaitis','J. Biliūnas'],1],
 ['Kuris miestas buvo laikinoji sostinė?','Which city was the temporary capital?',['Kaunas','Klaipėda','Šiauliai'],0],['Kiek yra 15 % nuo 200?','What is 15% of 200?',['20','30','35'],1],['Kas sukūrė Lietuvos himną?','Who wrote the national anthem?',['V. Kudirka','M. K. Čiurlionis','S. Nėris'],0],
 ['Kurių metų Baltijos kelias?','The Baltic Way was in…',['1989','1991','1987'],0],['M. K. Čiurlionis buvo…','M. K. Čiurlionis was a…',['dailininkas ir kompozitorius','krepšininkas','karalius'],0],['Kiek bus 7 × 8?','7 × 8 =',['54','56','58'],1]];
function examsAvailable(p){return P.age>=17&&P.age<=19&&P.school===p.fac&&!P.examDone}
function takeExams(){quiz('Brandos egzaminai',EXAM_Q.slice().sort(()=>Math.random()-.5).slice(0,5),3,(pass,ok)=>{P.examDone=true;P.exam=ok;
  if(pass){choice('🎓','Brandos atestatas!',`You scored ${ok}/5. Tonight is the išleistuvės (prom): suits, dresses, a rented limo and dawn by the river.`,[{l:'Į išleistuves!',fn:()=>{setMood(25);skipHours(8);chron('Graduated from school. Danced at the prom until dawn.');log('Išleistuvės: you danced until sunrise. Valio!','good')}}])}
  else{choice('✗','Neišlaikei',`${ok}/5. You can retake next year. Your mum is not happy.`,[{l:'Bliamba',fn:()=>{P.examDone=false;setMood(-15)}}])}})}
function simtadienis(){if(G.flags.simt)return log('Šimtadienis was already celebrated.');G.flags.simt=1;setMood(15);skipHours(5);log('Šimtadienis: 100 days to exams. A party in the school hall, a skit about the teachers and promises to start studying tomorrow.','good');chron('Celebrated šimtadienis.')}

/* ---------- club: dance, bouncer job ---------- */
function tplClub(p){const s=mkRoom(15,10,{floor:'dark',wall:'#24152E',title:p.name,sub:'Naktinis klubas'});R.zone(s,5,3,6,4,'dark');R.add(s,'dance',5,3,6,4,{solid:false,act:()=>{if(P.energy<10)return log('Too tired to dance.','bad');P.energy-=10;setMood(10);skipHours(1);log(pick(['You dance to Lithuanian techno. Your shoes may never recover.','The DJ plays „Dviračiu per Lietuvą“ remix. Everybody screams.','Someone spills a drink on you. Still a good night.']),'good')},label:'Šokti · dance'});
  R.add(s,'counter',1,3,3,1,{bar:true,act:()=>{if(P.age<18)return log('„Pasą?“ No alcohol under 18.','bad');openShopList('Klubo baras',['gira','energ'])},label:'Baras'});R.add(s,'desk',11,2,3,1,{pc:true});R.deco(s,'neon',5,1,5,{col:'#E0458A',txt:'OPIUM'});
  R.ped(s,'staff',12,3,{name:'DJ Vaidas',lk:staffLook('#1D1F22',{female:false,glasses:true}),lines:[line('Prašymus priimu tik už eurą!','Requests only for a euro!')]});
  for(let k=0;k<5;k++)R.ped(s,'civ',ri(5,10),ri(3,6),{lines:[line('Kokia muzika!','What music!')]});
  R.ped(s,'staff',7,8,{name:'Apsaugininkas Tadas',lk:staffLook('#111',{female:false}),lines:[line('Pas mus trūksta žmonių. Nori dirbti?','We are short on staff. Want a job?')],act:()=>bouncerShift()});
  if(P.age<16&&(G.time.min/60>=22||G.time.min/60<4))log('„Vaikams čia ne vieta.“ The bouncer lets you look around but not stay long.','amb');return s}
function bouncerShift(){if(P.age<18)return log('„Grįžk, kai būsi pilnametis.“','bad');const guests=[['A group of guys in Adidas, already drunk, shouting in Russian.',false],['Two students with IDs, polite.',true],['A girl who looks 15 with her sister\'s passport.',false],
  ['A famous basketball player and friends.',true],['A man trying to bring in his own vodka.',false],['A tourist couple asking if there is a dress code.',true],['Someone who just puked on the stairs.',false],['A birthday group in matching T-shirts.',true]].sort(()=>Math.random()-.5).slice(0,4);
  let i=0,score=0;const next=()=>{if(i>=guests.length){const pay2=20+score*12;P.money+=pay2;skipHours(6);log(`Shift over: ${score}/4 right calls. Paid ${eur(pay2)}.`,'good');return}
    const g=guests[i];choice('🚪',`Apsaugoje · ${i+1}/4`,g[0],[{l:'Įleisti',fn:()=>{if(g[1])score++;i++;next()}},{l:'Neįleisti',fn:()=>{if(!g[1])score++;i++;next()}}])};next()}
/* ---------- kiosk shift ---------- */
function kioskShift(){if(P.age<16)return log('You need to be 16 to work here.','bad');const cs=[['A boy (about 14) asks for cigarettes.',0,'Atsisakyti'],['A grandmother wants „Lietuvos rytas“ and change for €20.',1,'Parduoti'],['A man wants a lottery ticket.',1,'Parduoti'],['A teenager wants an energy drink and a beer.',0,'Atsisakyti'],['A tourist wants a map and a postcard.',1,'Parduoti']].sort(()=>Math.random()-.5).slice(0,4);
  let i=0,score=0;const next=()=>{if(i>=cs.length){const p2=15+score*6;P.money+=p2;skipHours(5);log(`Kiosk shift: ${score}/4. Paid ${eur(p2)}.`,'good');return}const c=cs[i];
    choice('📰',`Kioske · ${i+1}/4`,c[0],[{l:'Parduoti',fn:()=>{if(c[1])score++;else{crime(.5,'Sold to a minor');log('A police inspector was watching. Not great.','bad')}i++;next()}},{l:'Atsisakyti',fn:()=>{if(!c[1])score++;i++;next()}}])};next()}
/* ---------- car market (Marijampolė) ---------- */
function openCarMarket(){let h=mHead('MRJ','Autoturgus','Haggle! Prices drop if you push, but sellers walk away if you push too hard.')+'<div class="mbody">';
  ['golf','audi80','passat','w124','e36','e39','e46','x5','lada'].forEach(m=>{const d=CARS[m],pr=Math.round(d.price*.6/10)*10;h+=act(d.name,`Asking ${eur(pr)}. „Vokiška, nedaužta, nedažyta.“`,'Derėtis',()=>haggle(m,pr),P.age<16)});openModal(h+'</div>')}
function haggle(m,ask){let price=ask,round=0;const next=()=>{choice('🤝',`${CARS[m].name}`,`Seller: „${eur(price)}, ir tai tik tau.“`,[{l:'Pirkti',fn:()=>{if(!pay(price))return;P.cars.push({model:m,color:pick(PAINTS),tune:{},hp:Math.random()<.3?55:85,map:MAP.id});const[x,y]=freeSpotNear(P.x,P.y,t=>DRIVE[t]||t===T.LOT);spawnOwnedCar(P.cars.length-1,x,y,0);log(`Bought for ${eur(price)}.`,'good');chron(`Bought a ${CARS[m].name} at the Marijampolė car market.`)}},
    {l:'Siūlyti mažiau',fn:()=>{round++;if(Math.random()<.18*round){log('„Nu tai ir neperk!“ The seller walks away.','bad');return}price=Math.round(price*rnd(.86,.94)/10)*10;next()}},{l:'Išeiti',fn:()=>{}}])};next()}

/* ---------- family events ---------- */
function familyEvent(){if(P.age>=24||Math.random()>.08)return;const ev=pick([
  ()=>choice('🏠','Tėvai barasi','Shouting from the kitchen again. About money, as always.',[{l:'Pasikalbėti su jais',fn:()=>{setMood(-2);P.karma=(P.karma||0)+2;log('You sit them down. Things calm down a little.','good')}},{l:'Išeiti į kiemą',fn:()=>setMood(-4)}]),
  ()=>{if(!P.sib)return;msg(P.sib.name,'Aš išvažiuoju dirbti į Angliją. Pasirūpink mama.');choice('✈',`${P.sib.name} išvažiuoja`,`${esc(P.sib.name)} is moving to England for work. The house will be quieter.`,[{l:'Palydėti į oro uostą',fn:()=>{setMood(-6);skipHours(3);P.sib.gone=true}}])},
  ()=>choice('🏥','Močiutė serga','Grandma is in hospital. Mum asks if you can visit.',[{l:'Aplankyti (2 h)',fn:()=>{skipHours(2);P.karma=(P.karma||0)+3;setMood(4);log('Grandma holds your hand and tells you about Kaunas in 1960. She is getting better.','good')}},{l:'Nusiųsti €20',fn:()=>{pay(20);P.karma=(P.karma||0)+1}},{l:'Neturiu laiko',fn:()=>setMood(-6)}]),
  ()=>choice('💼','Tėtis neteko darbo','Dad lost his job. There will be no pocket money for a while.',[{l:'Duoti €30',fn:()=>{if(pay(30)){P.karma=(P.karma||0)+3;setMood(3)}}},{l:'Suprantu',fn:()=>{G.skipped=Math.max(G.skipped||0,3)}}]),
  ()=>choice('💐','Mamos gimtadienis','It is mum\'s birthday today and you forgot!',[{l:'Nupirkti gėlių (€8)',fn:()=>{if(pay(8)){setMood(8);P.karma=(P.karma||0)+2;log('Mum cries a little. In a good way.','good')}}},{l:'Apsimesti, kad prisiminei',fn:()=>setMood(-3)}])]);ev()}

/* ---------- prison and endings ---------- */
function prisonCheck(){if((P.busts||0)>=5&&P.heat>=0&&!G.flags.prisonDone&&P.age>=18){G.flags.prisonDone=true;
  choice('⛓','Teismas','Five arrests. This time the judge does not let it go: three years in prison.',[{l:'Atlikti bausmę',fn:()=>{skipDays(1095);P.money=Math.round(P.money*.5);if(P.faction){P.rep[P.faction]=Math.floor(repOf(P.faction)*.6)}P.prison=(P.prison||0)+3;P.busts=0;
    scene('⛓','Pravieniškės',['Three years. Bunk beds, a carpentry workshop, letters from your family and long talks with people who made worse choices than you.','You come out older and quieter. Some old friends are gone. Some never wrote.']);chron('Served three years in prison.')}}])}}
function endingType(){const st=Object.keys(P.rep).filter(k=>FACTIONS[k]);const top=k=>rankIdx(k)>=RANKS[rankTable(FACTIONS[k])].length-1;
  if((P.prison||0)>=3)return['⛓','Buvęs kalinys','Prison changed you. You work in a garage now and tell kids not to repeat your mistakes.'];
  if(st.some(k=>FACTIONS[k].league==='street'&&top(k)))return['👑','Gatvės legenda',`Everyone knows your name in ${cityById(P.city).name}. Respect, fear and very few friends you can trust.`];
  if(st.some(k=>FACTIONS[k].league==='auto'&&top(k)))return['🏁','Šoninio karalius','Your drifts are famous. Later you open a real drift school on a closed track, where it is legal.'];
  if((G.biz||[]).length>=2&&P.money>=50000)return['💼','Verslininkas','From kebabs to a chain of businesses. You give jobs to kids from your old block.'];
  if((P.followers||0)>=10000)return['📸','Influenceris','A hundred thousand followers and a brand deal with a kibinai bakery.'];
  if((P.emigrated||0)>=3)return['✈','Emigrantas','You built a life abroad. Every summer you come back to Palanga and every winter you miss cepelinai.'];
  if((P.karma||0)>=15)return['🏡','Geras žmogus','Not famous, not rich, but your neighbours, your grandma and the Night Bat all say you are a good person.'];
  return['🙂','Paprastas gyvenimas','A normal Lithuanian life: work, family, Žalgiris on TV and šaltibarščiai in summer. Not bad at all.']}
function epilogue(){const[gl,t,txt]=endingType();openModal(mHead(gl,`Epilogas: ${t}`,`${esc(P.name+' '+P.surname)} · ${P.age} m.`)+`<div class="mbody scene"><p>${txt}</p><p class="note">Visited: ${Object.keys(P.visited).filter(k=>PLACE(k)).map(k=>PLACE(k).name).join(', ')} · KOs ${P.stats.ko||0} · best drift ${P.stats.bestDrift||0} · followers ${P.followers||0}</p>
  <div style="max-height:180px;overflow:auto">${G.hist.slice(-14).map(h=>`<p class="note" style="margin:0 0 4px">${esc(h)}</p>`).join('')}</div></div><div class="mfoot"><button class="btn ghost" onclick="closeModal()">Gyventi toliau</button><button class="btn amber" onclick="saveGame(true);location.reload()">Naujas gyvenimas</button></div>`)}
const LIFE_HANDLERS={regitra:openRegitra,carmarket:openCarMarket};

Object.assign(POI_HANDLERS,LIFE_HANDLERS);TPL.club=tplClub;
let LIC_T=0;function lifeTick(dt){tickExam(dt);LIC_T-=dt;if(LIC_T<=0&&P.inCar&&!P.license&&CARS[P.inCar.model].kind!=='bike'&&MAP.kind!=='road'){LIC_T=40;if(ENT.peds.some(e=>e.kind==='police'&&dist(e.x,e.y,P.x,P.y)<9*TS)||ENT.cars.some(c=>c.ai==='police'&&dist(c.x,c.y,P.x,P.y)<10*TS)){crime(1,'Driving without a licence')}}}
