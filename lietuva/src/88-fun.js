
/* =====================================================================
   FUN — minigames, festivals, car radio and street atmosphere.
   ===================================================================== */

/* ---------- chess puzzles with pensioners (mate in one, all verified) ---------- */
const CHESS=[
 {t:'Mat per vieną ėjimą: baltieji',en:'White to move and mate in one',pos:{g1:'K',a1:'R',g8:'k',f7:'p',g7:'p',h7:'p'},sol:['a1','a8'],hint:'Back rank.'},
 {t:'Mat per vieną ėjimą: baltieji',en:'White to move and mate in one',pos:{e1:'K',h5:'Q',c4:'B',e8:'k',d8:'q',f8:'b',d7:'p',f7:'p',e5:'p',c6:'n'},sol:['h5','f7'],hint:'The weakest square is f7.'},
 {t:'Mat per vieną ėjimą: baltieji',en:'White to move and mate in one',pos:{f6:'K',h1:'R',f8:'k'},sol:['h1','h8'],hint:'The king has no squares left.'}];
const PIECE={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
function chessPuzzle(){const n=G.flags.chessN||0;if(n>=CHESS.length){log('„Tu jau viską išsprendei. Ateik rytoj su savo šachmatais.“','amb');return}const pz=CHESS[n];let sel=null;
  openModal(mHead('♞','Šachmatai Bernardinų sode',`${pz.t} · ${pz.en}`)+`<div class="mbody" style="text-align:center"><canvas id="chb" width="400" height="400" style="width:min(400px,100%);border-radius:6px;cursor:pointer"></canvas><p id="chr" class="note">Pensioner Algirdas: „Nu, jaunuoli, rodyk, ką moki.“ Click a white piece, then its target square.</p></div><div class="mfoot"><button class="btn ghost" onclick="log('Hint: ${pz.hint.replace(/'/g,'')}','amb')">Užuomina</button><button class="btn" onclick="closeModal()">Baigti</button></div>`);
  const c=$('#chb'),g=c.getContext('2d'),S=50,F='abcdefgh';const sq=k=>[F.indexOf(k[0]),8-(+k[1])];
  const draw=()=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=(x+y)%2?'#B58863':'#F0D9B5';g.fillRect(x*S,y*S,S,S)}if(sel){const[x,y]=sq(sel);g.fillStyle='rgba(226,161,27,.6)';g.fillRect(x*S,y*S,S,S)}
    g.font='40px serif';g.textAlign='center';g.textBaseline='middle';Object.entries(pz.pos).forEach(([k,p])=>{const[x,y]=sq(k);g.fillStyle=p===p.toUpperCase()?'#fff':'#111';g.strokeStyle=p===p.toUpperCase()?'#111':'#fff';g.lineWidth=1;g.fillText(PIECE[p],x*S+S/2,y*S+S/2+2);g.strokeText(PIECE[p],x*S+S/2,y*S+S/2+2)})};
  draw();c.onclick=e=>{const r=c.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*8),y=Math.floor((e.clientY-r.top)/r.height*8);const k=F[x]+(8-y);
    if(!sel){const p=pz.pos[k];if(p&&p===p.toUpperCase()){sel=k;draw()}return}
    if(sel===pz.sol[0]&&k===pz.sol[1]){pz.pos[k]=pz.pos[sel];delete pz.pos[sel];sel=null;draw();$('#chr').innerHTML='<b>Matas!</b> „Oho! Iš kur tu toks?“ +€5, the pensioners respect you.';P.money+=5;setMood(8);G.flags.chessN=n+1;SND.fanfare()}
    else{sel=null;draw();$('#chr').textContent='„Ne ne ne. Pagalvok dar.“ (Not that one.)';SND.blip(220)}}}

