
/* =====================================================================
   INTERIORS
   Walk inside homes, shops, bars, schools, HQs and landmarks. Each POI gets
   a hand-laid room built from a template; furniture you can use replaces
   the old menus (the counter opens the shop, the bed lets you sleep…).
   ===================================================================== */
let SCENE=null;
const worldPos=()=>SCENE?SCENE.ret:(P.inCar||P);
const FLOORS={wood:['#B98B5A','#A97C4E'],lino:['#C9B48A','#BCA67C'],tile:['#E4E4DC','#D2D3CA'],shop:['#EEF0EA','#E0E3DC'],concrete:['#9A9C98','#8E908C'],
  carpet:['#7A3B3B','#6E3434'],grey:['#8C949A','#838B91'],stone:['#C9C2B3','#BDB5A5'],rubber:['#3A3F44','#33383C'],dark:['#6E4E34','#634530'],court:['#D9A35E','#CC9652']};

function mkRoom(w,h,o){const s={w,h,grid:new Uint8Array(w*h),solid:new Uint8Array(w*h),objs:[],peds:[],zones:[],floor:o.floor||'wood',wall:o.wall||'#D8CDB4',
  title:o.title||'',sub:o.sub||'',door:Math.floor(w/2),hostileCount:0};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(y<2||y===h-1||x===0||x===w-1)s.grid[y*w+x]=1}
  s.grid[(h-1)*w+s.door]=0;return s}
const R={
  wallH(s,x0,x1,y,gaps){for(let x=x0;x<=x1;x++){if(gaps&&gaps.includes(x))continue;s.grid[y*s.w+x]=1}},
  wallV(s,x,y0,y1,gaps){for(let y=y0;y<=y1;y++){if(gaps&&gaps.includes(y))continue;s.grid[y*s.w+x]=1}},
  zone(s,x,y,w,h,floor){s.zones.push({x,y,w,h,floor})},
  add(s,k,x,y,w,h,o){const ob=Object.assign({k,x,y,w:w||1,h:h||1},o||{});s.objs.push(ob);if(ob.solid!==false&&!ob.wallDecor)for(let yy=y;yy<y+ob.h;yy++)for(let xx=x;xx<x+ob.w;xx++)s.solid[yy*s.w+xx]=1;return ob},
  deco(s,k,x,y,w,o){return R.add(s,k,x,y,w||1,1,Object.assign({wallDecor:true,solid:false},o||{}))},
  ped(s,kind,x,y,o){const fac=o&&o.fac;const lk=o&&o.lk||randomLook(kind==='staff'?'civ':kind,fac);const e=Object.assign({type:'ped',kind:kind==='staff'?'civ':kind,staff:kind==='staff',x:x*TS+16,y:y*TS+20,hx:x*TS+16,hy:y*TS+20,dir:1,anim:0,
    hp:60,maxhp:60,sp:30,t:rnd(1,4),lk,state:'idle',cd:0,ko:0,talk:0,fac,inside:true},o||{});e.maxhp=e.hp;s.peds.push(e);return e},
};
function staffLook(col,o){return Object.assign({skin:pick(SKINS.slice(0,3)),hair:pick(HAIRS),female:Math.random()<.55,outfit:col,pants:'#2C3440',scale:1},o||{})}
function line(lt,en){return[lt,en]}

/* ---------- templates ---------- */
const PARENT_LINES={office:[line('Vėl visą dieną Excel…','Excel all day again…'),line('Šiandien turėjau tris susirinkimus.','Three meetings today.')],
 mech:[line('Atvaryk mašiną, pažiūrėsiu stabdžius.','Bring the car, I\'ll check the brakes.'),line('BMW? Vėl? Nu gerai…','A BMW? Again? Fine…')],
 army:[line('Lova paklota? Kariuomenėje…','Bed made? In the army…'),line('Atsispaudimai prieš pusryčius!','Push-ups before breakfast!')],
 gangster:[line('Nieko nematei, gerai?','You saw nothing, okay?'),line('Jei kas klaus, aš visą dieną buvau namie.','If anyone asks, I was home all day.')],
 police:[line('Girdėjau, kad kažkas mušėsi kieme. Ne tu?','Heard someone was fighting in the yard. Not you?'),line('Sėsk, papasakok, kur buvai.','Sit down, tell me where you were.')],
 market:[line('Atnešiau šviežių agurkų iš turgaus!','Brought fresh cucumbers from the market!'),line('Šiandien gera prekyba buvo.','Good trading today.')]};
const PARENT_GEN=[line('Ar pavalgei?','Have you eaten?'),line('Neužmiršk kepurės!','Don\'t forget your hat!'),line('Kada grįši namo?','When will you be home?'),line('Tamo vėl rašė…','Tamo wrote again…')];

function tplHome(p){const cls=P.cls,big={low:[10,8],mid:[13,9],upper:[15,10],rich:[19,12]}[cls];const[w,h]=big;
  const s=mkRoom(w,h,{floor:cls==='low'?'lino':'wood',wall:{low:'#C9B98F',mid:'#D9CDB0',upper:'#E6E3DA',rich:'#EDE6D6'}[cls],title:'Namai',sub:CLASSES.find(c=>c.id===cls).home});
  if(cls==='low'){
    R.deco(s,'wallrug',2,1,3);R.deco(s,'window',6,1,2);R.deco(s,'calendar',8,1);
    R.add(s,'sofa',1,2,3,1,{col:'#7A5A3A',act:homeTV,label:'Sofa: watch TV'});R.add(s,'sekcija',5,2,3,1);R.add(s,'tv',8,2,1,1,{crt:true,act:homeTV,label:'Žiūrėti TV · watch TV'});
    R.zone(s,2,3,3,2,'carpet');R.add(s,'rug',2,3,3,2,{solid:false,col:'#8E3B3B'});
    R.add(s,'bed',1,5,2,2,{col:'#6E7FA0',act:homeSleep,label:'Lova · sleep'});R.add(s,'table',4,5,2,1,{chairs:true});
    R.add(s,'fridge',8,4,1,1,{act:homeEat,label:'Šaldytuvas · eat'});R.add(s,'stove',8,5,1,1);R.add(s,'wardrobe',8,6,1,1,{act:openWardrobe,label:'Spinta · wardrobe'});
  }else if(cls==='mid'){
    R.wallV(s,7,2,7,[5]);R.deco(s,'window',2,1,2);R.deco(s,'wallrug',4,1,2);R.deco(s,'window',9,1,2);R.deco(s,'calendar',11,1);
    R.add(s,'tv',2,2,3,1,{act:homeTV,label:'Žiūrėti TV · watch TV'});R.zone(s,2,3,3,2,'carpet');R.add(s,'rug',2,3,3,2,{solid:false,col:'#3E5F7A'});
    R.add(s,'sofa',2,5,3,1,{col:'#5B6B73',act:homeTV,label:'Sofa: watch TV'});R.add(s,'sekcija',5,2,2,1);R.add(s,'plant',1,2);R.add(s,'plant',6,7);
    R.add(s,'bed',10,2,2,2,{col:'#C46A2A',act:homeSleep,label:'Lova · sleep'});R.add(s,'desk',8,2,2,1,{pc:true,act:homePC,label:'Kompiuteris · computer'});
    R.add(s,'wardrobe',11,6,1,2,{act:openWardrobe,label:'Spinta · wardrobe'});R.add(s,'fridge',1,6,1,1,{act:homeEat,label:'Šaldytuvas · eat'});R.add(s,'stove',1,7,1,1);R.add(s,'table',8,6,2,1,{chairs:true});
  }else if(cls==='upper'){
    R.wallV(s,10,2,8,[4,5]);R.deco(s,'window',2,1,3);R.deco(s,'painting',6,1);R.deco(s,'window',11,1,3);R.deco(s,'calendar',8,1);
    R.add(s,'kitchen',1,2,4,1,{act:homeEat,label:'Virtuvė · cook and eat'});R.add(s,'island',2,4,3,1);R.add(s,'tv',6,2,3,1,{flat:true,act:homeTV,label:'Žiūrėti TV · watch TV'});
    R.zone(s,6,4,3,2,'carpet');R.add(s,'rug',6,4,3,2,{solid:false,col:'#B7B09C'});R.add(s,'sofa',6,6,3,1,{col:'#2A3140',act:homeTV,label:'Sofa: watch TV'});
    R.add(s,'plant',1,7);R.add(s,'plant',9,2);R.add(s,'bed',12,2,2,2,{col:'#E8E6DF',act:homeSleep,label:'Lova · sleep'});R.add(s,'desk',11,6,2,1,{pc:true,act:homePC,label:'Kompiuteris · computer'});
    R.add(s,'wardrobe',13,6,1,2,{act:openWardrobe,label:'Spinta · wardrobe'});
  }else{
    R.wallV(s,12,2,10,[5,6]);R.wallH(s,13,17,7,[15]);R.deco(s,'window',2,1,3);R.deco(s,'painting',6,1);R.deco(s,'window',8,1,3);R.deco(s,'window',14,1,2);R.deco(s,'calendar',11,1);
    R.add(s,'kitchen',1,2,4,1,{act:homeEat,label:'Virtuvė · cook and eat'});R.add(s,'island',1,4,3,1);R.add(s,'fireplace',6,2,2,1);
    R.zone(s,5,4,5,3,'carpet');R.add(s,'rug',5,4,5,3,{solid:false,col:'#8C2F2F'});R.add(s,'sofa',5,7,4,1,{col:'#3B2A22',act:homeTV,label:'Sofa: watch TV'});R.add(s,'tv',9,2,2,1,{flat:true,act:homeTV,label:'Žiūrėti TV · watch TV'});
    R.add(s,'pool',2,8,3,2,{act:()=>{skipHours(1);setMood(8);log('A game of pool at home. You won (it\'s your table).','good')},label:'Biliardas · pool'});
    R.add(s,'plant',11,2);R.add(s,'plant',1,10);R.add(s,'bed',14,2,3,2,{col:'#6B4FA0',act:homeSleep,label:'Lova · sleep'});R.add(s,'desk',13,5,2,1,{pc:true,act:homePC,label:'Kompiuteris · computer'});
    R.add(s,'wardrobe',17,5,1,2,{act:openWardrobe,label:'Spinta · wardrobe'});R.zone(s,13,8,5,3,'tile');R.add(s,'bath',16,8,2,1);R.add(s,'toilet',13,10,1,1,{solid:true});R.add(s,'sink',14,8,1,1);
    if(!P.dog)R.ped(s,'pet',9,9,{pet:'dog',name:'Reksas',lines:[line('Au au!','Woof!')],lk:{skin:'#B07A45',hair:'#B07A45',outfit:'#B07A45',scale:1}});
  }
  if(P.dog){let dx=Math.floor(w/2)+2,dy=h-3;for(let k=0;k<30&&(s.solid[dy*w+dx]||s.grid[dy*w+dx]);k++){dx=ri(1,w-2);dy=ri(2,h-2)}R.ped(s,'pet',dx,dy,{pet:'dog',name:P.dog.name,lines:[line('Au!','Woof!'),line('*vizgina uodegą*','*wags tail*')],lk:{skin:P.dog.col,hair:P.dog.col,outfit:P.dog.col,scale:1}})}
  // family or pet
  if(P.age<24){const mum=R.ped(s,'staff',Math.floor(w/2)-1,h-3,{name:P.parent==='army'||P.parent==='gangster'||P.parent==='mech'?'Tėtis':'Mama',lk:staffLook(pick(['#7A3B3B','#3E5F7A','#6B7F4A','#5E4B5B'])),lines:[...(PARENT_LINES[P.parent]||[]),...PARENT_GEN],act:familyTalk});mum.lk.female=mum.name==='Mama';mum.lk.hair=pick(['#8A5A32','#4A2F1E','#C9A15D'])}
  if(P.age<24&&P.sib)R.ped(s,'staff',2,h-3,{name:P.sib.name,lk:Object.assign(randomLook(P.sib.age<13?'kid':'civ'),{female:P.sib.f,scale:P.sib.age<13?.74:.92}),lines:P.sib.age<P.age?[line('Ar galiu su tavim?','Can I come with you?'),line('Aš pasakysiu mamai!','I\'m telling mum!'),line('Pažaisim?','Wanna play?')]:[line('Neliesk mano daiktų.','Don\'t touch my stuff.'),line('Paskolink penkis eurus?','Lend me five euros?'),line('Ar matei mano kroksus?','Have you seen my headphones?')]});
  else if(cls!=='rich'&&!P.dog)R.ped(s,'pet',Math.floor(w/2)+1,h-3,{pet:'cat',name:'Murkė',lines:[line('Miau.','Meow.'),line('Murrr…','Purr…')],lk:{skin:'#6E6E6E',hair:'#6E6E6E',outfit:'#6E6E6E',scale:1}});
  return s}
