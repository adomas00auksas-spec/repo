
/* =====================================================================
   WORLD GENERATION (fixed seed, same country every time)
   ===================================================================== */
const TL=new Uint8Array(W*H), CITYA=new Uint8Array(W*H), DISTA=new Uint16Array(W*H), RES=new Uint8Array(W*H);
const MXA=new Int8Array(W*H).fill(-1), MYA=new Int8Array(W*H).fill(-1);
const BUILDINGS=[], TREES=[], POIS=[], DISTRICTS=[], HWYS=[], DECOR=[];
const BW=Math.ceil(W/16), BH=Math.ceil(H/16);
const BBUCK=Array.from({length:BW*BH},()=>[]), TBUCK=Array.from({length:BW*BH},()=>[]);
const idx=(x,y)=>y*W+x;
const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const tileAt=(x,y)=>inb(x,y)?TL[y*W+x]:T.ABROAD;
const setT=(x,y,t)=>{if(inb(x,y))TL[y*W+x]=t};

const TRAKAI=[594,497];
const LT_POLY=[[20.6,56.07],[21.05,56.07],[21.6,56.3],[22.2,56.42],[23.0,56.36],[23.75,56.37],[24.3,56.28],[24.9,56.44],[25.6,56.15],[26.05,55.98],[26.62,55.68],
 [26.4,55.32],[25.85,54.95],[25.78,54.6],[25.55,54.32],[25.72,54.15],[25.2,54.2],[24.4,53.95],[23.95,53.92],[23.5,54.02],[23.4,54.25],[22.8,54.38],[22.7,54.75],
 [22.85,54.9],[22.1,55.05],[21.4,55.25],[21.15,55.28],[20.6,55.27]].map(([lo,la])=>geo(lo,la));
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
const coastX=y=>65+Math.round(2*vnoise(y*.06,3)-1);
const spitS0=y=>47+Math.round(2*vnoise(y*.04,9));
const spitW=y=>7+Math.round(14*Math.exp(-(((y-322)/13)**2)));
const lagE=y=>Math.round(70+26*Math.sin(clamp((y-212)/205,0,1)*Math.PI)+3*vnoise(y*.07,1));

function paintLine(pts,r,fn){for(let i=0;i<pts.length-1;i++){const[ax,ay]=pts[i],[bx,by]=pts[i+1];const L=Math.hypot(bx-ax,by-ay),n=Math.ceil(L*2);
  for(let s=0;s<=n;s++){const t=s/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;const R=Math.ceil(r);
    for(let oy=-R;oy<=R;oy++)for(let ox=-R;ox<=R;ox++){if(ox*ox+oy*oy>r*r+.3)continue;const X=Math.round(x+ox),Y=Math.round(y+oy);if(inb(X,Y))fn(X,Y)}}}}
function addB(b){b.id=BUILDINGS.length;BUILDINGS.push(b);for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){if(b.solid!==false)setT(x,y,T.BUILD);RES[idx(x,y)]=1}
  const k=(b.y>>4)*BW+(b.x>>4);BBUCK[k].push(b);return b}
function addTree(x,y,kind){const t={x:x*TS+16+sr(-6,6),y:y*TS+22+sr(-5,5),k:kind||spick(['oak','birch','pine','lime']),s:sr(.8,1.2)};TREES.push(t);TBUCK[(y>>4)*BW+(x>>4)].push(t)}
function cityOf(x,y){const c=CITYA[idx(x,y)];return c?CITIES[c-1]:null}