/* ---------- haggling with market grandmothers ---------- */
Object.assign(ITEMS,{suris:{n:'Kaimiškas sūris',en:'Farmer\'s cheese with honey',ic:'🧀',food:30,price:5},agurkai:{n:'Rauginti agurkai',en:'Pickled cucumbers',ic:'🥒',food:12,mood:3,price:3},
 baravykas:{n:'Baravykas',en:'Porcini mushroom. Market price €4',ic:'🍄',price:0,sell:4,mush:1},voveraite:{n:'Voveraitė',en:'Chanterelle. Market price €2',ic:'🍄',price:0,sell:2,mush:1},musmire:{n:'Musmirė',en:'Fly agaric. Poisonous! Do not eat',ic:'🍄',price:0,sell:0,mush:1,poison:1},
 riestainis:{n:'Riestainis',en:'Bagel ring from Kaziuko mugė',ic:'🥯',food:15,mood:6,price:2},verba:{n:'Verba',en:'Dried-flower palm from Kaziuko mugė',ic:'💐',mood:10,price:4},papartis:{n:'Paparčio žiedas',en:'The legendary fern flower. Luck forever',ic:'🌸',price:0}});
function haggleFood(){let price=14,round=0;const next=()=>choice('🥒','Derybos su močiute',`„Krepšelis: sūris, agurkai ir kibinas. <b>${eur(price)}</b>, vaikeli, pigiau nerasi.“`,[
  {l:'Pirkti',fn:()=>{if(pay(price)){give('suris',1);give('agurkai',1);give('kibinas',1);log(`Bought the basket for ${eur(price)}.`,'good');if(price<=9)log('The grandmother mutters: „Tikras žydas…“ (you haggled hard).','amb')}}},
  {l:'„O už dešimt?“',fn:()=>{round++;if(Math.random()<.15*round){log('„Eik iš čia, nemoki gerbti senų žmonių!“ She refuses to sell.','bad');setMood(-3);return}price=Math.max(8,price-ri(1,2));next()}},{l:'Ačiū, ne',fn:()=>{}}]);next()}

/* ---------- mushrooms (border forest and city forests) ---------- */
function forestTiles(){if(MAP.forest)return MAP.forest;const out=[];for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2)if(TL[idx(x,y)]===T.FOREST)out.push(x,y);MAP.forest=out;return out}
function forestNear(px,py,rmax){const f=forestTiles(),X=tx(px),Y=tx(py),c=[];for(let i=0;i<f.length;i+=2)if(Math.abs(f[i]-X)<rmax&&Math.abs(f[i+1]-Y)<rmax)c.push(i);if(!c.length)return null;const i=pick(c);return[f[i],f[i+1]]}
function mushroomTick(){if(SCENE||MAP.kind==='road')return;const m=doyToDate(G.time.doy).m;if(m<6||m>9)return;
  if(ENT.pickups.filter(k=>k.mush).length<8){const t=forestNear(P.x,P.y,18);if(t){const r=Math.random();ENT.pickups.push({k:'mush',mush:r<.3?'baravykas':r<.75?'voveraite':'musmire',x:t[0]*TS+rnd(6,26),y:t[1]*TS+rnd(6,26)})}}}
function drawMushroom(k){const c=k.mush==='musmire'?'#C1272D':k.mush==='baravykas'?'#7A4B2A':'#E2A11B';ctx.fillStyle='#F2EEE6';ctx.fillRect(k.x-2,k.y-6,4,6);ctx.fillStyle=c;ctx.beginPath();ctx.arc(k.x,k.y-6,5,Math.PI,0);ctx.fill();if(k.mush==='musmire'){ctx.fillStyle='#fff';ctx.fillRect(k.x-2,k.y-9,1.5,1.5);ctx.fillRect(k.x+1,k.y-8,1.5,1.5)}}

/* ---------- cooking cepelinai at home ---------- */
function cookCepelinai(){if(G.flags.cookDay===G.time.day)return log('Enough cepelinai for today. Mum says so.','amb');const steps=['Nutarkuoti bulves','Nuspausti tarkius','Įdėti mėsos įdaro','Suformuoti cepeliną','Virti 25 minutes','Užpilti spirgučių padažu'];let i=0,errs=0;
  const next=()=>{if(i>=steps.length){G.flags.cookDay=G.time.day;const n=errs===0?3:errs<3?2:1;give('cepelinai',n);setMood(10);skipHours(2);log(errs===0?'Perfect cepelinai! Mum says they are better than grandma\'s (do not tell grandma).':`${n} cepelinai. ${errs} mistakes, but edible.`,'good');return}
    const opts=[steps[i],...steps.filter((_,k)=>k!==i).sort(()=>Math.random()-.5).slice(0,2)].sort(()=>Math.random()-.5);
    choice('🥔',`Cepelinai · ${i+1}/${steps.length}`,'What comes next? Ką darome toliau?',opts.map(o=>({l:o,fn:()=>{if(o===steps[i])i++;else{errs++;log('„Ne, ne taip!“ says mum.','bad')}next()}})))};next()}

