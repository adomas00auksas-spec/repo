'use strict';
/* =====================================================================
   LIETUVA · Lietuvos gyvenimas
   A Lithuania life simulator. Fictional role-play. Nothing here is advice.
   ===================================================================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const TS=32, W=900, H=700;
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const eur=n=>'€'+Math.round(n).toLocaleString('lt-LT');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let SR=mulberry(1990);
const sr=(a=1,b)=>b===undefined?SR()*a:a+SR()*(b-a);
const sri=(a,b)=>Math.floor(sr(a,b+1));
const spick=a=>a[Math.floor(SR()*a.length)];
function hash2(x,y){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(hash2(xi,yi),hash2(xi+1,yi),u),lerp(hash2(xi,yi+1),hash2(xi+1,yi+1),u),v)}
function fbm(x,y){return vnoise(x,y)*.5+vnoise(x*2.1+17,y*2.1+5)*.3+vnoise(x*4.3+3,y*4.3+41)*.2}
const geo=(lon,lat)=>[Math.round((lon-20.6)/6.3*W),Math.round((56.5-lat)/2.65*H)];
function shade(hex,f){let n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;
  if(f<0){r*=1+f;g*=1+f;b*=1+f}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}
  return '#'+((1<<24)|(r<<16)|(g<<8)|b|0).toString(16).slice(1)}

/* ---------- tiles ---------- */
const T={GRASS:0,FOREST:1,SEA:2,WATER:3,SAND:4,ROAD:5,WALK:6,BUILD:7,PARK:8,COBBLE:9,BRIDGE:10,FIELD:11,HWY:12,LOT:13,DUNE:14,YARD:15,ABROAD:16,WBRIDGE:17,PIER:18};
const SOLID_FOOT=new Uint8Array(20),SOLID_CAR=new Uint8Array(20),DRIVE=new Uint8Array(20),WALKABLE=new Uint8Array(20);
[T.SEA,T.WATER,T.BUILD,T.ABROAD].forEach(t=>{SOLID_FOOT[t]=1;SOLID_CAR[t]=1});
SOLID_CAR[T.FOREST]=1;
[T.ROAD,T.COBBLE,T.BRIDGE,T.HWY,T.LOT].forEach(t=>DRIVE[t]=1);
[T.WALK,T.COBBLE,T.PARK,T.YARD,T.WBRIDGE,T.PIER,T.LOT].forEach(t=>WALKABLE[t]=1);

/* ---------- cities ---------- */
const CITIES=[
 {id:'vilnius',name:'Vilnius',loc:'Vilniuje',gen:'Vilniaus',code:'VLN',lon:25.28,lat:54.69,R:62,
  blurb:'The capital. Baroque old town, glass towers across the Neris, and the White Bridge where the Centras kids hang out.',
  districts:['Senamiestis','Šnipiškės','Žirmūnai','Naujininkai','Lazdynai','Antakalnis']},
 {id:'kaunas',name:'Kaunas',loc:'Kaune',gen:'Kauno',code:'KNS',lon:23.90,lat:54.90,R:52,
  blurb:'Basketball city. Laisvės alėja, the Žalgiris arena, and a castle where the Neris meets the Nemunas.',
  districts:['Centras','Šilainiai','Dainava','Aleksotas','Vilijampolė']},
 {id:'klaipeda',name:'Klaipėda',loc:'Klaipėdoje',gen:'Klaipėdos',code:'KLP',lon:21.20,lat:55.71,R:34,
  blurb:'The only seaport. Cranes, the sailing ship Meridianas, and the ferry over to the Curonian Spit.',
  districts:['Senamiestis','Uostas','Smeltė','Bandužiai']},
 {id:'siauliai',name:'Šiauliai',loc:'Šiauliuose',gen:'Šiaulių',code:'ŠIA',lon:23.32,lat:55.93,R:34,
  blurb:'The city of the sun. The Hill of Crosses stands in the fields to the north.',
  districts:['Centras','Lieporiai','Dainai','Gubernija']},
 {id:'panevezys',name:'Panevėžys',loc:'Panevėžyje',gen:'Panevėžio',code:'PNV',lon:24.36,lat:55.73,R:34,
  blurb:'Aukštaitija\'s capital, theatre town, and home of a lot of very loud tuned cars.',
  districts:['Centras','Rožynas','Kniaudiškiai','Pilėnai']},
 {id:'alytus',name:'Alytus',loc:'Alytuje',gen:'Alytaus',code:'ALT',lon:24.05,lat:54.40,R:28,
  blurb:'Dzūkija, pine forest and the Nemunas bend. The old parachute tower watches over the town.',
  districts:['Centras','Dainava','Vidzgiris','Putinai']},
 {id:'palanga',name:'Palanga',loc:'Palangoje',gen:'Palangos',code:'PLG',lon:21.10,lat:55.92,R:20,
  blurb:'Summer capital. Basanavičiaus street, the long pier and amber shops everywhere.',
  districts:['Centras','Vanagupė','Kunigiškiai']},
 {id:'nida',name:'Nida',loc:'Nidoje',gen:'Nidos',code:'NID',lon:21.02,lat:55.31,R:14,
  blurb:'Fishing village on the Curonian Spit, between the sea and the lagoon, under the great Parnidis dune.',
  districts:['Nida','Skruzdynė']},
];
CITIES.forEach((c,i)=>{c.i=i;[c.cx,c.cy]=geo(c.lon,c.lat)});
// hand placement fixes so coastal towns sit on land
(()=>{const C=id=>CITIES.find(c=>c.id===id);C('klaipeda').cx=80;C('palanga').cx=76;C('palanga').cy=147;C('nida').cx=52;C('nida').cy=322})();
const cityById=id=>CITIES.find(c=>c.id===id);