function genWorld(){
  SR=mulberry(1990);
  // 1. terrain, sea, spit, lagoon, abroad
  for(let y=0;y<H;y++){
    const cx=coastX(y),s0=spitS0(y),s1=s0+spitW(y),le=lagE(y);
    for(let x=0;x<W;x++){
      let t;
      if(y<212){t=x<cx?T.SEA:(x<cx+2?T.SAND:null)}
      else if(y<214){t=x<le?T.SEA:null}
      else{
        if(x<s0)t=T.SEA;else if(x<=s1){t=(x===s0)?T.SAND:(x<=s0+2?T.DUNE:T.FOREST);if(Math.abs(y-322)<10&&x<=s0+5)t=T.DUNE}
        else if(x<le)t=T.WATER;else if(x<le+1)t=T.SAND;else t=null;
      }
      if(t===null){const f=fbm(x*.035,y*.035)+(x>440&&y>480?.12:0)+(x>560&&y<300?.05:0);t=f>.6?T.FOREST:f<.34?T.FIELD:T.GRASS}
      if(t!==T.SEA&&!inPoly(x,y,LT_POLY))t=T.ABROAD;
      TL[y*W+x]=t;
    }}
  // 2. rivers and lakes
  const V=cityById('vilnius'),K=cityById('kaunas'),A=cityById('alytus');
  const neris=[[790,462],[745,452],[705,468],[V.cx+20,V.cy-14],[V.cx,V.cy-11],[V.cx-22,V.cy-16],[V.cx-46,V.cy-8],[600,446],[560,424],[515,430],[K.cx-6,K.cy-2]];
  const nemunas=[[468,700],[482,640],[500,598],[A.cx+4,A.cy+6],[A.cx-2,A.cy-8],[487,520],[479,478],[K.cx+10,K.cy+14],[K.cx-6,K.cy-2],[430,410],[380,394],[344,378],[280,371],[220,364],[160,345],[118,330],[94,318]];
  const lake=(x,y)=>{const t=tileAt(x,y);if(t!==T.ABROAD&&t!==T.SEA)setT(x,y,T.WATER)};
  paintLine(neris,1.6,lake);paintLine(nemunas,2.1,lake);
  for(let i=0;i<46;i++){const x=sri(540,870),y=sri(110,470);if(CITIES.some(c=>dist(x,y,c.cx,c.cy)<c.R+10))continue;const r=sr(2,6.5);
    for(let oy=-8;oy<=8;oy++)for(let ox=-9;ox<=9;ox++){const d=Math.hypot(ox/1.3,oy)+vnoise((x+ox)*.4,(y+oy)*.4)*2;if(d<r)lake(x+ox,y+oy)}}
  const TR=TRAKAI;for(let oy=-9;oy<=9;oy++)for(let ox=-11;ox<=11;ox++){if(Math.hypot(ox/1.3,oy)+vnoise((TR[0]+ox)*.3,(TR[1]+oy)*.3)*1.5<8)lake(TR[0]+ox,TR[1]+oy)}
  // 3. city grids
  CITIES.forEach(c=>{c.tiles=0;c.nd=c.districts.length;
    for(let y=c.cy-c.R-4;y<=c.cy+c.R+4;y++)for(let x=c.cx-c.R-4;x<=c.cx+c.R+4;x++){
      if(!inb(x,y))continue;const d=dist(x,y,c.cx,c.cy),rr=c.R*(.86+.26*vnoise(x*.07+c.i*9,y*.07));if(d>=rr)continue;
      const i=idx(x,y),t0=TL[i];if(t0===T.SEA||t0===T.ABROAD)continue;
      const mx=((x-c.cx+7)%14+14)%14,my=((y-c.cy+7)%14+14)%14,dn=d/c.R;
      const gxi=Math.floor((x-c.cx+7)/14),gyi=Math.floor((y-c.cy+7)/14);
      const road=mx<2||my<2;
      if(t0===T.WATER){if(road&&((mx<2&&gxi%2===0)||(my<2&&gyi%2===0))){TL[i]=T.BRIDGE}else continue}
      else if(road)TL[i]=dn<.3?T.COBBLE:T.ROAD;
      else if(mx===2||mx===13||my===2||my===13)TL[i]=T.WALK;
      else TL[i]=dn>.82?T.GRASS:T.YARD;
      if(c.id==='nida'&&TL[i]===T.YARD)TL[i]=T.GRASS;
      CITYA[i]=c.i+1;MXA[i]=mx;MYA[i]=my;c.tiles++;
      let di=0;if(dn>=.34&&c.nd>1){const a=(Math.atan2(y-c.cy,x-c.cx)+Math.PI)/(2*Math.PI);di=1+Math.floor(a*(c.nd-1))%(c.nd-1)}
      DISTA[i]=0;c['d'+di]=(c['d'+di]||0)+1;
      DISTA[i]=1000+c.i*10+di; // temporary code, remapped below
    }});
  // districts list
  CITIES.forEach(c=>c.districts.forEach((n,di)=>{DISTRICTS.push({id:DISTRICTS.length,city:c.id,ci:c.i,di,name:n,sx:0,sy:0,cnt:0,owner:(START_OWNERS[c.id]||[])[di]||null})}));
  const dmap={};DISTRICTS.forEach(d=>dmap[1000+d.ci*10+d.di]=d);
  for(let i=0;i<W*H;i++){const v=DISTA[i];if(v>=1000){const d=dmap[v];if(d){DISTA[i]=d.id+1;d.sx+=i%W;d.sy+=(i/W|0);d.cnt++}else DISTA[i]=0}}
  DISTRICTS.forEach(d=>{if(d.cnt){d.cx=Math.round(d.sx/d.cnt);d.cy=Math.round(d.sy/d.cnt)}else{const c=CITIES[d.ci];d.cx=c.cx;d.cy=c.cy}});
  // 4. highways
  const road=(a,b,name,via)=>{const A0=typeof a==='string'?cityById(a):null,B0=typeof b==='string'?cityById(b):null;
    const P0=A0?[A0.cx,A0.cy]:a,P1=B0?[B0.cx,B0.cy]:b;const pts=[P0];const ctrl=via?[P0,...via,P1]:[P0,P1];
    for(let k=0;k<ctrl.length-1;k++){const[ax,ay]=ctrl[k],[bx,by]=ctrl[k+1];const L=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.round(L/34));const nx=-(by-ay)/L,ny=(bx-ax)/L;
      for(let s=1;s<=n;s++){const t=s/n,o=s<n?sr(-6,6):0;pts.push([ax+(bx-ax)*t+nx*o,ay+(by-ay)*t+ny*o])}}
    HWYS.push({name,pts});
    paintLine(pts,1.45,(x,y)=>{const i=idx(x,y),t=TL[i];if(t===T.ABROAD||t===T.SEA)return;
      if(CITYA[i]){if(t===T.WALK||t===T.YARD||t===T.GRASS){TL[i]=T.ROAD;RES[i]=1}else if(t===T.WATER){TL[i]=T.BRIDGE;RES[i]=1}return}
      TL[i]=t===T.WATER?T.BRIDGE:T.HWY;RES[i]=1});
  };
  road('vilnius','kaunas','A1');road('kaunas','klaipeda','A1',[[380,395],[250,330],[150,250]]);road('vilnius','panevezys','A2');road('panevezys','kaunas','A8');
  road('panevezys','siauliai','A9');road('siauliai','kaunas','A12');road('siauliai','palanga','A11',[[250,170],[150,150]]);road('klaipeda','palanga','A13');
  road('kaunas','alytus','KK130');road('vilnius','alytus','A4',[[600,560]]);
  road('siauliai',[401,134],'Kryžių kalnas');road('vilnius',[TRAKAI[0]+1,TRAKAI[1]-10],'Trakų kelias');
  // spit road Smiltynė → Nida
  const N=cityById('nida');const sp=[];for(let y=216;y<=N.cy;y+=12)sp.push([spitS0(y)+Math.min(4,spitW(y)-2),y]);sp.push([N.cx,N.cy]);
  HWYS.push({name:'KK167',pts:sp});paintLine(sp,1.1,(x,y)=>{const i=idx(x,y);if(TL[i]===T.SEA||TL[i]===T.WATER)return;if(!CITYA[i]){TL[i]=T.HWY;RES[i]=1}else if(TL[i]!==T.ROAD){TL[i]=T.ROAD;RES[i]=1}});
  // 5. landmarks
  genLandmarks();
  // 6. blocks
  CITIES.forEach(c=>fillCity(c));
  // 7. services
  CITIES.forEach(c=>placeServices(c));
  // 8. countryside trees are drawn from FOREST tiles; farmsteads
  for(let i=0;i<220;i++){const x=sri(60,880),y=sri(60,680);if(cityOf(x,y)||CITIES.some(c=>dist(x,y,c.cx,c.cy)<c.R+4))continue;
    let ok=true;for(let yy=y-1;yy<y+4;yy++)for(let xx=x-1;xx<x+5;xx++){const t=tileAt(xx,yy);if(t!==T.GRASS&&t!==T.FIELD)ok=false}
    if(!ok)continue;addB({x,y,w:3,h:2,ht:30,kind:'house',fac:spick(['#E9E2D0','#D8CFB8','#C9D1C7']),roof:spick(['#7B3B2E','#4E5A3E','#5B4A3A'])});
    if(SR()<.6)addB({x:x+3,y:y-1,w:2,h:2,ht:26,kind:'barn',fac:'#8A6A4A',roof:'#5C5148'})}
  buildMinimap();
}