/* ---------- bottle race (kids) ---------- */
function startBottleWar(){const pts=[];for(let k=0;k<9;k++){const t=randomTileNear(P.x,P.y,3,12,t=>t===T.YARD||t===T.PARK||t===T.WALK);if(t){const b={k:'bottle',x:t[0]*TS+16,y:t[1]*TS+16,keep:true,war:true};ENT.pickups.push(b);pts.push(b)}}
  const t=randomTileNear(P.x,P.y,2,4,t=>WALKABLE[t]);const rival=spawnPed('kid',t[0]*TS+16,t[1]*TS+16,null,{keep:true,special:'rivalkid',name:'Benas iš 5 laiptinės'});
  G.mission={type:'bottlewar',custom:true,title:'Butelių karas',rival,mine:0,his:0,start:has('bottle'),step:'First to 5 bottles wins!',pay:2};bubble(rival,'Visi buteliai mano!')}
function tickBottleWar(dt){const M=G.mission;if(!M||M.type!=='bottlewar')return;M.mine=has('bottle')-M.start;const r=M.rival;const left=ENT.pickups.filter(k=>k.war&&!k.got);
  if(left.length){let best=left[0],bd=1e9;left.forEach(k=>{const d=dist(k.x,k.y,r.x,r.y);if(d<bd){bd=d;best=k}});const a=Math.atan2(best.y-r.y,best.x-r.x);moveCircle(r,Math.cos(a)*75*dt,Math.sin(a)*75*dt,6,SOLID_FOOT);r.anim+=dt*10;r.dir=Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?0:2):(Math.sin(a)>0?1:3);if(bd<14){best.got=true;M.his++;bubble(r,M.his+'!')}}
  M.target=left[0]?{x:left[0].x,y:left[0].y,label:'Butelis'}:null;M.step=`Tu ${M.mine} : ${M.his} Benas`;
  if(M.mine>=5){ENT.pickups=ENT.pickups.filter(k=>!k.war);r.keep=false;missionDone('Benas: „Rytoj atsirevanšuosiu!“')}else if(M.his>=5||!left.length&&M.mine<5){ENT.pickups=ENT.pickups.filter(k=>!k.war);r.keep=false;missionFail('Benas collected more bottles.')}}

/* ---------- 3x3 street basketball ---------- */
function streetBall(){let me=0,them=0,turn=0,pos=0,dir=1,zone=rnd(25,65),run=true;const zw=13;
  openModal(mHead('🏀','Kiemo krepšinis 3x3','First to 7. Press SPACE or tap when the marker is in the green.')+`<div class="mbody mg"><p id="sbS" style="font:900 34px var(--display);text-align:center;margin:0">0 : 0</p><div class="mgbar"><div class="zone2" style="left:${zone}%;width:${zw}%"></div><div class="mark" id="sbm"></div></div><p id="sbR" class="note" style="font-size:15px">Tavo kamuolys.</p></div><div class="mfoot"><button class="btn green" id="sbB">Mesti</button><button class="btn ghost" onclick="HOOP.run=false;closeModal()">Baigti</button></div>`);
  const shot=()=>{if(!run)return;const ok=pos>=zone&&pos<=zone+zw;if(ok){me++;SND.blip(900)}else SND.blip(250);let msg2=ok?'Taiklu!':'Pro šalį.';
    if(Math.random()<.52+(P.age>=16?.03:0)){them++;msg2+=' Varžovas pataiko.'}else msg2+=' Varžovas prameta.';$('#sbS').textContent=`${me} : ${them}`;$('#sbR').textContent=msg2;zone=rnd(20,70);$('.zone2').style.left=zone+'%';
    if(me>=7||them>=7){run=false;HOOP.run=false;const w=me>them;$('#sbR').textContent=w?'Laimėjai! Kiemas tavo. Kaip Saboniui!':'Pralaimėjai. Revanšas rytoj.';setMood(w?14:-3);P.energy-=12;if(w){P.respect=(P.respect||0)+2;G.flags.hoops4=true;if(P.faction&&FACTIONS[P.faction].league==='school')gainRep(P.faction,8)}}};
  $('#sbB').onclick=shot;HOOP.shoot=shot;HOOP.run=true;const tick=()=>{if(!HOOP.run||!$('#sbm'))return;pos+=dir*1.8;if(pos>100||pos<0)dir*=-1;$('#sbm').style.left=pos+'%';requestAnimationFrame(tick)};tick()}