/* ---------- factions ---------- */
// league: street (gangs, cartels, crews fight over districts), auto (clubs), school
const FACTIONS={
 centras:{name:'Centro bachūrai',short:'Centras',type:'crew',league:'street',city:'vilnius',color:'#E2A11B',minAge:13,boss:'Rokas „Tiltas“',
   desc:'The Centras kids. Skate decks, cheap energy drinks and the White Bridge every evening. Not a real gang, but nobody from Naujininkai walks the bridge alone.'},
 gopai:{name:'Naujininkų gopai',short:'Gopai',type:'gang',league:'street',city:'vilnius',color:'#2E3236',minAge:16,boss:'Valdas „Sėklos“',
   desc:'Tracksuits, sunflower seeds and squats behind the panel blocks. Old-school neighbourhood gang that runs the south side.'},
 vilkai:{name:'Vilijampolės vilkai',short:'Vilkai',type:'gang',league:'street',city:'kaunas',color:'#7A4B2A',minAge:16,boss:'Arūnas „Vilkas“',
   desc:'The wolves of Vilijampolė. They say they were here before the mikrorajonai were built.'},
 ziurkes:{name:'Uosto žiurkės',short:'Žiurkės',type:'gang',league:'street',city:'klaipeda',color:'#4C6A86',minAge:16,boss:'Kęstas „Krantas“',
   desc:'Dock rats. They know which container is which, and who to pay.'},
 sakalai:{name:'Šiaulių šakalai',short:'Šakalai',type:'gang',league:'street',city:'siauliai',color:'#7E4F96',minAge:16,boss:'Gintas „Saulė“',
   desc:'Jackals of Šiauliai. Small city, long memory.'},
 broliai:{name:'Rožyno broliai',short:'Broliai',type:'gang',league:'street',city:'panevezys',color:'#A33B3B',minAge:16,boss:'Dainius „Brolis“',
   desc:'Brothers of Rožynas. Half of them are actually cousins.'},
 pacanai:{name:'Dainavos pacanai',short:'Pacanai',type:'gang',league:'street',city:'alytus',color:'#5E7A2E',minAge:16,boss:'Mindaugas „Dzūkas“',
   desc:'Dzūkija lads from the Dainava blocks. Polite to grandmothers, rude to everyone else.'},
 vanagai:{name:'Kurorto vanagai',short:'Vanagai',type:'gang',league:'street',city:'palanga',color:'#2A7C79',minAge:16,boss:'Tadas „Vanagas“',
   desc:'Seaside hawks. Quiet all winter, everywhere all summer.'},
 pasienio:{name:'Pasienio kartelis',short:'Pasienio',type:'cartel',league:'street',city:'alytus',color:'#D2601A',minAge:18,boss:'„Generolas“',
   desc:'The Border Cartel. Contraband through the forests from the east: trucks, drones, even weather balloons. Runs like a business, punishes like a cartel.'},
 uosto:{name:'Uosto kartelis',short:'Uosto',type:'cartel',league:'street',city:'klaipeda',color:'#1E2F6E',minAge:18,boss:'„Kapitonas“',
   desc:'The Port Cartel. Everything that comes by sea and should not. Sworn rivals of the Border Cartel.'},
 soninis:{name:'Sostinės Šoninis',short:'Šoninis',type:'auto',league:'auto',city:'vilnius',color:'#E0458A',minAge:16,boss:'Ernestas „Šonas“',
   desc:'Capital drift club. Night meets at the mall car park, tyre smoke till the guards come.'},
 backos:{name:'Kauno Bačkos',short:'Bačkos',type:'auto',league:'auto',city:'kaunas',color:'#B7342F',minAge:16,boss:'Žilvinas „Kvatro“',
   desc:'Audi 80 „bačka“ worshippers. Quattro or nothing, and they will explain why for an hour.'},
 dumai:{name:'Jūros Dūmai',short:'Dūmai',type:'auto',league:'auto',city:'klaipeda',color:'#3FA7D6',minAge:16,boss:'Laura „Dūmas“',
   desc:'Sea Smoke. Port-road sprints and drift at the old fish factory lot.'},
 turbo:{name:'Aukštaitijos Turbo',short:'Turbo',type:'auto',league:'auto',city:'panevezys',color:'#E9B730',minAge:16,boss:'Vytas „Turbo“',
   desc:'Loudest exhausts in Aukštaitija. Their motto: if it does not pop, it does not count.'},
 saule:{name:'Saulės Drift',short:'Saulė',type:'auto',league:'auto',city:'siauliai',color:'#F07C2E',minAge:16,boss:'Agnė „Šoninė“',
   desc:'Šiauliai drift crew. Best handbrake turns north of the Nemunas.'},
 kruizas:{name:'Basanavičiaus Kruizas',short:'Kruizas',type:'auto',league:'auto',city:'palanga',color:'#59B86A',minAge:16,boss:'Martynas „Kruizas“',
   desc:'Summer cruise club. Windows down, slow down Basanavičiaus, as loud as possible.'},
};
// schools: one pair per city, kids 6+ attend, 13+ can join the yard rivalry
const SCHOOLS={
 vilnius:[['Licėjus','#2D5DA8'],['Žirmūnų gimnazija','#C0392B']],
 kaunas:[['Saulės gimnazija','#D99A1E'],['Dainavos progimnazija','#3E8E5E']],
 klaipeda:[['Ąžuolyno gimnazija','#6B8E23'],['Smeltės progimnazija','#8E44AD']],
 siauliai:[['Didždvario gimnazija','#2471A3'],['Lieporių gimnazija','#CB4335']],
 panevezys:[['Juozo Balčikonio gimnazija','#1F618D'],['Rožyno progimnazija','#B9770E']],
 alytus:[['Adolfo Ramanausko gimnazija','#117864'],['Putinų gimnazija','#922B21']],
 palanga:[['Palangos senoji gimnazija','#2E86C1'],['Baltijos pagrindinė','#AF601A']],
 nida:[['Nidos gimnazija','#16A085'],['Neringos pradinė','#A04000']],
};
Object.entries(SCHOOLS).forEach(([cid,arr])=>arr.forEach(([n,col],k)=>{
  const id='sch_'+cid+k;FACTIONS[id]={name:n,short:n.split(' ')[0],type:'school',league:'school',city:cid,color:col,minAge:13,boss:k?'Ugnė (10 kl.)':'Kipras (11 kl.)',
  desc:'Your school yard is your territory. Tag the rival school, win the yard scuffles, keep your hoop.',school:k}}));