function stamp(x0,y0,w,h,ground){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){if(!inb(x,y))continue;const t=TL[idx(x,y)];if(t===T.SEA||t===T.WATER||t===T.ABROAD)continue;if(ground!==undefined)TL[idx(x,y)]=ground;RES[idx(x,y)]=1}}
function landmark(c,name,x,y,w,h,kind,extra){const b=addB(Object.assign({x,y,w,h,kind,landmark:true,name,city:c?c.id:null},extra||{}));
  const p={id:'lm_'+POIS.length,kind:'landmark',name,city:c?c.id:null,b,x:(x+w/2)*TS,y:(y+h)*TS+18,desc:(extra&&extra.desc)||''};
  if(extra&&extra.door){p.x=extra.door[0]*TS+16;p.y=extra.door[1]*TS+16}POIS.push(p);b.poi=p;return p}
function shoreScan(x,y,dx){for(let k=0;k<40;k++){const t=tileAt(x+dx*k,y);if(t===T.WATER||t===T.SEA)return x+dx*k}return null}
function genLandmarks(){
  const C=cityById;let c=C('vilnius'),X=c.cx,Y=c.cy;
  stamp(X-7,Y-9,12,6,T.COBBLE);
  landmark(c,'Vilniaus katedra',X-5,Y-8,5,3,'cathedral',{ht:58,desc:'Cathedral Square. Everyone meets „prie varpinės“, by the bell tower.'});
  addB({x:X+1,y:Y-7,w:1,h:1,ht:96,kind:'belfry'});
  stamp(X+6,Y-10,6,6,T.PARK);
  landmark(c,'Gedimino bokštas',X+7,Y-9,3,3,'tower',{ht:62,desc:'Gediminas Tower on its hill, the symbol of Vilnius. The flag flies from the top.'});
  for(let y=Y-21;y<=Y-7;y++)for(let x=X-13;x<=X-10;x++){const t=tileAt(x,y);if(t===T.WATER){setT(x,y,T.WBRIDGE);RES[idx(x,y)]=1}}
  const wb=landmark(c,'Baltasis tiltas',X-12,Y-9,2,1,'plaque',{solid:false,ht:0,door:[X-11,Y-9],desc:'The White Bridge over the Neris. Every warm evening the Centras crowd takes it over.'});
  wb.hq='centras';
  stamp(X-32,Y+3,4,4,T.PARK);landmark(c,'Televizijos bokštas',X-31,Y+4,2,2,'tvtower',{ht:150,desc:'The TV tower, 326 m. Seen from everywhere in the city.'});
  stamp(X+10,Y-27,14,9,T.LOT);landmark(c,'Akropolio aikštelė',X+13,Y-27,8,3,'mall',{ht:46,desc:'The mall car park. After midnight it belongs to Sostinės Šoninis.'}).meet='soninis';
  c=C('kaunas');X=c.cx;Y=c.cy;
  stamp(X-12,Y-5,5,5,T.PARK);landmark(c,'Kauno pilis',X-11,Y-4,3,3,'castle',{ht:44,desc:'Kaunas Castle, where the Neris flows into the Nemunas.'});
  stamp(X+2,Y+1,24,2,T.COBBLE);for(let x=X+3;x<X+26;x+=3){addTree(x,Y+1,'lime')}
  landmark(c,'Laisvės alėja',X+12,Y+3,3,1,'plaque',{solid:false,ht:0,door:[X+13,Y+2],desc:'Freedom Avenue, 1.6 km of lime trees, cafés and people watching.'});
  stamp(X+3,Y+7,10,8,T.LOT);landmark(c,'Žalgirio arena',X+4,Y+8,8,5,'arena',{ht:52,desc:'Žalgiris Arena. On game nights the whole city is green.'}).meet='backos';
  c=C('klaipeda');X=c.cx;Y=c.cy;
  stamp(X+1,Y-3,6,5,T.COBBLE);landmark(c,'Teatro aikštė',X+3,Y-2,2,2,'statue',{ht:20,desc:'Theatre Square and the Ännchen von Tharau fountain.'});
  {const sx=shoreScan(X-2,Y,-1);if(sx){DECOR.push({k:'ship',x:(sx-4)*TS,y:(Y-1)*TS,name:'Meridianas'});const p={id:'lm_mer',kind:'landmark',name:'Burlaivis „Meridianas“',city:'klaipeda',x:(sx+1)*TS+16,y:Y*TS+16,desc:'The sailing ship Meridianas, moored here since 1948.'};POIS.push(p)}}
  {const fy=Y+6,sx=shoreScan(X-2,fy,-1);if(sx){stamp(sx+1,fy-1,3,3,T.LOT);POIS.push({id:'ferry_k',kind:'ferry',name:'Smiltynės perkėla',city:'klaipeda',x:(sx+2)*TS,y:fy*TS+16,to:'ferry_n'})}}
  for(let y=Y+10;y<Y+24;y+=4){const sx=shoreScan(X-2,y,-1);if(sx)DECOR.push({k:'crane',x:(sx+1)*TS,y:y*TS})}
  {const sx=shoreScan(X-4,Y+16,-1);if(sx){stamp(sx+1,Y+14,7,6,T.LOT);landmark(c,'Konteinerių terminalas',sx+2,Y+14,5,2,'warehouse',{ht:34,desc:'Container terminal. The Port Cartel decides what gets inspected.'}).hq='uosto'}}
  stamp(X+6,Y+8,9,6,T.LOT);landmark(c,'Senoji žuvų fabriko aikštelė',X+7,Y+8,6,2,'warehouse',{ht:30,desc:'Old fish factory lot. Jūros Dūmai drift here at night.'}).meet='dumai';
  c=C('siauliai');X=c.cx;Y=c.cy;
  stamp(X+2,Y+2,6,6,T.COBBLE);landmark(c,'Saulės laikrodis',X+4,Y+4,2,2,'sundial',{ht:60,desc:'The Sundial Square and its golden Archer, symbol of the city of the sun.'});
  stamp(398,124,8,8,T.PARK);landmark(null,'Kryžių kalnas',399,125,6,5,'crosses',{ht:24,solid:true,desc:'The Hill of Crosses: more than 100,000 crosses left by pilgrims.',door:[402,131]});
  stamp(X-9,Y+7,9,7,T.LOT);landmark(c,'Prekybos centro aikštelė',X-8,Y+7,6,2,'mall',{ht:34,desc:'Shopping centre lot. Saulės Drift meets here.'}).meet='saule';
  c=C('panevezys');X=c.cx;Y=c.cy;
  stamp(X-4,Y-4,8,7,T.COBBLE);landmark(c,'Juozo Miltinio dramos teatras',X-3,Y-4,5,3,'theatre',{ht:46,desc:'Miltinis Drama Theatre on Freedom Square.'});
  stamp(X+6,Y+5,10,8,T.LOT);landmark(c,'Cido arena',X+7,Y+6,6,4,'arena',{ht:44,desc:'Cido Arena. Aukštaitijos Turbo use its car park when the lights go off.'}).meet='turbo';
  c=C('alytus');X=c.cx;Y=c.cy;
  stamp(X-9,Y-9,5,5,T.PARK);landmark(c,'Parašiutų bokštas',X-8,Y-8,2,2,'ptower',{ht:120,desc:'The 1960s parachute jumping tower, the tallest of its kind in the country.'});
  {const fx=X+c.R+9,fy=Y+10;stamp(fx-1,fy-1,10,8,T.YARD);landmark(null,'Senoji ferma',fx,fy,5,3,'barn',{ht:30,fac:'#7A5A3C',roof:'#4E463F',desc:'An old farm in the forest near the border. Not many cows here any more.'}).hq='pasienio'}
  c=C('palanga');X=c.cx;Y=c.cy;
  {const sx=shoreScan(X,Y,-1);if(sx){for(let x=sx;x>sx-24;x--)for(let y=Y;y<=Y+1;y++){if(tileAt(x,y)===T.SEA){setT(x,y,T.PIER);RES[idx(x,y)]=1}}
    for(let x=sx+1;x<X+2;x++)for(let y=Y;y<=Y+2;y++){if(CITYA[idx(x,y)]||tileAt(x,y)===T.SAND){setT(x,y,T.COBBLE);RES[idx(x,y)]=1}}
    POIS.push({id:'lm_pier',kind:'landmark',name:'Palangos tiltas',city:'palanga',x:(sx+1)*TS,y:Y*TS+32,desc:'The Palanga pier, 470 m into the Baltic. Sunset here is the law.'})}}
  stamp(X+2,Y-12,12,8,T.PARK);landmark(c,'Gintaro muziejus',X+5,Y-10,6,3,'palace',{ht:42,desc:'The Amber Museum in the Tiškevičiai palace.'});
  stamp(X+3,Y+5,8,6,T.LOT);landmark(c,'Kurorto aikštelė',X+4,Y+5,5,2,'warehouse',{ht:26,fac:'#7FA7B5',desc:'Resort car park. Basanavičiaus Kruizas start their slow summer loops here.'}).meet='kruizas';
  c=C('nida');X=c.cx;Y=c.cy;
  for(let y=Y+8;y<Y+20;y++)for(let x=X-6;x<X+8;x++){const t=tileAt(x,y);if(t===T.FOREST||t===T.GRASS||t===T.DUNE){setT(x,y,T.DUNE)}}
  landmark(null,'Parnidžio kopa',X,Y+12,2,2,'sundial',{ht:54,fac:'#CDBF9A',desc:'The Parnidis dune and its stone sundial, 52 m above the lagoon.',door:[X+1,Y+15]});
  {const sx=shoreScan(X+2,Y,1);if(sx){POIS.push({id:'ferry_n',kind:'ferry',name:'Nidos prieplauka',city:'nida',x:(sx-1)*TS,y:Y*TS+16,to:'ferry_k'})}}
  // Trakai island castle (no city)
  {const[X0,Y0]=TRAKAI;for(let y=Y0-4;y<=Y0+3;y++)for(let x=X0-4;x<=X0+4;x++)setT(x,y,T.PARK);
  for(let y=Y0-10;y<Y0-4;y++)for(let x=X0;x<=X0+1;x++){if(tileAt(x,y)===T.WATER)setT(x,y,T.PIER)}}
  landmark(null,'Trakų pilis',TRAKAI[0]-3,TRAKAI[1]-3,6,4,'castle',{ht:56,desc:'Trakai Island Castle, red brick in the middle of lake Galvė.',door:[TRAKAI[0],TRAKAI[1]+2]});
}