/* ---------- festivals ---------- */
const FESTS=[{m:2,d0:4,d1:6,id:'kaziuko',t:'Kaziuko mugė',map:'vilnius'},{m:5,d0:23,d1:24,id:'jonines',t:'Joninės'},{m:11,d0:1,d1:31,id:'kaledos',t:'Kalėdų eglė',map:'vilnius'}];
function festNow(){const d=doyToDate(G.time.doy);return FESTS.filter(f=>f.m===d.m&&d.d>=f.d0&&d.d<=f.d1)}
function festTick(){if(SCENE)return;const fs=festNow();fs.forEach(f=>{if(f.map&&f.map!==MAP.id)return;const key='fest_'+f.id+'_'+MAP.id+'_'+G.time.day;if(G.flags[key])return;G.flags[key]=1;
  if(f.id==='kaziuko'){const st=STREETS.find(s=>s.name==='Pilies g.')||STREETS.find(s=>s.ped);if(st)walkLine(st.pts,5,(x,y,nx,ny)=>{for(const sg of[-1,1]){const X=Math.round(x+nx*sg*(st.w+.5)),Y=Math.round(y+ny*sg*(st.w+.5));if(inb(X,Y)&&WALKABLE[TL[idx(X,Y)]])DECOR.push({k:'fstall',x:X*TS,y:Y*TS,fest:1})}});toast('🌿','Kaziuko mugė','St Casimir\'s fair fills Pilies street: verbos, riestainiai, wooden spoons. Watch your wallet!')}
  if(f.id==='jonines'){PARKSFIRE();toast('🔥','Joninės','Bonfires in the parks tonight. They say a fern flower blooms in the forest at midnight.')}
  if(f.id==='kaledos'){const c=POIS.find(p=>p.name==='Vilniaus katedra');if(c)DECOR.push({k:'xtree',x:c.x+120,y:c.y+40,fest:1});toast('🎄','Kalėdų eglė','The famous Christmas tree is up on Cathedral Square.')}})}
function PARKSFIRE(){for(let k=0;k<6;k++){const t=randomTileNear(P.x,P.y,6,40,t=>t===T.PARK||t===T.SAND);if(t)DECOR.push({k:'fire',x:t[0]*TS+16,y:t[1]*TS+16,fest:1})}
  const t=forestNear(P.x,P.y,9999);if(t)ENT.pickups.push({k:'fern',x:t[0]*TS+16,y:t[1]*TS+16,keep:true})}
function festStallTalk(){choice('🌿','Kaziuko mugė','A wooden stall full of verbos, riestainiai and hand-carved spoons.',[{l:'Riestainis €2',fn:()=>{if(pay(2))give('riestainis',1)}},{l:'Verba €4',fn:()=>{if(pay(4))give('verba',1)}},{l:'Tik pažiūrėti',fn:()=>{if(Math.random()<.2){const n=Math.min(15,P.money);P.money-=n;log(`A pickpocket got you for ${eur(n)}!`,'bad')}}}])}
/* basketball nights */
function gameNightTick(){if(!['vilnius','kaunas'].includes(MAP.id))return;const h=G.time.min/60;const gn=(G.time.day*7+3)%4===0;if(!gn)return;
  if(h>=18&&h<21&&ENT.peds.filter(e=>e.fan).length<6){const t=randomTileNear(P.x,P.y,8,20,t=>WALKABLE[t]);if(t){const e=spawnPed('civ',t[0]*TS+16,t[1]*TS+16,null,{fan:true});e.lk.outfit='#1E8A4A';e.lk.vest='#F7F8F4';e.lines=[['Žalgiris! Žalgiris!','Žalgiris! Žalgiris!'],['Šiandien laimėsim!','We win tonight!']]}}
  if(h>=21&&!G.flags['game'+G.time.day]){G.flags['game'+G.time.day]=1;const w=Math.random()<.65;toast('🏀',w?'Žalgiris laimėjo!':'Žalgiris pralaimėjo',w?'Car horns all over town. Strangers hug in the street.':'Silence in the bars. Tomorrow everyone is a coach.');setMood(w?8:-3);
    ENT.peds.filter(e=>e.fan).forEach(e=>bubble(e,w?'VALIO!!!':'Teisėjas nupirktas!'))}}