function tplShop(p){const s=mkRoom(15,11,{floor:'shop',wall:'#E9EDE6',title:p.name,sub:'Parduotuvė'});
  R.add(s,'fridgeShop',1,2,4,1);R.add(s,'fridgeShop',6,2,4,1);R.add(s,'fridgeShop',11,2,3,1);
  [[2,4],[8,4],[2,6],[8,6]].forEach(([x,y],i)=>R.add(s,'shelf',x,y,4,1,{seed:i}));
  R.add(s,'counter',2,8,3,1,{reg:true,act:()=>{if(!queueEvent(p))poiMenu(p)},label:'Kasa · checkout'});R.ped(s,'staff',3,7,{name:'Kasininkė',lk:staffLook('#C1272D',{female:true}),lines:[line('Laba diena! Ar turite „Maksi“ kortelę?','Good day! Do you have a Maksi card?'),line('Maišelio reikia?','Need a bag?')],act:()=>poiMenu(p)});
  R.add(s,'taromatas',12,8,1,1,{act:returnBottles,label:'Taromatas · return bottles'});R.deco(s,'sign',6,1,3,{txt:'MAKSI',col:'#C1272D'});
  R.ped(s,'staff',10,9,{name:'Apsaugininkas',lk:staffLook('#1D2724',{female:false,cap:'#1D2724'}),lines:[line('Kuprinę parodyk.','Show me your backpack.'),line('Čia nevaikščiok su ledais.','No ice cream in here.')]});
  return s}
function tplKebab(p){const s=mkRoom(10,8,{floor:'tile',wall:'#E9D7A8',title:p.name,sub:'Kebabinė'});
  R.add(s,'spit',3,2,1,1);R.add(s,'counter',2,3,5,1,{act:()=>poiMenu(p),label:'Užsisakyti · order'});R.deco(s,'menu',5,1,3);
  R.ped(s,'staff',5,2,{name:'Ahmedas',lk:staffLook('#F1EBDD',{female:false,skin:SKINS[2]}),lines:[line('Su viskuo? Aštrus padažas?','With everything? Hot sauce?'),line('Trečią nakties visi ateina pas mane.','At 3 a.m. everyone comes to me.')],act:()=>poiMenu(p)});
  R.add(s,'table',7,5,1,1,{chairs:true});R.add(s,'table',2,5,1,1,{chairs:true});
  return bizHook(s,p)}
function tplCafe(p){const s=mkRoom(12,8,{floor:'wood',wall:'#E6C3B3',title:p.name,sub:'Kavinė'});
  R.add(s,'counter',7,3,4,1,{coffee:true,act:()=>poiMenu(p),label:'Meniu · order'});R.ped(s,'staff',8,2,{name:'Padavėja',lk:staffLook('#2B2420',{female:true}),lines:[line('Cepelinai su spirgais ar su grietine?','Cepelinai with bacon or sour cream?'),line('Šaltibarščiai šiandien skaniausi.','The cold soup is best today.')],act:()=>poiMenu(p)});
  R.deco(s,'painting',2,1);R.deco(s,'painting',4,1);R.deco(s,'window',9,1,2);
  [[2,3],[2,5],[5,5]].forEach(([x,y])=>R.add(s,'table',x,y,1,1,{chairs:true,cloth:true}));R.add(s,'plant',1,2);R.add(s,'plant',10,6);
  R.ped(s,'civ',4,3,{sit:true,lines:[line('Skanu, kaip pas močiutę.','Tasty, like at grandma\'s.')]});
  return bizHook(s,p)}
function tplMarket(p){const s=mkRoom(16,11,{floor:'concrete',wall:'#B8C4BB',title:p.name,sub:'Turgus'});
  const goods=['#C0392B','#E2A11B','#3E8E5E','#8E44AD','#D35400','#7FB77E'];
  [[2,3],[6,3],[10,3],[2,7],[6,7],[10,7]].forEach(([x,y],i)=>{R.add(s,'stall',x,y,3,1,{col:goods[i],act:()=>poiMenu(p),label:i===5?'Gintaras ir prekės · amber and goods':'Prekystalis · stall'});
    R.ped(s,'staff',x+1,y-1,{name:'Pardavėja',lk:Object.assign(randomLook('elder'),{female:true}),lines:[line('Pirk, vaikeli, švieži!','Buy, child, they\'re fresh!'),line('Agurkai iš mano daržo.','Cucumbers from my garden.'),line('Gintaras tikras, iš Palangos!','Real amber, from Palanga!')],act:()=>poiMenu(p)})});
  R.deco(s,'sign',6,1,4,{txt:'TURGUS',col:'#1E6B4A'});return s}
function tplBar(p){const s=mkRoom(13,9,{floor:'dark',wall:'#5B3A2E',title:p.name,sub:'Baras'});
  R.deco(s,'bottles',2,1,5);R.add(s,'counter',2,3,6,1,{bar:true,act:()=>poiMenu(p),label:'Baras · order'});R.deco(s,'tvwall',9,1,2);
  R.ped(s,'staff',4,2,{name:'Barmenas',lk:staffLook('#1D1F22',{female:false}),lines:[line('Nu, kaip sekasi?','So, how\'s it going?'),line('Žalgiris šiandien žaidžia, prisėsk.','Žalgiris plays tonight, sit down.')],act:()=>poiMenu(p)});
  R.add(s,'pool',9,4,3,2,{act:()=>poiMenu(p),label:'Biliardas · pool'});[[2,6],[5,6]].forEach(([x,y])=>R.add(s,'table',x,y,1,1,{chairs:true}));
  R.ped(s,'civ',3,5,{lines:[line('Kai buvau jaunas, čia buvo „Bambalynė“…','When I was young this was the Bambalynė…')]});R.ped(s,'civ',10,7,{lines:[line('Moki žaisti biliardą?','Can you play pool?')]});
  return bizHook(s,p)}
function tplGarage(p){const s=mkRoom(15,10,{floor:'concrete',wall:'#8C949A',title:p.name,sub:'Autoservisas'});
  const c=garageCar(p);R.add(s,'lift',2,3,4,3,{car:c?{model:c.model,color:c.color}:{model:pick(['golf','e39','audi80']),color:pick(PAINTS)},act:()=>openGarage(p),label:c?'Keltuvas: your car':'Keltuvas · lift'});
  R.deco(s,'tools',7,1,4);R.add(s,'tyres',12,2,2,1);R.add(s,'desk',9,6,2,1,{pc:true,act:()=>openGarage(p),label:'Kompiuteris: buy and tune'});
  R.ped(s,'staff',10,5,{name:'Stasys',lk:staffLook('#2D4F7A',{female:false}),lines:[line('Ko reikia, bičas? Tepalus pakeisim?','What do you need, dude? Oil change?'),line('Šitas BMW dar nuvažiuos milijoną.','This BMW will do another million.')],act:()=>openGarage(p)});
  R.add(s,'tyres',1,7,1,1);R.add(s,'barrel',13,7,1,1);return bizHook(s,p)}
function tplPolice(p){const s=mkRoom(15,10,{floor:'lino',wall:'#C8D2DA',title:p.name,sub:'Policija'});
  R.wallV(s,11,2,8);R.add(s,'bars',11,3,1,5,{solid:true});s.grid[5*15+11]=0;R.add(s,'counter',4,4,5,1,{act:()=>poiMenu(p),label:'Budėtojas · front desk'});
  R.ped(s,'police',6,3,{name:'Budėtojas',lines:[line('Laba diena. Kuo galiu padėti?','Good day. How can I help?'),line('Užpildykite formą.','Fill in the form.')],act:()=>poiMenu(p),staffCop:true});
  R.deco(s,'wanted',1,1,2,{act:wantedBoard,label:'Ieškomi · wanted board'});R.deco(s,'flag',8,1);R.add(s,'bench',1,7,3,1);R.add(s,'bench',6,7,3,1);
  R.add(s,'bench',12,7,2,1);R.ped(s,'civ',13,4,{name:'Sulaikytasis',lines:[line('Aš nekaltas! Čia ne mano mašina!','I\'m innocent! It\'s not my car!'),line('Turi cigaretę?','Got a cigarette?')]});
  return s}