// initial district owners (index matches CITIES[].districts)
const START_OWNERS={
 vilnius:['centras','centras','gopai','gopai','pasienio',null],
 kaunas:[null,'vilkai','vilkai','pasienio','vilkai'],
 klaipeda:[null,'uosto','ziurkes','ziurkes'],
 siauliai:[null,'sakalai','sakalai','uosto'],
 panevezys:[null,'broliai','broliai','broliai'],
 alytus:[null,'pacanai','pasienio','pasienio'],
 palanga:['vanagai','vanagai','uosto'],
 nida:[null,null],
};
const RANKS={
 street:['Pacanas','Bičas','Bachūras','Brigadininkas','Autoritetas','Gangsteris'],
 crew:['Naujas','Savas','Centro veidas','Tilto legenda'],
 auto:['Naujokas','Vairuotojas','Drifteris','Lenktynininkas','Klubo legenda'],
 school:['Pirmokas','Kietas','Kiemo lyderis','Mokyklos karalius'],
};
const RANK_REP={street:[0,50,150,350,700,1200],crew:[0,60,200,500],auto:[0,60,180,400,800],school:[0,40,140,320]};
const rankTable=f=>f.type==='crew'?'crew':f.league==='street'?'street':f.league;

/* ---------- vehicles ---------- */
const CARS={
 bike:{name:'Dviratis „Ereliukas“',kind:'bike',max:170,acc:170,grip:10,len:22,wid:9,price:80,drive:'bike',minAge:6},
 lada:{name:'VAZ-2107 „Žigulis“',max:340,acc:170,grip:5.4,len:44,wid:20,price:600,drive:'rwd',col:'#C8B98F'},
 golf:{name:'VW Golf III',max:380,acc:215,grip:6.6,len:42,wid:20,price:1300,drive:'fwd',col:'#2F5E8E'},
 audi80:{name:'Audi 80 „Bačka“',max:390,acc:205,grip:7.6,len:45,wid:20,price:1500,drive:'awd',col:'#7A1F2B'},
 passat:{name:'VW Passat B5 universalas',max:420,acc:210,grip:6.6,len:48,wid:21,price:1900,drive:'fwd',col:'#4A4F55'},
 w124:{name:'Mercedes W124',max:410,acc:205,grip:6,len:48,wid:21,price:2600,drive:'rwd',col:'#E8E6DF'},
 e36:{name:'BMW E36 318i',max:430,acc:245,grip:5,len:44,wid:20,price:2300,drive:'rwd',col:'#1F3B2D'},
 e39:{name:'BMW E39 525d',max:480,acc:265,grip:5,len:48,wid:21,price:4600,drive:'rwd',col:'#111316'},
 e46:{name:'BMW E46 330i',max:510,acc:305,grip:4.8,len:45,wid:20,price:6900,drive:'rwd',col:'#9DA3A8'},
 prius:{name:'Toyota Prius',max:390,acc:200,grip:7,len:44,wid:20,price:5200,drive:'fwd',col:'#F2F2EE'},
 x5:{name:'BMW X5 E53',max:490,acc:265,grip:6.6,len:48,wid:23,price:9500,drive:'awd',col:'#202428'},
 m5:{name:'BMW M5 E60',max:620,acc:390,grip:4.6,len:48,wid:21,price:24000,drive:'rwd',col:'#3B4A5A'},
 police:{name:'Škoda Octavia (Policija)',max:540,acc:330,grip:7.4,len:46,wid:21,drive:'fwd',col:'#F4F4F0',police:true},
 bus:{name:'Autobusas',max:300,acc:120,grip:8,len:90,wid:26,drive:'rwd',col:'#E8C547',bus:true},
};
const TRAFFIC_MODELS=['golf','golf','passat','passat','audi80','lada','w124','e39','prius','prius','x5','e36','e46'];
const SALE_MODELS=['bike','lada','golf','audi80','passat','w124','e36','e39','e46','prius','x5','m5'];
const TUNES=[
 {id:'eng',name:'Variklio čipas',en:'Engine chip: +8% top speed and pull',price:[400,900,1800],max:3},
 {id:'turbo',name:'Turbina',en:'Turbo: much harder acceleration',price:[1500],max:1},
 {id:'drift',name:'Drift paketas',en:'Drift kit: more steering lock, looser rear',price:[700],max:1},
 {id:'neon',name:'Neoninis apšvietimas',en:'Underglow neon for night meets',price:[250],max:1},
];
const PAINTS=['#111316','#E8E6DF','#7A1F2B','#2F5E8E','#1F3B2D','#E2A11B','#E0458A','#3FA7D6','#59B86A','#6B4FA0','#C46A2A','#9DA3A8'];