/* ---------- car radio ---------- */
const RADIO=[{n:'Išjungta'},{n:'Gintaras FM',sub:'popsas',scale:[261.6,293.7,329.6,392,440,523.3],pat:[0,2,4,5,4,2,1,3,4,2],dj:['„Gintaras FM: geriausi lietuviški hitai!“','„Ir vėl – Mėnulio takas!“']},
 {n:'Žinių radijas',sub:'žinios',talk:1,dj:['„Degalai brangsta jau trečią savaitę.“','„Kamštis Geležinio Vilko gatvėje.“','„Orai: lietus visoje Lietuvoje.“','„Seimas vėl nesutaria dėl biudžeto.“','„Žalgiris pasirašė naują žaidėją.“']},
 {n:'Retro Rus FM',sub:'rusiška estrada',scale:[220,246.9,261.6,293.7,329.6,349.2],pat:[0,2,3,4,3,2,0,5,4,3],dj:['„Ретро хиты для настоящих пацанов!“ (marozai nod along)']},
 {n:'Metalas FM',sub:'metalas',scale:[82.4,98,110,123.5,146.8],pat:[0,0,2,0,3,2,0,4],sq:1,dj:['„Garsiau! Metalas FM!“']}];
let RADIO_T=0;
function radioCycle(){if(!P.inCar)return;P.radio=((P.radio||0)+1)%RADIO.length;const r=RADIO[P.radio];toast('📻',r.n,r.sub||'');if(r.dj)log(pick(r.dj),'amb');if(P.radio===3&&styleOf()==='maroz')setMood(4);if(P.radio===4&&styleOf()==='metal')setMood(4)}
function radioTick(dt){if(!P.inCar||!P.radio||!SND.on||!SND.ctx)return;const r=RADIO[P.radio];RADIO_T-=dt;if(RADIO_T>0)return;
  if(r.talk){RADIO_T=12;log('📻 '+pick(r.dj),'amb');return}RADIO_T=r.sq?.22:.3;MUSIC.step++;const n=r.pat[MUSIC.step%r.pat.length];SND.tone(r.scale[n],r.sq?.2:.28,r.sq?'sawtooth':'triangle',r.sq?.03:.035);if(MUSIC.step%8===0&&r.dj&&Math.random()<.1)log('📻 '+pick(r.dj),'amb')}

/* ---------- street atmosphere: potholes and road works in cities ---------- */
function cityAtmosphere(){if(MAP.kind!=='city'||MAP.atmo)return;MAP.atmo=true;SR=mulberry(hashStr(MAP.id+'atmo'));
  STREETS.forEach(s=>{if(s.ped||s.rail)return;if(sr()<.35)walkLine(s.pts,sri(25,60),(x,y,nx,ny)=>{if(sr()<.4)DECOR.push({k:'pothole',x:x*TS+16+nx*sr(-s.w*12,s.w*12),y:y*TS+16+ny*sr(-s.w*12,s.w*12)})});
    if(s.main&&sr()<.18){const i=sri(0,s.pts.length-2),p=s.pts[i];for(let k=0;k<6;k++)DECOR.push({k:'cone',x:(p[0]+k*.8)*TS+16,y:(p[1]+k*.3)*TS+16});DECOR.push({k:'works',x:p[0]*TS+16,y:p[1]*TS-10})}})}