function tplHospital(p){const s=mkRoom(15,10,{floor:'tile',wall:'#E8EEF0',title:p.name,sub:'Ligoninė'});
  R.add(s,'counter',2,4,4,1,{act:()=>poiMenu(p),label:'Registratūra · reception'});R.ped(s,'staff',3,3,{name:'Slaugytoja',lk:staffLook('#7FB7C9',{female:true}),lines:[line('Ar turite siuntimą?','Do you have a referral?'),line('Gydytojas tuoj priims.','The doctor will see you soon.')],act:()=>poiMenu(p)});
  [9,11,13].forEach(x=>R.add(s,'hospbed',x,2,1,2));R.ped(s,'staff',10,5,{name:'Gydytojas',lk:staffLook('#F4F4F0',{female:false}),lines:[line('Mažiau muštynių, daugiau daržovių.','Fewer fights, more vegetables.')]});
  R.add(s,'bench',2,7,3,1);R.add(s,'plant',13,7);R.deco(s,'sign',6,1,2,{txt:'+',col:'#B5332B'});return s}
function tplGym(p){const s=mkRoom(15,10,{floor:'rubber',wall:'#3A4248',title:p.name,sub:'Sporto klubas'});
  R.add(s,'benchpress',2,3,2,1,{act:()=>gymTrain(p),label:'Štanga · bench press'});R.add(s,'treadmill',6,2,1,2,{act:()=>{if(P.energy<15)return log('Too tired.','bad');P.energy-=15;P.maxHp=Math.min(160,P.maxHp+1);skipHours(1);log('Run done. Max health +1.','good')},label:'Bėgtakis · treadmill'});
  R.add(s,'treadmill',8,2,1,2);[11,13].forEach(x=>R.add(s,'punchbag',x,3,1,1,{act:()=>gymTrain(p),label:'Bokso kriaušė · punch bag'}));R.deco(s,'mirror',2,1,3);
  R.add(s,'hoopwall',6,6,3,1,{act:()=>openHoops(()=>{}),label:'Krepšinis · shoot hoops'});
  R.ped(s,'staff',8,5,{name:'Treneris',lk:staffLook('#C0392B',{female:false,stripe:true}),lines:[line('Dar dešimt kartų!','Ten more!'),line('Be skausmo nėra rezultato.','No pain, no gain.')],act:()=>poiMenu(p)});
  R.ped(s,'civ',12,6,{lines:[line('Kiek spaudi?','How much do you bench?')]});return s}
function tplSchool(p){const s=mkRoom(18,12,{floor:'lino',wall:'#D6DFC9',title:p.name,sub:P.school===p.fac?'Tavo mokykla':'Kita mokykla'});
  R.wallH(s,1,16,6,[4,13]);R.wallV(s,9,2,5);R.zone(s,10,2,7,4,'court');
  R.deco(s,'board',3,1,4,{act:()=>attendClass(p),label:'Lenta: attend class'});
  for(let yy=3;yy<=4;yy++)for(const xx of[2,4,6])R.add(s,'schooldesk',xx,yy,1,1);
  R.ped(s,'staff',7,2,{name:'Mokytoja',lk:staffLook('#6B4FA0',{female:true,hair:'#8A8A8A'}),lines:[line('Kur namų darbai?','Where is your homework?'),line('Telefonus į kuprines!','Phones in your bags!')],act:()=>openSchool(p)});
  R.deco(s,'hoop',12,1,2,{act:()=>openHoops((sc)=>{if(P.faction===p.fac)gainRep(p.fac,sc)}),label:'Krepšinis · shoot hoops'});
  for(let x=1;x<=16;x+=2){if(x===3||x===5||x===13||x===15)continue;R.add(s,'locker',x,7,1,1)}
  R.deco(s,'flag',16,1);
  const f=FACTIONS[p.fac];const rivalSide=P.faction&&FACTIONS[P.faction].league==='school'&&P.faction!==p.fac&&P.age>=13;
  for(let k=0;k<4;k++){const e=R.ped(s,'school',ri(2,15),ri(8,10),{fac:p.fac,lines:[line('Labas!','Hi!'),line('Rytoj kontrolinis…','Test tomorrow…'),line('Eime per pertrauką į kiemą.','Let\'s go to the yard at break.')]});if(rivalSide){e.angry=true;s.hostileCount++}}
  if(rivalSide&&!(G.raids&&G.raids[p.fac]===G.time.day))s.schoolRaid=p.fac;
  return s}
function tplOffice(p){const s=mkRoom(16,10,{floor:'grey',wall:'#DCE3E6',title:p.name,sub:'Verslo centras'});
  R.wallV(s,11,2,8,[5]);R.deco(s,'window',2,1,3);R.deco(s,'window',7,1,3);R.deco(s,'window',13,1,2);
  [[2,3],[5,3],[8,3],[2,6],[5,6]].forEach(([x,y],i)=>R.add(s,'desk',x,y,2,1,{pc:true,act:i===0?()=>poiMenu(p):null,label:i===0?'Tavo stalas · your desk':null}));
  R.add(s,'cooler',9,6,1,1,{act:()=>{setMood(2);log(pick(['„Girdėjai, kad Jonas išeina?“','„Penktadienį komandos formavimas…“','„Kas suvalgė mano jogurtą?“']),'amb')},label:'Vandens aparatas · gossip'});
  R.add(s,'desk',13,3,2,1,{pc:true});R.add(s,'desk',13,6,2,1,{pc:true,act:openRealEstate,label:'NT agentūra · buy a home or move'});R.ped(s,'staff',14,7,{name:'NT agentė',lk:staffLook('#B5332B',{female:true}),lines:[line('Puikus butas, tik reikia remonto!','Lovely flat, just needs renovating!')],act:openRealEstate});R.ped(s,'staff',14,2,{name:'Viršininkas',lk:staffLook('#2A3140',{female:false}),lines:[line('Ataskaita bus iki penktadienio?','Report by Friday?'),line('Mes – viena šeima.','We are one family.')],act:()=>poiMenu(p)});
  R.ped(s,'civ',6,2,{lines:[line('Dar tik antradienis…','It\'s only Tuesday…')]});return s}
function tplBus(p){const s=mkRoom(15,9,{floor:'tile',wall:'#C9D4DC',title:p.name,sub:'Autobusų stotis'});
  R.add(s,'ticket',5,2,4,1,{act:()=>openBus(p),label:'Kasa · buy a ticket'});R.deco(s,'depboard',10,1,4,{act:()=>openBus(p),label:'Išvykimai · departures'});
  R.add(s,'bench',2,5,3,1);R.add(s,'bench',9,5,3,1);R.add(s,'vending',13,2,1,1,{act:()=>{if(pay(1.5)){give('energ',1);log('The machine drops a can. Clunk.')}},label:'Automatas · €1.50 drink'});
  R.ped(s,'elder',3,4,{lines:[line('Autobusas į Uteną vėl vėluoja.','The Utena bus is late again.')]});R.ped(s,'civ',11,4,{lines:[line('Važiuoju į Palangą, jūra laukia!','Off to Palanga, the sea awaits!')]});return s}
function tplHQ(p){const f=FACTIONS[p.hq];const cartel=f.type==='cartel',auto=f.type==='auto';
  const s=mkRoom(13,9,{floor:auto?'concrete':cartel?'dark':'concrete',wall:auto?'#3A4248':'#7A7F78',title:p.name,sub:f.name});
  R.deco(s,'banner',5,1,3,{col:f.color,txt:f.short.toUpperCase()});
  if(auto){R.add(s,'lift',1,3,4,3,{car:{model:pick(['e46','e36','audi80','m5']),color:f.color}});R.deco(s,'neon',9,1,3,{col:f.color,txt:f.short});R.add(s,'tyres',10,3,2,1);R.add(s,'sofa',7,6,3,1,{col:'#1D1F22'})}
  else{R.add(s,'sofa',1,2,3,1,{col:'#5A4A3A'});R.deco(s,'wallrug',9,1,3);R.add(s,'table',5,4,2,1,{cards:true});R.add(s,'boxes',9,3,2,2);R.add(s,'punchbag',11,6,1,1,{act:()=>gymTrain(null),label:'Kriaušė · punch bag'});
    if(cartel){R.add(s,'moneytable',1,6,2,1);R.deco(s,'mapwall',1,1,2)}}
  const mine=P.faction===p.hq,mf=myFac();const raid=!mine&&mf&&mf.league==='street'&&f.league==='street'&&P.age>=13&&!(G.raids&&G.raids[p.hq]===G.time.day);
  const boss=R.ped(s,'boss',6,3,{fac:p.hq,name:f.boss,hp:120,lines:[line('Ko atėjai?','What are you here for?')],act:()=>openHQ(p)});
  for(let k=0;k<(raid?4:2);k++){const e=R.ped(s,'gang',ri(2,10),ri(5,7),{fac:p.hq,hp:ri(55,80),lines:mine?[line('Sveikas, broli.','Hey, brother.'),line('Viskas ramu rajone.','All quiet on the block.')]:TALK_GANG});if(raid){e.angry=true;s.hostileCount++}}
  if(raid){boss.angry=true;s.hostileCount++;s.raid=p.hq;boss.act=null}
  return s}