function fillCity(c){
  const facOld=['#E9D7A8','#E6C3B3','#CFE0D0','#F1EBDD','#E3C07E','#D9CBB7','#C8D7E3','#E8B9A0'],roofOld=['#B5523B','#A94832','#C0623F','#9A4630','#59636B'];
  const facSov=['#C9C4B8','#B8B3A6','#D3CBB5','#A9AFA8','#BDB8AE'],facRen=['#D9C27A','#9FB7A8','#C99A8A','#A8B9CC','#D8A85B','#B4C79A'];
  const facHouse=['#E9E2D0','#D8CFB8','#C9D1C7','#E7D6C1','#D3D9DD'],roofHouse=['#7B3B2E','#4E5A3E','#5B4A3A','#8C3C2C','#3D4650'];
  const ok=(x,y,w,h)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(!inb(xx,yy))return false;const i=idx(xx,yy);if(CITYA[i]!==c.i+1||RES[i])return false;
    const t=TL[i];if(t!==T.YARD&&t!==T.GRASS)return false;const mx=MXA[i],my=MYA[i];if(mx<3||mx>12||my<3||my>12)return false}return true};
  const put=(x,y,w,h,o)=>{if(!ok(x,y,w,h))return null;return addB(Object.assign({x,y,w,h,city:c.id},o))};
  for(let y=c.cy-c.R-4;y<=c.cy+c.R+4;y++)for(let x=c.cx-c.R-4;x<=c.cx+c.R+4;x++){
    if(!inb(x,y))continue;const i=idx(x,y);if(CITYA[i]!==c.i+1||MXA[i]!==3||MYA[i]!==3)continue;
    const dn=dist(x+5,y+5,c.cx,c.cy)/c.R,r=SR();
    if(c.id==='nida'||c.id==='palanga'&&dn>.3){ // wooden fisher houses / resort villas
      for(let py=0;py<2;py++)for(let px=0;px<2;px++){if(SR()<.2)continue;const hx=x+px*5+sri(0,1),hy=y+py*5+sri(0,1);
        put(hx,hy,3,2,{kind:'house',ht:30,fac:c.id==='nida'?spick(['#8B3A2E','#3E5F7A','#7A5A3C']):spick(facHouse),roof:c.id==='nida'?'#4A3B2E':spick(roofHouse)})}
      for(let k=0;k<4;k++){const tx=x+sri(0,9),ty=y+sri(0,9);if(ok(tx,ty,1,1)){addTree(tx,ty,'pine');RES[idx(tx,ty)]=1}}
      continue}
    if(dn<.3){
      if(r<.12){for(let yy=y;yy<y+10;yy++)for(let xx=x;xx<x+10;xx++){const j=idx(xx,yy);if(CITYA[j]===c.i+1&&!RES[j]&&(TL[j]===T.YARD||TL[j]===T.GRASS))TL[j]=T.PARK}
        for(let k=0;k<9;k++){const tx=x+sri(0,9),ty=y+sri(0,9);if(TL[idx(tx,ty)]===T.PARK&&!RES[idx(tx,ty)]){addTree(tx,ty);RES[idx(tx,ty)]=1}}continue}
      if(r<.18){put(x+2,y+2,6,4,{kind:'church',ht:64,fac:'#F1EBDD',roof:'#59636B'});continue}
      const seg=(sx,sy,len,horiz)=>{let k=0;while(k<len){const L=Math.min(len-k,sri(3,4));const w=horiz?L:3,h=horiz?3:L;
        put(horiz?sx+k:sx,horiz?sy:sy+k,w,h,{kind:'old',ht:sri(40,64),fac:spick(facOld),roof:spick(roofOld)});k+=L}};
      seg(x,y,10,true);seg(x,y+7,10,true);seg(x,y+3,4,false);seg(x+7,y+3,4,false);
    }else if(dn<.46){
      if(r<.5){put(x,y,10,4,{kind:'office',ht:sri(80,130),fac:spick(['#8FA8B8','#A7B6BF','#6F8796','#B7C3C9']),roof:'#5D6970'});put(x,y+6,10,4,{kind:'office',ht:sri(60,100),fac:spick(['#8FA8B8','#A7B6BF','#C9C4B8']),roof:'#5D6970'})}
      else if(r<.62){put(x,y,10,10,{kind:'mall',ht:40,fac:'#C9CED1',roof:'#7E878C'})}
      else{put(x,y,10,3,{kind:'sov',ht:sri(60,80),fac:spick(facRen),roof:'#6E7478'});put(x,y+7,10,3,{kind:'sov',ht:sri(60,80),fac:spick(facRen),roof:'#6E7478'})}
    }else if(dn<.82){
      const tall=SR()<.4,fac=SR()<.4?spick(facRen):spick(facSov),ht=tall?sri(96,110):sri(64,72);
      if(r<.42){put(x,y,10,3,{kind:'sov',ht,fac,roof:'#6E7478'});put(x,y+7,10,3,{kind:'sov',ht,fac,roof:'#6E7478'});
        if(SR()<.6)DECOR.push({k:'play',x:(x+3)*TS,y:(y+4)*TS});for(let k=0;k<3;k++){const tx=x+sri(0,9),ty=y+sri(3,6);if(ok(tx,ty,1,1)){addTree(tx,ty,'birch');RES[idx(tx,ty)]=1}}}
      else if(r<.7){put(x,y,3,10,{kind:'sov',ht,fac,roof:'#6E7478'});put(x+5,y+1,4,4,{kind:'sov',ht:ht+16,fac,roof:'#6E7478'});put(x+5,y+6,4,3,{kind:'sov',ht,fac,roof:'#6E7478'})}
      else if(r<.82){put(x+1,y+1,8,1,{kind:'garages',ht:16,fac:'#8C8F8A',roof:'#6B6F6B'});put(x+1,y+8,8,1,{kind:'garages',ht:16,fac:'#8C8F8A',roof:'#6B6F6B'});
        for(let yy=y;yy<y+10;yy++)for(let xx=x;xx<x+10;xx++){const j=idx(xx,yy);if(CITYA[j]===c.i+1&&!RES[j]&&(TL[j]===T.YARD||TL[j]===T.GRASS)){TL[j]=T.LOT;RES[j]=1}}}
      else if(r<.92){for(let yy=y;yy<y+10;yy++)for(let xx=x;xx<x+10;xx++){const j=idx(xx,yy);if(CITYA[j]===c.i+1&&!RES[j]&&(TL[j]===T.YARD||TL[j]===T.GRASS))TL[j]=T.PARK}
        for(let k=0;k<8;k++){const tx=x+sri(0,9),ty=y+sri(0,9);if(TL[idx(tx,ty)]===T.PARK&&!RES[idx(tx,ty)]){addTree(tx,ty);RES[idx(tx,ty)]=1}}
        if(SR()<.5)DECOR.push({k:'hoop',x:(x+5)*TS,y:(y+5)*TS})}
      else{put(x+1,y+1,8,8,{kind:'sov',ht:sri(126,146),fac,roof:'#6E7478'})}
    }else{
      for(let py=0;py<2;py++)for(let px=0;px<2;px++){if(SR()<.18)continue;
        put(x+px*5+sri(0,1),y+py*5+sri(0,1),3,3,{kind:'house',ht:sri(30,38),fac:spick(facHouse),roof:spick(roofHouse)})}
      for(let k=0;k<5;k++){const tx=x+sri(0,9),ty=y+sri(0,9);if(ok(tx,ty,1,1)){addTree(tx,ty,spick(['oak','birch','pine','apple']));RES[idx(tx,ty)]=1}}
    }
  }
}