let BUMP_T=0;
function potholeTick(dt){BUMP_T-=dt;if(!P.inCar||BUMP_T>0)return;const c=P.inCar,sp=Math.hypot(c.vx,c.vy);if(sp<120)return;for(const d of DECOR){if(d.k!=='pothole')continue;if(Math.abs(d.x-c.x)<14&&Math.abs(d.y-c.y)<14){BUMP_T=.8;shake(sp/60);c.hp-=1.5;SND.hit(.3);if(Math.random()<.4)bubble(c,pick(['Duobė!','Ach, tos duobės…','Kur žiūri savivaldybė?!']));break}}}
function drawFunDecor(g,d){if(d.k==='cone'){g.fillStyle='#E2621B';g.beginPath();g.moveTo(d.x,d.y-14);g.lineTo(d.x+6,d.y);g.lineTo(d.x-6,d.y);g.fill();g.fillStyle='#fff';g.fillRect(d.x-3,d.y-8,6,2)}
  else if(d.k==='works'){g.fillStyle='#E2A11B';g.fillRect(d.x-16,d.y-14,32,14);g.fillStyle='#1D2724';g.font='800 8px sans-serif';g.textAlign='center';g.fillText('REMONTAS',d.x,d.y-4);g.textAlign='left'}
  else if(d.k==='fstall'){g.fillStyle='#8C6A3C';g.fillRect(d.x,d.y-6,30,14);g.fillStyle=['#C0392B','#3E8E5E','#E2A11B'][(d.x/32|0)%3];g.fillRect(d.x-2,d.y-22,34,8);g.fillStyle='#F2EEE6';for(let k=0;k<4;k++)g.fillRect(d.x+3+k*7,d.y-4,4,6)}
  else if(d.k==='fire'){const t=performance.now()/120;g.fillStyle='#5A3E28';g.fillRect(d.x-10,d.y-2,20,4);g.fillStyle='#E2621B';g.beginPath();g.moveTo(d.x-8,d.y);g.lineTo(d.x,d.y-18-Math.sin(t)*4);g.lineTo(d.x+8,d.y);g.fill();g.fillStyle='#F2C230';g.beginPath();g.moveTo(d.x-4,d.y);g.lineTo(d.x,d.y-10-Math.cos(t)*3);g.lineTo(d.x+4,d.y);g.fill()}
  else if(d.k==='xtree'){g.fillStyle='#2D5532';for(let k=0;k<4;k++){g.beginPath();g.moveTo(d.x,d.y-140+k*25);g.lineTo(d.x+28+k*10,d.y-80+k*25);g.lineTo(d.x-28-k*10,d.y-80+k*25);g.fill()}const t=performance.now()/400|0;for(let k=0;k<18;k++){g.fillStyle=['#E2A11B','#C1272D','#F7F8F4'][(k+t)%3];g.fillRect(d.x-30+hash2(k,1)*60,d.y-120+hash2(k,2)*110,3,3)}g.fillStyle='#F2C230';g.beginPath();g.arc(d.x,d.y-142,5,0,7);g.fill()}}
function funTalkDecor(){for(const d of DECOR){if(d.k==='fstall'&&dist(d.x+15,d.y,P.x,P.y)<36)return{key:'E',text:'Kaziuko mugės prekystalis',fn:festStallTalk};if(d.k==='chess'&&dist(d.x+13,d.y,P.x,P.y)<40)return{key:'E',text:'Šachmatai su pensininkais',fn:chessPuzzle}}return null}
function placeChess(){const D=CITYDATA[MAP.id];if(!D||!D.chess||MAP.chessPlaced)return;MAP.chessPlaced=true;const[x,y]=MAP.pr.p(D.chess);const t=nearestTile(Math.round(x),Math.round(y),t=>t===T.PARK||WALKABLE[t]);if(!t)return;
  DECOR.push({k:'chess',x:t[0]*TS,y:t[1]*TS+10});for(let k=0;k<2;k++){const e=spawnPed('elder',t[0]*TS+(k?44:-14),t[1]*TS+18,null,{keep:true,name:k?'Pensininkas Algirdas':'Pensininkas Vytautas',idle:true,special:'chessman'});e.lk.cap='#3B3F45'}}