function tplLandmark(p){const k=p.b&&p.b.kind;
  if(k==='cathedral'){const s=mkRoom(15,12,{floor:'stone',wall:'#EDE8DC',title:p.name,sub:'Šventovė'});R.add(s,'altar',6,2,3,1);
    for(let y=4;y<=9;y+=2){R.add(s,'pew',2,y,4,1);R.add(s,'pew',9,y,4,1)}R.add(s,'candles',12,2,2,1,{act:()=>{if(pay(1)){setMood(10);log('You light a candle. A quiet moment.','good')}},label:'Uždegti žvakę · light a candle (€1)'});
    [1,13].forEach(x=>R.add(s,'column',x,4,1,1));R.ped(s,'elder',3,10,{lines:[line('Šventas Kazimieras globoja Lietuvą.','Saint Casimir watches over Lithuania.')]});return s}
  if(k==='castle'||k==='palace'){const amber=k==='palace';const s=mkRoom(14,10,{floor:amber?'wood':'stone',wall:amber?'#E8DCC0':'#B5533A',title:p.name,sub:'Muziejus'});
    const info=amber?[['Baltic amber is fossil tree resin, about 40 million years old.','Gintaras'],['Some pieces have insects trapped inside, perfectly preserved.','Inkliuzai'],['The Tiškevičiai family built this palace in 1897.','Rūmai'],['The famous „Sun Stone“ weighs about 3.5 kg.','Saulės akmuo']]
      :[['The Grand Duchy of Lithuania once stretched from the Baltic to the Black Sea.','LDK'],['Vytautas the Great finished the island castle in the early 1400s.','Vytautas'],['The Karaim people came here with Vytautas and brought kibinai with them.','Karaimai'],['In 1410 at Žalgiris (Grunwald) Lithuanians and Poles beat the Teutonic Order.','Žalgiris']];
    info.forEach((t,i)=>R.add(s,'display',2+i*3,4,2,1,{amber,act:()=>{if(!G.flags['ex_'+p.id+i]){G.flags['ex_'+p.id+i]=1;setMood(4)}log(`<b>${t[1]}</b>: ${t[0]}`,'amb')},label:'Eksponatas: '+t[1]}));
    if(!amber){R.add(s,'armor',2,2,1,1);R.add(s,'armor',11,2,1,1);R.deco(s,'flag',6,1)}else R.add(s,'counter',9,7,3,1,{act:()=>{if(pay(12)){give('amber',1);log('Bought an amber souvenir.','good')}},label:'Suvenyrai · amber souvenir (€12)'});
    R.ped(s,'staff',7,7,{name:'Gidė',lk:staffLook('#1E6B4A',{female:true}),lines:[line('Fotografuoti be blykstės, prašau.','No flash photos, please.'),line('Ekskursija prasideda kas valandą.','Tours start every hour.')]});return s}
  if(k==='mall')return tplMall(Object.assign({},p,{name:/Akropol/.test(p.name)?'Akropolis':'Prekybos centras'}));
  if(k==='theatre'){const s=mkRoom(15,11,{floor:'carpet',wall:'#5B2C2C',title:p.name,sub:'Teatras'});R.add(s,'stage',2,2,11,2,{act:()=>{if(pay(8)){skipHours(3);setMood(20);log('A three-hour play. You only fell asleep once.','good')}},label:'Žiūrėti spektaklį · watch a play (€8)'});
    for(let y=5;y<=8;y++)R.add(s,'seats',2,y,11,1,{solid:y!==8});return s}
  if(k==='arena'){const s=mkRoom(17,11,{floor:'concrete',wall:'#1E6B4A',title:p.name,sub:'Arena'});R.zone(s,4,3,9,4,'court');R.add(s,'court',4,3,9,4,{solid:false});
    R.add(s,'seats',2,8,13,1,{act:watchGame,label:'Žiūrėti krepšinį · watch a game (€15)'});R.add(s,'seats',1,3,2,4);R.add(s,'seats',14,3,2,4);R.deco(s,'banner',7,1,3,{col:'#1E8A4A',txt:'ŽALGIRIS'});return s}
  return null}
function bizHook(s,p){const b=BIZ[p.kind];if(!b)return s;const own=G.biz&&G.biz.includes(p.id);
  R.deco(s,'certificate',1,1,1,{act:()=>{if(own)return log(`This place is yours. It earns ${eur(b.income)} a day.`,'good');if(P.age<b.min)return log(`You need to be ${b.min}+ to own a business.`,'bad');
    if(!pay(b.price))return;G.biz=(G.biz||[]);G.biz.push(p.id);toast('€',`Tavo verslas: ${p.name}`,`+${eur(b.income)} every day.`);chron(`Bought ${p.name}.`)},label:own?'Tavo verslas · your business':`Pirkti verslą · buy this place (${eur(b.price)})`});return s}
const BIZ={kebab:{price:12000,income:90,min:18},cafe:{price:20000,income:140,min:18},bar:{price:30000,income:210,min:21},garage:{price:42000,income:280,min:21}};

/* ---------- actions inside ---------- */
function homeSleep(){const m=G.time.min;const add=m<7*60?7*60-m:1440-m+7*60;fadeScreen();skipHours(add/60);P.energy=100;P.hp=P.maxHp;setMood(5);saveGame();log('Labas rytas! Good morning.','good')}
function homeEat(){if(G.flags.ateAt===G.time.day){log('The fridge is empty until tomorrow.','bad');return}G.flags.ateAt=G.time.day;P.food=Math.min(100,P.food+45);log(pick(['Mum\'s cepelinai. Skanu!','Leftover šaltibarščiai.','Bread, butter and a cucumber. Classic.']),'good')}
function homeTV(){skipHours(1);setMood(6);P.energy=Math.min(100,P.energy+4);log(pick(['Žalgiris won by 12. The neighbours are shouting.','„Eurovizija“ rerun. Lithuania got 12 points from Latvia.','The news: petrol prices up again.','A Lithuanian soap opera. Someone has a secret twin.']),'amb')}
function homePC(){openModal(mHead('PC','Kompiuteris','Home computer')+`<div class="mbody">${act('Žaisti žaidimus','Play games for two hours. +mood, -energy.','Žaisti',()=>{skipHours(2);setMood(10);P.energy-=10;log('Two hours gone. Worth it.','good');closeModal()})}
  ${act('Darbų skelbimai','Open the job board (same as your phone).','Atidaryti',()=>openPhone())}${P.age>=30?act('Epilogas','See how your life turned out so far.','Žiūrėti',()=>epilogue()):''}${act('Žemėlapis','Plan a route.','Atidaryti',()=>openMap())}
  ${act('Užaugti','Skip years ahead to the next stage of life.','Kalendorius',()=>{closeModal();growMenu()},!AGES.find(a=>a.a>P.age))}</div><div class="mfoot"><button class="btn" onclick="closeModal()">Uždaryti</button></div>`)}
function growMenu(){const nxt=AGES.find(a=>a.a>P.age);if(!nxt)return;openModal(mHead('📅','Užaugti',`Skip ahead to age ${nxt.a}`)+`<div class="mbody scene"><p>${nxt.sub}</p><p class="note">Years pass in a moment. You keep your money, crew and memories.</p></div><div class="mfoot"><button class="btn ghost" onclick="closeModal()">Ne dabar</button><button class="btn amber" onclick="leaveScene(false,true);growUp(${nxt.a})">Užaugti iki ${nxt.a}</button></div>`)}
function familyTalk(e){if(P.age<13&&!G.mission&&Math.random()<.5){bubble(e,'Nubėk į parduotuvę, gerai?');startMission('errand');return}
  if(G.flags.hug!==G.time.day){G.flags.hug=G.time.day;setMood(6);if(P.age<18&&Math.random()<.4){const n=ri(2,6);P.money+=n;log(`${e.name} slips you ${eur(n)}. „Tik nesakyk niekam.“`,'good')}}
  const l=pick(e.lines);bubble(e,l[0]);log(`${e.name}: „${esc(l[0])}“ <i>${esc(l[1])}</i>`)}
function returnBottles(){const n=has('bottle');if(!n){log('No bottles to return. Look around yards and parks.','bad');return}give('bottle',-n);P.money+=n*.1;P.stats.bottles=(P.stats.bottles||0)+n;SND.coin();G.flags.tara=true;
  const M=G.mission;if(M&&M.type==='bottles'&&has('bottle')<=0){M.pay=1;missionDone(`${n} bottles`)}log(`Taromatas: ${n} × €0.10 = ${eur(n*.1)}`,'good')}
function gymTrain(p){if(P.age<13){log('Kids train in the school gym. Come back at 13.','bad');return}if(P.energy<25){log('Too tired. Sleep first.','bad');return}if(P.fight>=10){log('Fighting skill maxed.');return}
  const fee=p?15:0;if(fee&&!pay(fee))return;P.fight++;P.energy-=25;skipHours(2);setMood(4);SND.hit(.4);log(`Fighting skill: ${P.fight}/10`,'good')}
function attendClass(p){if(P.school!==p.fac){log('Not your school. Your classes are elsewhere.','bad');return}if(P.age>=19){log('You finished school years ago.');return}
  const h0=G.time.min/60,wd=G.time.dow>=1&&G.time.dow<=5;if(!(wd&&h0>=7.5&&h0<11)){log('Lessons run on weekdays. Arrive between 7:30 and 11:00.','bad');return}
  fadeScreen();skipHours(14-h0);G.attended=true;P.energy-=15;setMood(-4);log(pick(['Math test: 8/10. Tamo: „Puiku!“','History: the Grand Duchy reached the Black Sea. Cool.','PE: you won the basketball game.','Lithuanian: a whole lesson about Donelaitis.','Biology: frogs. Nobody is happy.']),'good')}