/* ---------- people ---------- */
const NAMES={m:['Lukas','Matas','Jokūbas','Dominykas','Nojus','Rokas','Mantas','Tomas','Paulius','Karolis','Domantas','Gytis','Ignas','Arnas'],
 f:['Emilija','Gabija','Austėja','Kamilė','Urtė','Ieva','Milda','Rūta','Gintarė','Viktorija','Liepa','Saulė','Gustė','Ugnė']};
const SURN=[['Kazlauskas','Kazlauskaitė'],['Jankauskas','Jankauskaitė'],['Petrauskas','Petrauskaitė'],['Stankevičius','Stankevičiūtė'],['Vasiliauskas','Vasiliauskaitė'],
 ['Žukauskas','Žukauskaitė'],['Butkus','Butkutė'],['Paulauskas','Paulauskaitė'],['Urbonas','Urbonaitė'],['Kavaliauskas','Kavaliauskaitė'],['Navickas','Navickaitė'],['Rimkus','Rimkutė']];
const AGES=[
 {a:6,t:'Vaikystė',en:'Childhood',sub:'Age 6. First grade starts tomorrow. Bottles, playgrounds, ice cream. No fights, no cars.'},
 {a:13,t:'Paauglystė',en:'Teen',sub:'Age 13. School yard rivalries, the Centras crew, a bike, first trouble.'},
 {a:16,t:'Jaunystė',en:'Youth',sub:'Age 16. Old enough for a car, a drift club, or a gang that will have you.'},
 {a:24,t:'Suaugęs',en:'Adult',sub:'Age 24. Your own money, your own flat, every door open. Cartels take you at 18+.'},
 {a:30,t:'Brandus',en:'Prime',sub:'Age 30. Savings, a decent car and a reputation, for better or worse.'},
];
const CLASSES=[
 {id:'low',t:'Žemesnioji klasė',en:'Lower class',sub:'Social flat in the outer blocks. Parents count every cent.',money:[3,15,40,120,300],allow:[1,3,6],home:'Socialinis būstas',car:null},
 {id:'mid',t:'Vidurinioji klasė',en:'Middle class',sub:'Renovated flat in a panel block, a family car outside.',money:[8,40,120,500,1500],allow:[3,8,15],home:'Butas daugiabutyje',car:'passat'},
 {id:'upper',t:'Aukštesnioji klasė',en:'Upper class',sub:'New-build flat near the centre, holidays in Palanga.',money:[20,100,400,2000,5000],allow:[8,20,40],home:'Naujos statybos butas',car:'e39'},
 {id:'rich',t:'Turtuoliai',en:'Wealthy',sub:'A big house with a fence, a gate and a dog with a name. Everyone knows your surname.',money:[60,300,1500,9000,20000],allow:[20,50,120],home:'Kotedžas',car:'x5'},
];
const PARENTS=[
 {id:'office',t:'Biuro darbas',en:'Office job',sub:'Spreadsheets in a glass tower. Steady allowance, +20% pocket money.',perk:'allow'},
 {id:'mech',t:'Mechanikas',en:'Mechanic',sub:'Grew up in a garage. Car repairs and tuning 40% cheaper, a free old BMW at 16+.',perk:'garage'},
 {id:'army',t:'Kariuomenė',en:'Army',sub:'Dad wakes everyone at 6:00. +25 max health, hits harder.',perk:'army'},
 {id:'gangster',t:'Gangsteris',en:'Gangster',sub:'Dad „knows people“. Start with street rep in his gang, but rivals know your face.',perk:'gang'},
 {id:'police',t:'Policininkas',en:'Police officer',sub:'Mum is a pareigūnė. Police forget about you twice as fast. Gangs trust you less.',perk:'police'},
 {id:'market',t:'Prekiauja turguje',en:'Market trader',sub:'Grew up at the market. Food and shop items 30% cheaper.',perk:'market'},
];
const JOBS=[
 {id:'student',t:'Mokinys / studentas',en:'Student',sub:'School by day. Allowance from parents.',min:13},
 {id:'office',t:'Biuro darbuotojas',en:'Office worker',sub:'€85 a day, 9 to 5, in the business centre.',min:18},
 {id:'courier',t:'Kurjeris',en:'Courier',sub:'Food deliveries on the phone app. Pay per delivery.',min:16},
 {id:'mechanic',t:'Autoservisas',en:'Mechanic',sub:'€70 a day in the garage. Cheaper tuning.',min:16},
 {id:'none',t:'Bedarbis',en:'Unemployed',sub:'All the time in the world, none of the money.',min:16},
];
const SKINS=['#F2D3B8','#E6BC98','#C99671','#9C6B4A'];
const HAIRS=['#E9D49A','#C9A15D','#8A5A32','#4A2F1E','#1E1A18','#B54B2A'];
const OUTFITS=[
 {id:'track',t:'Sportinis kostiumas',col:'#1E1F22',stripe:true},
 {id:'hood',t:'Džemperis',col:'#5B6B73'},
 {id:'jacket',t:'Odinė striukė',col:'#2B2420'},
 {id:'suit',t:'Kostiumas',col:'#2A3140'},
 {id:'bright',t:'Ryškus',col:'#C0392B'},
 {id:'school',t:'Mokyklinė uniforma',col:'#23395B'},
 {id:'zalgiris',t:'Žalgirio marškinėliai',col:'#1E8A4A',jersey:true,shop:true},
];