function doorOf(b){return [b.x+Math.floor(b.w/2),b.y+b.h]}
function freeBuilding(c,dmin,dmax,kinds,minW){
  const cands=BUILDINGS.filter(b=>b.city===c.id&&!b.poi&&!b.landmark&&(!kinds||kinds.includes(b.kind))&&b.w>=(minW||2)&&b.kind!=='garages'&&(()=>{const d=dist(b.x+b.w/2,b.y+b.h/2,c.cx,c.cy)/c.R;return d>=dmin&&d<=dmax})()&&(()=>{const[dx,dy]=doorOf(b);return WALKABLE[tileAt(dx,dy)]})());
  return cands.length?spick(cands):null}
function addPOI(c,kind,name,b,extra){if(!b)return null;const[dx,dy]=doorOf(b);const p=Object.assign({id:kind+'_'+c.id+'_'+POIS.length,kind,name,city:c.id,b,x:dx*TS+16,y:dy*TS+14},extra||{});b.poi=p;POIS.push(p);return p}
function kiosk(c){for(let k=0;k<4000;k++){const x=c.cx+sri(-c.R,c.R),y=c.cy+sri(-c.R,c.R);let ok=true;
    for(let yy=y;yy<y+2&&ok;yy++)for(let xx=x;xx<x+3;xx++){if(!inb(xx,yy)){ok=false;break}const i=idx(xx,yy),t=TL[i];if(CITYA[i]!==c.i+1||RES[i]||!(t===T.YARD||t===T.GRASS||t===T.PARK||t===T.DUNE)){ok=false;break}}
    if(ok&&WALKABLE[tileAt(x+1,y+2)]||ok&&tileAt(x+1,y+2)===T.GRASS)return addB({x,y,w:3,h:2,kind:'house',ht:30,fac:spick(['#E9E2D0','#D8CFB8','#C9D1C7']),roof:spick(['#7B3B2E','#4E5A3E','#3D4650']),city:c.id})}return null}