function wantedBoard(){const st=Math.ceil(P.heat);log(st?`Your face is on the board. ${'★'.repeat(st)}`:'Wanted: „Ieškomas dviračio vagis“. Not you, for once.',st?'bad':'amb')}
function watchGame(){if(!pay(15))return;skipHours(2);const w=Math.random()<.68;setMood(w?25:5);log(w?'Žalgiris won! The whole arena sings „Ten, kur Nemunas banguoja“.':'Žalgiris lost by two. Grown men cry in the stands.',w?'good':'amb')}
function fadeScreen(){const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:#0d1412;opacity:1;transition:opacity .8s;z-index:30;pointer-events:none';document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),900)}))}
function garageCar(p){if(P.inCar&&P.inCar.owned!==undefined)return P.inCar;let best=null,bd=10*TS;ENT.cars.forEach(c=>{if(c.owned===undefined)return;const d=dist(c.x,c.y,p.x,p.y);if(d<bd){bd=d;best=c}});return best}

/* ---------- enter / leave ---------- */
const TPL={train:p=>{const s=tplBus(p);s.sub='Geležinkelio stotis';s.objs.forEach(o=>{if(o.k==='ticket'||o.k==='depboard'){o.act=()=>openTravel('train',p);o.label=o.k==='ticket'?'Bilietų kasa · train tickets':'Traukiniai · departures'}});return s},fuel:tplFuel,home:tplHome,shop:tplShop,kebab:tplKebab,cafe:tplCafe,market:tplMarket,bar:tplBar,garage:tplGarage,police:tplPolice,hospital:tplHospital,gym:tplGym,school:tplSchool,office:tplOffice,bus:tplBus,hq:tplHQ,landmark:tplLandmark};
function openPOI(p){
  if(POI_HANDLERS[p.kind])return POI_HANDLERS[p.kind](p);
  if(!isOpen(p.kind)&&!(p.kind==='garage'&&G.biz&&G.biz.includes(p.id))){log(closedMsg(p.kind),'bad');return}
  if(p.kind==='landmark'&&p.hq)return poiMenu(p);
  const f=TPL[p.kind];const s=f&&!P.inCar?f(p):null;if(!s)return poiMenu(p);
  if(p.kind==='bar'&&P.age<13){log('„Vaikams čia ne vieta.“ The bartender sends you out.','bad');return}
  enterScene(s,p)}
function enterScene(s,p){s.poi=p;s.ret={x:p.x,y:p.y+20};SCENE=s;ENT.bubbles=[];$('#hud').classList.add('inside');P.x=s.door*TS+16;P.y=(s.h-1)*TS+4;P.dir=3;keys.clear();fadeScreen();SND.door();
  if(p.kind==='hq')G.flags.hqVisit=true;if(p.kind==='school'&&P.school===p.fac)G.flags.schoolVisit=true;
  if(!G.flags.intHint){G.flags.intHint=true;log('Inside: walk up to furniture or people and press <b>E</b> when a prompt shows. Walk out through the door at the bottom.','amb')}
  if(s.raid)toast('!!',`Būstinės reidas`,`${FACTIONS[s.raid].short} will not let you walk out. Knock them all out.`);
  $('#speedo').classList.add('hidden');PROMPT=null;showPrompt();updateZone()}
function leaveScene(silent,keepPos){if(!SCENE)return;const r=SCENE.ret;SCENE=null;ENT.bubbles=[];$('#hud').classList.remove('inside');if(!keepPos){P.x=r.x;P.y=r.y;P.dir=1}keys.clear();if(!silent){fadeScreen();SND.door()}updateZone();PROMPT=null;showPrompt();crewList().forEach(e=>{e.x=P.x+rnd(-24,24);e.y=P.y+rnd(6,26)});ENT.peds.forEach(e=>{if(e.kind==='dog'){e.x=P.x+16;e.y=P.y+10}})}

/* ---------- interior update ---------- */
function iSolid(px,py){const s=SCENE,x=Math.floor(px/TS),y=Math.floor(py/TS);if(x<0||x>=s.w||y<0)return true;if(y>=s.h)return x!==s.door;const i=y*s.w+x;return s.grid[i]===1||s.solid[i]===1}
function iBlocked(x,y,r){return iSolid(x-r,y-r)||iSolid(x+r,y-r)||iSolid(x-r,y+r)||iSolid(x+r,y+r)}
function iMove(e,dx,dy,r){if(!iBlocked(e.x+dx,e.y,r))e.x+=dx;if(!iBlocked(e.x,e.y+dy,r))e.y+=dy}
function updateInterior(dt){const s=SCENE;
  tickTime(dt);P.punchCd-=dt;P.punchT-=dt;P.inv_t-=dt;P.hitFlash-=dt;
  let mx=0,my=0;if(keys.has('KeyW')||keys.has('ArrowUp'))my--;if(keys.has('KeyS')||keys.has('ArrowDown'))my++;if(keys.has('KeyA')||keys.has('ArrowLeft'))mx--;if(keys.has('KeyD')||keys.has('ArrowRight'))mx++;
  if(JOY.on){mx=JOY.x;my=JOY.y}const L=Math.hypot(mx,my);if(L>1){mx/=L;my/=L}
  const sp=(P.age<10?95:115)*((keys.has('ShiftLeft')||keys.has('ShiftRight'))?1.4:1);
  if(L>0){P.anim+=dt*10;P.dir=Math.abs(mx)>Math.abs(my)?(mx>0?0:2):(my>0?1:3);iMove(P,mx*sp*dt,my*sp*dt,8)}
  if(P.y>(s.h-1)*TS+22){if(s.raid&&s.peds.some(e=>e.angry&&!(e.ko>0))){P.y=(s.h-1)*TS+10;log('The door is blocked. Fight your way out!','bad')}else{leaveScene();return}}
  for(const e of s.peds){updateIPed(e,dt);if(SCENE!==s)return}
  if(s.pickups)for(const k of s.pickups){if(!k.got&&dist(k.x,k.y,P.x,P.y)<22){k.got=true;give('bottle',1);SND.blip(880);missionEvent('bottle')}}
  if(P.heat>0&&s.poi.kind!=='police'){HEAT.calm+=dt*2;if(HEAT.calm>6+P.heat*2){P.heat=Math.max(0,Math.ceil(P.heat)-1);HEAT.calm=0;if(!P.heat)log('You laid low inside. The police moved on.','good')}}
  for(const f of ENT.fx){f.life-=dt;if(f.k==='spark'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=300*dt}else f.r+=dt*14}ENT.fx=ENT.fx.filter(f=>f.life>0);
  for(const b of ENT.bubbles)b.life-=dt;ENT.bubbles=ENT.bubbles.filter(b=>b.life>0);
  if(s.schoolRaid&&!s.raidDone&&s.peds.filter(e=>e.angry).every(e=>e.ko>0)){s.raidDone=true;G.raids=G.raids||{};G.raids[s.schoolRaid]=G.time.day;gainRep(P.faction,30);G.flags.scuffleWin=true;toast('MOK','Mokyklų karas','You stormed the rival school corridor. Rep +30.');chron(`Stormed ${FACTIONS[s.schoolRaid].name}.`);SND.fanfare()}
  if(s.raid&&!s.raidDone&&s.peds.filter(e=>e.angry).every(e=>e.ko>0)){s.raidDone=true;raidWon(s.raid)}
  tickMission(dt);tickExam(dt);
  acc1+=dt;acc2+=dt;if(acc1>.2){acc1=0;PROMPT=findPromptI();showPrompt()}if(acc2>1){acc2=0;checkQuest();checkGoals();hudUpdate();updateZone()}
  musicTick(dt);ENGINE.target=0}
function updateIPed(e,dt){if(e.ko>0){e.ko-=dt;if(e.ko<=0){e.ko=0;e.hp=e.maxhp*.5;e.angry=false}return}
  e.cd-=dt;e.talk-=dt;if(e.punch>0)e.punch-=dt;let vx=0,vy=0;const pd=dist(e.x,e.y,P.x,P.y);
  if(e.angry&&P.age>=13){const a=Math.atan2(P.y-e.y,P.x-e.x);if(pd>22){vx=Math.cos(a)*105;vy=Math.sin(a)*105}else if(e.cd<=0){e.cd=rnd(.8,1.2);e.punch=.2;hurtPlayer(e.kind==='school'?ri(4,7):ri(6,12),e)}}
  else if(!e.sit){e.t-=dt;if(e.t<=0){e.t=rnd(2,5);e.idle=Math.random()<.55||e.staff;e.dir=ri(0,3)}
    if(!e.idle){const D=[[1,0],[0,1],[-1,0],[0,-1]][e.dir];vx=D[0]*(e.pet?45:28);vy=D[1]*(e.pet?45:28);if(dist(e.x+vx,e.y+vy,e.hx,e.hy)>(e.pet?90:60)){e.dir=(e.dir+2)%4;vx=-vx;vy=-vy}}
    else if(pd<60)e.dir=Math.abs(P.x-e.x)>Math.abs(P.y-e.y)?(P.x>e.x?0:2):(P.y>e.y?1:3)}
  if(vx||vy){e.anim+=dt*10;e.dir=Math.abs(vx)>Math.abs(vy)?(vx>0?0:2):(vy>0?1:3);iMove(e,vx*dt,vy*dt,7)}}
function raidWon(fid){G.flags.captured=true;const f=FACTIONS[fid];G.raids=G.raids||{};G.raids[fid]=G.time.day;const loot=ri(150,320);P.money+=loot;gainRep(P.faction,40);
  const d=DISTRICTS.find(d=>d.owner===fid&&d.city===SCENE.poi.city)||DISTRICTS.find(d=>d.owner===fid);
  if(d){d.owner=P.faction;refreshOverlay();G.news.unshift(`${dateStr()}: ${FACTIONS[P.faction].name} raided ${f.name} and took ${d.name}.`)}
  toast(f.short.slice(0,3).toUpperCase(),'Reidas pavyko',`+${eur(loot)} from the safe, rep +40${d?`, and ${d.name} is yours`:''}.`);SND.fanfare();chron(`Raided the ${f.name} HQ.`);crime(1,'Raid on a rival HQ')}
function findPromptI(){const s=SCENE;if(P.y>(s.h-1)*TS-20&&Math.abs(P.x-(s.door*TS+16))<30)return{key:'↓',text:'Išeiti · walk out'};
  let best=null,bd=1e9;
  for(const e of s.peds){if(e.ko>0||e.angry)continue;const d=dist(e.x,e.y,P.x,P.y);if(d<34&&d<bd){bd=d;best={key:'E',text:e.name?`${e.name}${e.act?'':' · talk'}`:'Kalbėti · talk',fn:()=>iTalk(e)}}}
  for(const o of s.objs){if(!o.act)continue;const ox=clamp(P.x,o.x*TS,(o.x+o.w)*TS),oy=clamp(P.y,o.y*TS,(o.y+o.h)*TS+(o.wallDecor?TS:0));const d=dist(ox,oy,P.x,P.y);
    if(d<28&&d<bd){bd=d;best={key:'E',text:o.label||'Naudoti',fn:()=>o.act()}}}
  return best}
function iTalk(e){if(e.act){if(e.lines&&e.talk<=0){const l=pick(e.lines);bubble(e,l[0]);e.talk=3}return e.act(e)}if(e.talk>0)return;e.talk=3;const l=pick(e.lines||TALK_CIV);bubble(e,l[0]);log(`${e.name?e.name+': ':''}„${esc(l[0])}“ <i>${esc(l[1])}</i>`)}

/* ---------- interior render ---------- */
function renderInterior(){const s=SCENE,Z=ZOOM*(VW<700?1.05:1.15);ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#141B1E';ctx.fillRect(0,0,VW,VH);
  const rw=s.w*TS,rh=s.h*TS;let cx=rw*Z<VW?rw/2:clamp(P.x,VW/2/Z,rw-VW/2/Z),cy=rh*Z<VH-140?rh/2:clamp(P.y,VH/2/Z-60,rh-VH/2/Z+60);
  const ox=VW/2/Z-cx,oy=VH/2/Z-cy;let sx=0,sy=0;if(SHAKE>0){sx=rnd(-SHAKE,SHAKE);sy=rnd(-SHAKE,SHAKE);SHAKE*=.88;if(SHAKE<.3)SHAKE=0}
  ctx.setTransform(DPR*Z,0,0,DPR*Z,(ox+sx)*DPR*Z,(oy+sy)*DPR*Z);
  // floor
  for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){if(s.grid[y*s.w+x]===1)continue;let fl=s.floor;for(const z of s.zones)if(x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)fl=z.floor;drawFloor(x,y,fl)}
  // door mat + outside light
  ctx.fillStyle='#4A3B2E';ctx.fillRect(s.door*TS+4,(s.h-1)*TS+6,24,20);ctx.fillStyle='rgba(255,240,200,.18)';ctx.fillRect(s.door*TS,(s.h-1)*TS+20,TS,12);
  // walls
  for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)if(s.grid[y*s.w+x]===1)drawIWall(s,x,y);
  for(const o of s.objs)if(o.wallDecor)drawIObj(o);
  for(const o of s.objs)if(!o.wallDecor&&o.solid===false)drawIObj(o);
  if(s.pickups)for(const k of s.pickups)if(!k.got)drawPickup(k);
  const D=[];for(const o of s.objs)if(!o.wallDecor&&o.solid!==false)D.push({y:(o.y+o.h)*TS-2,o});for(const e of s.peds)D.push({y:e.y,e});D.push({y:P.y,p:1});D.sort((a,b)=>a.y-b.y);
  for(const d of D){if(d.o)drawIObj(d.o);else if(d.e){const e=d.e;if(e.pet)drawPet(e);else drawPerson(ctx,e.x,e.y,e.lk,e.dir,e.anim,{ko:e.ko>0,punch:e.punch>0,badge:e.angry?'#FF3B2F':null})}
    else{drawPerson(ctx,P.x,P.y,playerLook(),P.dir,P.anim,{punch:P.punchT>0,item:P.gear.bat&&P.age>=16?'bat':null})}}
  for(const f of ENT.fx){const a=f.life/f.max;if(f.k==='spark'){ctx.fillStyle=f.col;ctx.globalAlpha=a;ctx.fillRect(f.x,f.y,3,3);ctx.globalAlpha=1}}
  ctx.font='600 12px "IBM Plex Sans",sans-serif';ctx.textAlign='center';
  for(const b of ENT.bubbles){const e=b.e;if(!e||!e.inside&&e!==P)continue;const X=e.x,Y=e.y-62;const w=ctx.measureText(b.text).width+14;ctx.globalAlpha=Math.min(1,b.life*2);
    ctx.fillStyle='#F7F8F4';ctx.strokeStyle='#26343A';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(X-w/2,Y-18,w,22,8);ctx.fill();ctx.stroke();ctx.fillStyle='#1D2724';ctx.fillText(b.text,X,Y-3);ctx.globalAlpha=1}
  // names over staff
  ctx.font='700 10px "IBM Plex Sans",sans-serif';for(const e of s.peds){if(!e.name||e.ko>0)continue;if(dist(e.x,e.y,P.x,P.y)>110)continue;ctx.fillStyle='rgba(29,39,36,.75)';const w=ctx.measureText(e.name).width+8;ctx.fillRect(e.x-w/2,e.y-(e.pet?36:70)*(e.lk.scale||1),w,14);ctx.fillStyle='#fff';ctx.fillText(e.name,e.x,e.y-(e.pet?36:70)*(e.lk.scale||1)+10)}
  ctx.textAlign='left';
  // soft vignette, evening warmth
  ctx.setTransform(DPR,0,0,DPR,0,0);const nl=nightLevel();if(nl>.2){ctx.fillStyle=`rgba(255,180,90,${nl*.08})`;ctx.fillRect(0,0,VW,VH)}
  if(P.hitFlash>0){ctx.fillStyle=`rgba(181,51,43,${P.hitFlash})`;ctx.fillRect(0,0,VW,VH)}}