/* ---------- items ---------- */
const ITEMS={
 kibinas:{n:'Kibinas',en:'Trakai pastry with meat',ic:'🥟',food:28,price:2.5},
 cepelinai:{n:'Cepelinai',en:'Potato dumplings with bacon sauce',ic:'🍲',food:60,price:7},
 saltibarsciai:{n:'Šaltibarščiai',en:'Cold pink beet soup',ic:'🥣',food:35,mood:6,price:4},
 kepta:{n:'Kepta duona',en:'Fried garlic bread',ic:'🍞',food:22,mood:4,price:3},
 kebabas:{n:'Kebabas',en:'3 a.m. kebab',ic:'🌯',food:45,price:5},
 gira:{n:'Gira',en:'Bread kvass',ic:'🥤',food:6,energy:10,price:1.2},
 energ:{n:'Energinis gėrimas',en:'Energy drink',ic:'⚡',energy:30,mood:-2,price:1.5,min:13},
 ledai:{n:'Ledai „Pieno žvaigždės“',en:'Ice cream',ic:'🍦',food:8,mood:12,price:1},
 sakotis:{n:'Šakotis',en:'Spit cake',ic:'🎄',food:20,mood:15,price:6},
 spray:{n:'Dažų balionėlis',en:'Spray can: tag walls and districts',ic:'🎨',price:4,min:13,tool:true},
 bat:{n:'Beisbolo lazda',en:'Baseball bat: +12 punch damage',ic:'🏏',price:25,min:16,tool:true,gear:true},
 bottle:{n:'Tuščias butelis',en:'Empty bottle. 10 ct at any taromatas',ic:'🍾',price:0},
 kontra:{n:'Kontrabanda',en:'Contraband boxes. Police take it if they catch you',ic:'📦',price:0},
 amber:{n:'Gintaras',en:'A piece of Baltic amber',ic:'🟠',price:0,sell:15},
 bandage:{n:'Tvarstis',en:'Bandage: +35 health',ic:'🩹',heal:35,price:6},
};
const SHOPS={
 shop:{name:'Parduotuvė „Maksi“',items:['kibinas','kepta','gira','energ','ledai','saltibarsciai','bandage','spray']},
 kebab:{name:'Kebabinė',items:['kebabas','gira','kepta']},
 cafe:{name:'Kavinė',items:['cepelinai','saltibarsciai','kibinas','sakotis']},
 market:{name:'Turgus',items:['kibinas','saltibarsciai','sakotis','spray','bat','bandage']},
};