function placeServices(c){
  const big=c.R>=30,S=(k,n,a,b,kinds,e)=>addPOI(c,k,n,freeBuilding(c,a,b,kinds)||freeBuilding(c,0,1.2,null)||kiosk(c),e);
  SCHOOLS[c.id].forEach((s,k)=>{const b=freeBuilding(c,.35,.9,['sov','office','old','house'],3)||freeBuilding(c,0,1.2,null)||kiosk(c);if(b){b.fac=k?'#D9B28A':'#C9B79A';b.school=true;
    addPOI(c,'school',s[0],b,{fac:'sch_'+c.id+k})}});
  S('shop',SHOPS.shop.name,.2,.7);if(c.R>12)S('shop',SHOPS.shop.name,.5,.95);
  S('kebab','Kebabinė „Pas Ahmedą“',.1,.6);S('cafe','Kavinė „Cepelinų namai“',0,.35,['old','house']);
  S('bus','Autobusų stotis',.25,.6);S('garage','Autoservisas „Pas Stasį“',.55,1);S('police','Policijos komisariatas',.2,.6);
  if(big){S('hospital','Ligoninė',.3,.8);S('gym','Sporto klubas „Geležis“',.4,.9);S('market','Turgus',.3,.7);S('office','Verslo centras',.25,.5,['office','sov','mall']);S('bar','Baras „Bambalynė“',.1,.5)}
  else{S('bar','Baras „Prie jūros“',0,.6)}
  Object.entries(FACTIONS).forEach(([id,f])=>{if(f.city!==c.id||f.type==='school'||f.type==='crew')return;if(POIS.some(p=>p.hq===id))return;
    const b=f.type==='auto'?freeBuilding(c,.5,1,['sov','house','office']):freeBuilding(c,.45,1,['sov','house']);
    const bb=b||freeBuilding(c,0,1.2,null)||kiosk(c);if(bb){const b=bb;addPOI(c,'hq',(f.type==='auto'?'Klubo garažas · ':'Būstinė · ')+f.short,b,{hq:id});b.hqColor=f.color}});
}

/* ---------- minimap base ---------- */
const TCOL=['#86A85F','#3F6B3A','#3D6D8D','#4F87A8','#E5D5A6','#5A5E62','#B9BAB3','#7D7366','#6FA05A','#9C8F82','#8A8F94','#C8B868','#4A4E52','#62666A','#E2D3A2','#8EAF6C','#2A3036','#EDEDE6','#9B7650'];
let MMC=null;
function buildMinimap(){MMC=document.createElement('canvas');MMC.width=W;MMC.height=H;const g=MMC.getContext('2d'),im=g.createImageData(W,H),d=im.data;
  const rgb=TCOL.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
  for(let i=0;i<W*H;i++){let t=TL[i];let c=rgb[t];if(t===T.FIELD&&hash2(i%W>>2,(i/W|0)>>2)<.4)c=[150,175,90];if(t===T.HWY||t===T.ROAD&&!CITYA[i])c=[230,200,90];
    d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=255}
  g.putImageData(im,0,0)}