function drawFloor(x,y,fl){const[c1,c2]=FLOORS[fl]||FLOORS.wood,px=x*TS,py=y*TS,g=ctx;
  if(fl==='wood'||fl==='dark'||fl==='court'){g.fillStyle=c1;g.fillRect(px,py,TS,TS);g.fillStyle=c2;for(let k=0;k<4;k++){const off=((x*3+k*5)%4)*8;g.fillRect(px,py+k*8,TS,1);g.fillRect(px+off,py+k*8,1,8)}}
  else if(fl==='tile'||fl==='shop'||fl==='stone'){g.fillStyle=(x+y)%2?c1:c2;g.fillRect(px,py,TS,TS);g.fillStyle='rgba(0,0,0,.06)';g.fillRect(px,py,TS,1);g.fillRect(px,py,1,TS)}
  else if(fl==='lino'){g.fillStyle=c1;g.fillRect(px,py,TS,TS);g.fillStyle=c2;g.fillRect(px+4,py+4,10,10);g.fillRect(px+18,py+18,10,10)}
  else if(fl==='carpet'){g.fillStyle=c1;g.fillRect(px,py,TS,TS);g.fillStyle='rgba(255,220,150,.08)';g.fillRect(px+((x+y)%2)*16,py,16,TS)}
  else{g.fillStyle=c1;g.fillRect(px,py,TS,TS);if(hash2(x,y)>.8){g.fillStyle=c2;g.fillRect(px+hash2(y,x)*20,py+8,8,4)}}}
function drawIWall(s,x,y){const g=ctx,px=x*TS,py=y*TS,fl=(xx,yy)=>xx>=0&&yy>=0&&xx<s.w&&yy<s.h&&s.grid[yy*s.w+xx]!==1;
  if(fl(x,y+1)){g.fillStyle=s.wall;g.fillRect(px,py,TS,TS);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(px,py+TS-5,TS,5);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(px,py,TS,2);
    if(!fl(x,y-1)&&!(y>0&&s.grid[(y-1)*s.w+x]===1&&fl(x,y+1)&&y===1)){}if(y>1&&fl(x,y-1)){g.fillStyle='#2A2F33';g.fillRect(px,py,TS,6)}}
  else if(fl(x,y+2)&&y+1<s.h&&s.grid[(y+1)*s.w+x]===1){g.fillStyle=s.wall;g.fillRect(px,py,TS,TS);g.fillStyle='#2A2F33';g.fillRect(px,py,TS,6)}
  else{g.fillStyle='#2A2F33';g.fillRect(px,py,TS,TS);g.fillStyle='#3A4045';g.fillRect(px+2,py+2,TS-4,TS-4)}}