/* ---------- words ---------- */
const GLOSS=[
 ['Labas / Sveiki','Hi / Hello (to many)'],['Ačiū','Thank you'],['Viso gero','Goodbye'],['Taip / Ne','Yes / No'],['Jo','Yeah (casual)'],
 ['Nu','Well… (filler word, everywhere)'],['Ane?','Right? Huh? (tag at the end of a sentence)'],['Bičas','Dude, mate'],['Bachūras','Lad, dude (slang)'],
 ['Pacanas','Young guy from the block (from Russian slang)'],['Gopnikas, gopai','Tracksuit street lads squatting by the blocks'],['Babkės','Cash, money (slang)'],
 ['Kieta','Cool, hard'],['Žiauriai','Extremely ("brutally")'],['Šakės','"Pitchforks": we are screwed'],['Stogas','"Roof": protection money racket'],
 ['Brigada','Gang crew (90s word)'],['Autoritetas','Respected figure in the underworld'],['Būstinė','Headquarters'],['Teritorija','Territory, turf'],
 ['Kontrabanda','Contraband (smuggled cigarettes, fuel…)'],['Kartelis','Cartel'],['Pasienis','Border zone'],['Mentai','Cops (rude slang)'],['Pareigūnas','Officer (polite)'],
 ['Šoninis','"Sideways": drifting'],['Bačka','"Barrel": Audi 80 B3/B4'],['Stabdys','Brake. Rankinis = handbrake'],['Taromatas','Bottle-return machine, 10 ct a bottle'],
 ['Kibinai','Trakai pastries, Karaim recipe'],['Cepelinai','Zeppelin-shaped potato dumplings'],['Šaltibarščiai','Cold pink beetroot soup with kefir'],['Kepta duona','Fried bread with garlic'],
 ['Gira','Kvass, fermented bread drink'],['Šakotis','Tree cake baked on a spit'],['Rugsėjo 1-oji','September 1: first school day, flowers for teachers'],
 ['Krepšinis','Basketball, the second religion'],['Mikrorajonas','Soviet-era district of panel blocks'],['Daugiabutis','Apartment block'],['Kotedžas','Detached house'],
 ['Turgus','Market'],['Kebabinė','Kebab shop'],['Autobusų stotis','Bus station'],['Perkėla','Ferry crossing'],['Kopa','Dune'],['Marios','Lagoon (Kuršių marios)'],
 ['Gintaras','Amber'],['Pajūris','Seaside'],['Senamiestis','Old town'],['Tamo','The school e-diary app. It tells your parents everything'],
 ['Kiek kainuoja?','How much is it?'],['Kur…?','Where…?'],['Eime!','Let\'s go!'],['Bliamba','Damn (mild)'],['Valio!','Hooray!'],
];
const TALK_CIV=[['Labas!','Hi!'],['Nu ir oras šiandien…','Some weather today…'],['Žalgiris vėl laimėjo!','Žalgiris won again!'],['Benzinas vėl brangsta.','Petrol\'s going up again.'],
 ['Ko žiūri, ane?','What are you looking at, huh?'],['Neturiu babkių.','Got no cash.'],['Šaltibarščių sezonas!','Cold soup season!'],['Kur čia autobusų stotis?','Where\'s the bus station?'],
 ['Tamo vėl prirašė pastabų…','Tamo gave me notes again…'],['Eime į Palangą!','Let\'s go to Palanga!'],['Mano močiutė kepa geriausius cepelinus.','My grandma makes the best cepelinai.'],
 ['Nu jo, bičas.','Yeah, dude.'],['Viso gero!','Bye!'],['Kieta mašina!','Cool car!'],['Čia ne Vilnius, čia gyvenimas.','This isn\'t Vilnius, this is life.']];
const TALK_GANG=[['Ko čia vaikštai, ane?','What are you walking around here for, huh?'],['Čia mūsų rajonas.','This is our block.'],['Turi babkių?','Got cash?'],
 ['Sėklų nori?','Want some seeds?'],['Nu ką, bachūrai?','So what, lads?']];
const DAYS=['Sekmadienis','Pirmadienis','Antradienis','Trečiadienis','Ketvirtadienis','Penktadienis','Šeštadienis'];
const MONTHS=['sausio','vasario','kovo','balandžio','gegužės','birželio','liepos','rugpjūčio','rugsėjo','spalio','lapkričio','gruodžio'];
const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