function box(px,py,pw,ph,H,top,front){const g=ctx;g.fillStyle='rgba(0,0,0,.18)';g.fillRect(px+3,py+ph-4,pw,6);g.fillStyle=front;g.fillRect(px,py+ph-H,pw,H);g.fillStyle=top;g.fillRect(px,py-H,pw,ph)}
function drawIObj(o){const g=ctx,px=o.x*TS,py=o.y*TS,pw=o.w*TS,ph=o.h*TS;
  switch(o.k){
  case 'window':g.fillStyle='#6E5434';g.fillRect(px+3,py+3,pw-6,TS-12);g.fillStyle=nightLevel()>.3?'#1E2A44':'#A9D3E8';g.fillRect(px+6,py+6,pw-12,TS-18);g.fillStyle='#6E5434';g.fillRect(px+pw/2-1,py+6,2,TS-18);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(px+8,py+8,6,8);break;
  case 'wallrug':{g.fillStyle='#8E2F2F';g.fillRect(px+2,py-14,pw-4,TS+8);g.strokeStyle='#D9A35E';g.lineWidth=2;g.strokeRect(px+5,py-11,pw-10,TS+2);g.fillStyle='#1F3B5A';for(let k=0;k<o.w;k++){g.beginPath();g.moveTo(px+16+k*TS,py-6);g.lineTo(px+26+k*TS,py+4);g.lineTo(px+16+k*TS,py+14);g.lineTo(px+6+k*TS,py+4);g.fill()}break}
  case 'calendar':g.fillStyle='#F7F8F4';g.fillRect(px+8,py+2,16,20);g.fillStyle='#B5332B';g.fillRect(px+8,py+2,16,5);break;
  case 'painting':g.fillStyle='#8C6A3C';g.fillRect(px+4,py,24,20);g.fillStyle=hash2(o.x,o.y)>.5?'#6E9F55':'#3D6D8D';g.fillRect(px+7,py+3,18,14);g.fillStyle='#E2A11B';g.beginPath();g.arc(px+20,py+7,3,0,7);g.fill();break;
  case 'sign':g.fillStyle=o.col;g.fillRect(px+2,py+2,pw-4,20);g.fillStyle='#fff';g.font='900 15px "Big Shoulders Display",sans-serif';g.textAlign='center';g.fillText(o.txt,px+pw/2,py+18);g.textAlign='left';break;
  case 'banner':g.fillStyle=o.col;g.fillRect(px+4,py-6,pw-8,TS);g.fillStyle='rgba(255,255,255,.9)';g.font='900 14px "Big Shoulders Display",sans-serif';g.textAlign='center';g.fillText(o.txt,px+pw/2,py+14);g.textAlign='left';break;
  case 'neon':{const t=performance.now()/500;g.shadowColor=o.col;g.shadowBlur=12+Math.sin(t)*4;g.strokeStyle=o.col;g.lineWidth=2;g.strokeRect(px+4,py+2,pw-8,20);g.fillStyle=o.col;g.font='900 15px "Big Shoulders Display",sans-serif';g.textAlign='center';g.fillText(o.txt,px+pw/2,py+18);g.textAlign='left';g.shadowBlur=0;break}
  case 'menu':g.fillStyle='#1D2724';g.fillRect(px+2,py+1,pw-4,22);g.fillStyle='#E2A11B';g.font='700 9px "IBM Plex Mono",monospace';['KEBABAS 5€','LĖKŠTĖ 7€','GIRA 1,2€'].forEach((t,i)=>g.fillText(t,px+6+i*30,py+15));break;
  case 'bottles':g.fillStyle='#4A3022';g.fillRect(px+2,py+4,pw-4,4);g.fillRect(px+2,py+16,pw-4,4);for(let k=0;k<o.w*5;k++){g.fillStyle=['#2E7D32','#8D6E63','#C9A227','#5D4037','#B0BEC5'][k%5];g.fillRect(px+5+k*6,py-6+(k%2)*12,4,10)}break;
  case 'tvwall':g.fillStyle='#111';g.fillRect(px+4,py-2,pw-8,24);g.fillStyle='#1E8A4A';g.fillRect(px+7,py+1,pw-14,18);g.fillStyle='#D9A35E';g.fillRect(px+12,py+8,pw-24,6);break;
  case 'tools':g.fillStyle='#5A6064';g.fillRect(px+2,py-2,pw-4,TS-2);g.strokeStyle='#C9CCC8';g.lineWidth=2;for(let k=0;k<o.w*3;k++){g.beginPath();g.moveTo(px+8+k*10,py+2);g.lineTo(px+8+k*10,py+18);g.stroke()}break;
  case 'mirror':g.fillStyle='#9FB7C3';g.fillRect(px+2,py-4,pw-4,TS);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(px+10,py-2,12,TS-6);break;
  case 'board':g.fillStyle='#8C6A3C';g.fillRect(px+2,py-6,pw-4,TS);g.fillStyle='#2F4F3A';g.fillRect(px+5,py-3,pw-10,TS-6);g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1;g.beginPath();g.moveTo(px+12,py+6);g.lineTo(px+60,py+6);g.moveTo(px+12,py+13);g.lineTo(px+44,py+13);g.stroke();g.fillStyle='#fff';g.font='600 9px "IBM Plex Sans"';g.fillText('2+2=4',px+70,py+12);break;
  case 'hoop':g.fillStyle='#fff';g.fillRect(px+16,py-8,32,20);g.strokeStyle='#B5332B';g.lineWidth=2;g.strokeRect(px+26,py-2,12,8);g.strokeStyle='#E2621B';g.beginPath();g.ellipse(px+32,py+16,8,3,0,0,7);g.stroke();break;
  case 'wanted':g.fillStyle='#C9B98F';g.fillRect(px+2,py-2,pw-4,TS-4);for(let k=0;k<3;k++){g.fillStyle='#F7F8F4';g.fillRect(px+6+k*18,py+1,14,18);g.fillStyle='#56645F';g.beginPath();g.arc(px+13+k*18,py+8,4,0,7);g.fill()}break;
  case 'flag':g.fillStyle='#FDB913';g.fillRect(px+6,py,20,6);g.fillStyle='#006A44';g.fillRect(px+6,py+6,20,6);g.fillStyle='#C1272D';g.fillRect(px+6,py+12,20,6);break;
  case 'depboard':{g.fillStyle='#111';g.fillRect(px+2,py-4,pw-4,TS);g.fillStyle='#E2A11B';g.font='700 8px "IBM Plex Mono",monospace';const cs=CITIES.filter(c=>c.id!==SCENE.poi.city).slice(0,3);cs.forEach((c,i)=>g.fillText(`${String(9+i*2).padStart(2,'0')}:${i*15||'00'} ${c.name.toUpperCase()}`,px+6,py+5+i*8));break}
  case 'mapwall':g.fillStyle='#E8DCC0';g.fillRect(px+2,py-2,pw-4,TS-4);g.fillStyle='#86A85F';g.beginPath();g.moveTo(px+8,py+4);g.lineTo(px+40,py+2);g.lineTo(px+52,py+14);g.lineTo(px+20,py+20);g.fill();g.fillStyle='#B5332B';g.fillRect(px+44,py+12,3,3);break;
  case 'certificate':g.fillStyle=G.biz&&G.biz.includes(SCENE.poi.id)?'#E2A11B':'#F7F8F4';g.fillRect(px+8,py+2,16,20);g.strokeStyle='#8C6A3C';g.strokeRect(px+8,py+2,16,20);g.fillStyle='#B5332B';g.beginPath();g.arc(px+16,py+16,3,0,7);g.fill();break;
  case 'rug':g.fillStyle=o.col;g.fillRect(px+4,py+4,pw-8,ph-8);g.strokeStyle='rgba(255,230,180,.45)';g.lineWidth=2;g.strokeRect(px+9,py+9,pw-18,ph-18);break;
  case 'court':g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=2;g.strokeRect(px+4,py+4,pw-8,ph-8);g.beginPath();g.moveTo(px+pw/2,py+4);g.lineTo(px+pw/2,py+ph-4);g.stroke();g.beginPath();g.arc(px+pw/2,py+ph/2,20,0,7);g.stroke();break;
  case 'sofa':box(px,py,pw,ph,14,shade(o.col,.1),shade(o.col,-.2));ctx.fillStyle=shade(o.col,-.1);ctx.fillRect(px,py-14,pw,8);ctx.fillRect(px,py-14,6,ph);ctx.fillRect(px+pw-6,py-14,6,ph);break;
  case 'bed':box(px,py,pw,ph,12,'#F2EEE6','#8C6A3C');ctx.fillStyle=o.col;ctx.fillRect(px+2,py-12+ph*.35,pw-4,ph*.65-2);ctx.fillStyle='#FFFFFF';ctx.fillRect(px+5,py-9,pw-10,ph*.25);break;
  case 'tv':if(o.crt){box(px+2,py+4,pw-4,ph-4,22,'#2B2B2B','#3A3A3A');g.fillStyle='#5B7A8A';g.fillRect(px+6,py+4-22+ph-4-18,pw-12,14)}else{box(px,py+8,pw,ph-8,10,'#6E4E34','#5A3E28');g.fillStyle='#111';g.fillRect(px+8,py-26,pw-16,22);g.fillStyle=nightLevel()>.2?'#3D6D8D':'#2A4A5A';g.fillRect(px+10,py-24,pw-20,18)}break;
  case 'sekcija':box(px,py,pw,ph,40,'#6E4E34','#7E5A3C');g.fillStyle='rgba(180,220,230,.5)';g.fillRect(px+4,py+ph-36,pw/2-6,20);g.fillStyle='#E9E2D0';for(let k=0;k<4;k++)g.fillRect(px+8+k*6,py+ph-30,3,8);break;
  case 'wardrobe':box(px,py,pw,ph,44,'#7E5A3C','#8C6A3C');g.fillStyle='#5A3E28';g.fillRect(px+pw/2-1,py+ph-40,2,36);break;
  case 'fridge':box(px+2,py,pw-4,ph,40,'#E8ECEC','#D9DEDE');g.fillStyle='#9AA0A3';g.fillRect(px+pw-10,py+ph-34,2,12);break;
  case 'stove':box(px+2,py,pw-4,ph,18,'#3A3F44','#D9DEDE');g.fillStyle='#111';g.beginPath();g.arc(px+11,py-10,4,0,7);g.arc(px+21,py-10,4,0,7);g.fill();break;
  case 'kitchen':box(px,py,pw,ph,18,'#C9CED1','#E8E6DF');g.fillStyle='#9AA0A3';g.fillRect(px+10,py-14,20,10);g.fillStyle='#111';g.beginPath();g.arc(px+pw-20,py-10,4,0,7);g.arc(px+pw-34,py-10,4,0,7);g.fill();break;
  case 'island':box(px,py,pw,ph,18,'#E8E6DF','#6E4E34');break;
  case 'table':box(px+3,py+3,pw-6,ph-6,14,o.cloth?'#F2EEE6':'#9C7448','#7E5A3C');if(o.chairs){g.fillStyle='#5A3E28';g.fillRect(px-6,py+8,7,10);g.fillRect(px+pw-1,py+8,7,10)}
    if(o.cards){g.fillStyle='#fff';for(let k=0;k<5;k++)g.fillRect(px+8+k*9,py-8,6,8);g.fillStyle='#B5332B';g.fillRect(px+pw-16,py-9,8,5)}break;
  case 'desk':box(px+2,py,pw-4,ph,14,'#C9B08A','#9C7448');if(o.pc){g.fillStyle='#222';g.fillRect(px+pw/2-10,py-30,20,16);g.fillStyle='#3D6D8D';g.fillRect(px+pw/2-8,py-28,16,12);g.fillStyle='#ccc';g.fillRect(px+pw/2-8,py-12,16,3)}break;
  case 'plant':g.fillStyle='#8C5A3C';g.fillRect(px+10,py+12,12,14);g.fillStyle='#3E8E5E';g.beginPath();g.arc(px+16,py+4,10,0,7);g.arc(px+10,py+10,7,0,7);g.arc(px+22,py+10,7,0,7);g.fill();break;
  case 'fireplace':box(px,py,pw,ph,30,'#8C8F8A','#7A7D78');g.fillStyle='#2A1A10';g.fillRect(px+14,py+ph-24,pw-28,18);{const t=performance.now()/120;g.fillStyle='#E2621B';g.beginPath();g.arc(px+pw/2,py+ph-10,5+Math.sin(t)*2,0,7);g.fill()}break;
  case 'pool':box(px,py,pw,ph,12,'#1E6B4A','#5A3E28');g.fillStyle='#fff';g.beginPath();g.arc(px+20,py+4,3,0,7);g.fill();g.fillStyle='#B5332B';g.beginPath();g.arc(px+pw-30,py+10,3,0,7);g.arc(px+pw-24,py+14,3,0,7);g.fill();g.fillStyle='#E2A11B';g.beginPath();g.arc(px+pw-26,py+6,3,0,7);g.fill();break;
  case 'bath':box(px,py,pw,ph,14,'#F4F4F0','#E8E6DF');g.fillStyle='#A9D3E8';g.fillRect(px+5,py-11,pw-10,ph-6);break;
  case 'toilet':box(px+8,py+6,16,20,10,'#F4F4F0','#E8E6DF');break;
  case 'sink':box(px+4,py+4,pw-8,ph-8,16,'#F4F4F0','#C9CED1');break;
  case 'fridgeShop':box(px,py,pw,ph,44,'#C9CED1','#DDE4E6');for(let k=0;k<o.w;k++){g.fillStyle='rgba(169,211,232,.6)';g.fillRect(px+3+k*TS,py+ph-40,TS-6,34);for(let r=0;r<3;r++){g.fillStyle=['#E2A11B','#C1272D','#3E8E5E','#F7F8F4'][(k+r)%4];g.fillRect(px+6+k*TS,py+ph-36+r*11,TS-12,6)}}break;
  case 'shelf':box(px,py,pw,ph,30,'#9AA0A3','#C9CED1');for(let k=0;k<o.w*4;k++){g.fillStyle=['#C1272D','#E2A11B','#2D5DA8','#3E8E5E','#8E44AD','#D35400'][(k*7+o.seed)%6];g.fillRect(px+3+k*8,py+ph-26,6,9);g.fillRect(px+3+k*8,py+ph-13,6,9)}break;
  case 'counter':box(px,py,pw,ph,20,o.bar?'#5A3E28':'#C9CED1',o.bar?'#4A3022':'#9AA0A3');if(o.reg){g.fillStyle='#222';g.fillRect(px+8,py-30,18,12);g.fillStyle='#3E8E5E';g.fillRect(px+10,py-28,14,5)}
    if(o.coffee){g.fillStyle='#3A3F44';g.fillRect(px+pw-30,py-36,20,18);g.fillStyle='#F7F8F4';g.fillRect(px+10,py-26,8,8)}if(o.bar){g.fillStyle='#C9A227';for(let k=0;k<3;k++)g.fillRect(px+20+k*14,py-34,4,14)}break;
  case 'taromatas':box(px+2,py,pw-4,ph,42,'#1E6B4A','#2E8A5E');g.fillStyle='#111';g.fillRect(px+10,py+ph-30,12,8);g.fillStyle='#E2A11B';g.fillRect(px+8,py+ph-40,16,5);break;
  case 'spit':box(px+6,py+4,pw-12,ph-4,40,'#7A7D78','#9AA0A3');g.fillStyle='#A0522D';g.beginPath();g.ellipse(px+pw/2,py-18,8,16,0,0,7);g.fill();break;
  case 'stall':box(px,py,pw,ph,16,o.col,'#7E5A3C');for(let k=0;k<o.w*3;k++){g.fillStyle=shade(o.col,(k%3-1)*.2);g.beginPath();g.arc(px+6+k*10,py-10,4,0,7);g.fill()}g.fillStyle='rgba(255,255,255,.5)';g.fillRect(px,py-30,pw,4);break;
  case 'lift':{g.fillStyle='#5A6064';g.fillRect(px,py,pw,ph);g.fillStyle='#E2A11B';g.fillRect(px+4,py+4,8,ph-8);g.fillRect(px+pw-12,py+4,8,ph-8);const car=o.car;g.save();g.translate(px+pw/2,py+ph/2-14);g.scale(2.2,2.2);drawCar(g,{x:0,y:0,ang:0,model:car.model,color:car.color});g.restore();break}
  case 'tyres':for(let k=0;k<o.w*2;k++){g.fillStyle='#1A1A1A';g.beginPath();g.ellipse(px+8+k*14,py+20-((k%2)*12),8,6,0,0,7);g.fill();g.fillStyle='#555';g.beginPath();g.ellipse(px+8+k*14,py+20-((k%2)*12),3,2,0,0,7);g.fill()}break;
  case 'barrel':box(px+6,py+6,20,20,24,'#2D5DA8','#244C8A');break;
  case 'bars':g.fillStyle='#3A3F44';for(let k=0;k<o.h*3;k++)g.fillRect(px+12,py+k*11-20,8,3);g.fillStyle='#5A6064';g.fillRect(px+14,py-24,4,ph+20);for(let k=0;k<o.h;k++){g.fillRect(px+10,py+k*TS-8,12,4)}break;
  case 'bench':box(px+2,py+8,pw-4,ph-12,10,'#8C6A3C','#6E4E34');break;
  case 'hospbed':box(px+2,py,pw-4,ph,12,'#F4F4F0','#9AA0A3');g.fillStyle='#7FB7C9';g.fillRect(px+4,py-12+ph*.4,pw-8,ph*.6-2);break;
  case 'benchpress':box(px,py+6,pw,ph-6,10,'#1D1F22','#111');g.fillStyle='#9AA0A3';g.fillRect(px-6,py-24,pw+12,4);g.fillStyle='#111';g.fillRect(px-8,py-30,6,16);g.fillRect(px+pw+2,py-30,6,16);break;
  case 'treadmill':box(px+4,py,pw-8,ph,8,'#2A2F33','#1D1F22');g.fillStyle='#555';g.fillRect(px+6,py-6,pw-12,ph-14);g.fillStyle='#3A3F44';g.fillRect(px+4,py-30,pw-8,8);break;
  case 'punchbag':g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(px+16,py+26,10,4,0,0,7);g.fill();g.fillStyle='#555';g.fillRect(px+15,py-40,2,14);g.fillStyle='#B5332B';g.beginPath();g.roundRect(px+7,py-28,18,46,8);g.fill();break;
  case 'hoopwall':g.fillStyle='rgba(255,255,255,.6)';g.fillRect(px,py+28,pw,2);g.fillStyle='#E2621B';g.beginPath();g.arc(px+pw/2,py+16,7,0,7);g.fill();break;
  case 'schooldesk':box(px+3,py+6,pw-6,ph-8,12,'#C9B08A','#9C7448');g.fillStyle='#3A4E8C';g.fillRect(px+8,py+ph-4,16,6);break;
  case 'locker':box(px+2,py,pw-4,ph,44,'#5E7A9A','#6E8AAA');g.fillStyle='#3A4E6A';g.fillRect(px+6,py+ph-38,3,6);break;
  case 'ticket':box(px,py,pw,ph,40,'#C9D4DC','#9AA0A3');g.fillStyle='rgba(169,211,232,.7)';g.fillRect(px+8,py+ph-38,pw-16,22);drawPerson(g,px+pw/2,py+ph-14,{skin:SKINS[1],hair:'#4A2F1E',female:true,outfit:'#1F618D',scale:.7},1,0,{});g.fillStyle='#1F618D';g.fillRect(px,py+ph-14,pw,8);break;
  case 'vending':box(px+2,py,pw-4,ph,44,'#B5332B','#C1272D');g.fillStyle='rgba(255,255,255,.7)';g.fillRect(px+6,py+ph-38,14,24);break;
  case 'cooler':box(px+8,py+6,16,20,30,'#A9D3E8','#E8ECEC');break;
  case 'boxes':for(let k=0;k<4;k++){const bx=px+(k%2)*28,by=py+Math.floor(k/2)*24;box(bx+2,by+6,26,20,16,'#C8A878','#A8865A')}break;
  case 'moneytable':box(px,py,pw,ph,14,'#5A3E28','#4A3022');g.fillStyle='#7FB77E';for(let k=0;k<6;k++)g.fillRect(px+6+k*9,py-10-(k%2)*3,8,5);break;
  case 'altar':box(px,py,pw,ph,24,'#F4F1E8','#E2DCCB');g.fillStyle='#C9A227';g.fillRect(px+pw/2-2,py-44,4,22);g.fillRect(px+pw/2-8,py-38,16,4);break;
  case 'pew':box(px,py+6,pw,ph-6,12,'#7E5A3C','#5A3E28');break;
  case 'candles':box(px,py+8,pw,ph-8,12,'#3A3F44','#2A2F33');{const t=performance.now()/150;for(let k=0;k<6;k++){g.fillStyle='#F4F1E8';g.fillRect(px+6+k*9,py-12,4,10);g.fillStyle='#F2C230';g.beginPath();g.arc(px+8+k*9,py-15+Math.sin(t+k)*1,2.5,0,7);g.fill()}}break;
  case 'column':box(px+6,py+4,20,22,70,'#F4F1E8','#E2DCCB');break;
  case 'display':box(px,py,pw,ph,26,'rgba(200,225,235,.6)','#6E4E34');g.fillStyle=o.amber?'#E8961C':'#9AA0A3';g.beginPath();g.ellipse(px+pw/2,py-14,7,5,.3,0,7);g.fill();break;
  case 'armor':g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(px+16,py+26,9,4,0,0,7);g.fill();g.fillStyle='#9AA0A3';g.fillRect(px+10,py-14,12,30);g.beginPath();g.arc(px+16,py-20,7,0,7);g.fill();break;
  case 'stage':box(px,py,pw,ph,14,'#6E4E34','#4A3022');g.fillStyle='#8E2F2F';g.fillRect(px,py-40,14,ph+26);g.fillRect(px+pw-14,py-40,14,ph+26);break;
  case 'rack':g.fillStyle='#9AA0A3';g.fillRect(px,py-26,pw,3);for(let k=0;k<o.w*4;k++){g.fillStyle=['#6B4FA0','#1E8A4A','#C0392B','#2D5DA8','#1D1F22'][k%5];g.fillRect(px+3+k*8,py-23,6,22)}g.fillStyle='#5A6064';g.fillRect(px+2,py,3,TS-6);g.fillRect(px+pw-5,py,3,TS-6);break;
  case 'screen':box(px,py+10,pw,ph-10,6,'#1D1F22','#111');g.fillStyle='#F7F8F4';g.fillRect(px+6,py-40,pw-12,40);g.fillStyle='#3D6D8D';g.fillRect(px+10,py-36,pw-20,32);g.fillStyle='#E2A11B';g.beginPath();g.arc(px+pw/2,py-20,8,0,7);g.fill();break;
  case 'fountain':g.fillStyle='#9AA0A3';g.beginPath();g.ellipse(px+pw/2,py+ph/2,pw/2,ph/2.4,0,0,7);g.fill();g.fillStyle='#7FB7C9';g.beginPath();g.ellipse(px+pw/2,py+ph/2,pw/2-5,ph/2.4-5,0,0,7);g.fill();{const t=performance.now()/200;g.fillStyle='rgba(255,255,255,.8)';for(let k=0;k<5;k++){g.beginPath();g.arc(px+pw/2+Math.cos(t+k)*8,py+ph/2-10-Math.abs(Math.sin(t*1.3+k))*12,2,0,7);g.fill()}}break;
  case 'stairs':for(let k=0;k<6;k++){g.fillStyle=k%2?'#8E908C':'#9A9C98';g.fillRect(px,py+ph-(k+1)*16,pw,16)}g.fillStyle='#5A3E28';g.fillRect(px,py-10,4,ph+10);break;
  case 'mailbox':g.fillStyle='#5A6064';g.fillRect(px+2,py,pw-4,22);g.fillStyle='#3A3F44';for(let k=0;k<o.w*3;k++){g.fillRect(px+5+k*10,py+3,8,7);g.fillRect(px+5+k*10,py+12,8,7)}break;
  case 'graffiti':g.save();g.translate(px+4,py+16);g.rotate(-.1);g.font='900 13px "Big Shoulders Display",sans-serif';g.fillStyle='#C0392B';g.fillText(o.txt,0,0);g.restore();break;
  case 'radiator':box(px+4,py+10,24,16,14,'#E8E6DF','#D9DEDE');break;
  case 'dance':{const t=performance.now()/300|0;for(let yy=0;yy<o.h;yy++)for(let xx=0;xx<o.w;xx++){g.fillStyle=['#E0458A','#3FA7D6','#E2A11B','#59B86A','#6B4FA0'][(xx+yy+t)%5];g.globalAlpha=.55;g.fillRect(px+xx*TS+1,py+yy*TS+1,TS-2,TS-2)}g.globalAlpha=1;break}
  case 'seats':for(let k=0;k<o.w;k++){box(px+k*TS+4,py+8,24,20,10,'#8E2F2F','#6E2424')}break;
  }}
function drawPet(e){const g=ctx,x=e.x,y=e.y,c=e.lk.outfit,dog=e.pet==='dog';g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(x,y,11,4,0,0,7);g.fill();
  const bob=Math.sin(e.anim)*1.5;g.fillStyle=c;g.beginPath();g.ellipse(x,y-8+bob,dog?12:9,6,0,0,7);g.fill();const hx=x+(e.dir===2?-10:10)*(e.dir===1||e.dir===3?0.3:1);g.beginPath();g.arc(hx,y-14+bob,dog?6:5,0,7);g.fill();
  g.fillStyle=shade(c,-.3);if(dog){g.fillRect(hx-6,y-18,3,6)}else{g.beginPath();g.moveTo(hx-4,y-18);g.lineTo(hx-2,y-23);g.lineTo(hx,y-18);g.moveTo(hx+1,y-18);g.lineTo(hx+3,y-23);g.lineTo(hx+5,y-18);g.fill()}}
