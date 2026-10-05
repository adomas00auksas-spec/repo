
/* =====================================================================
   WORLD — one map at a time: a city, a special location or a highway.
   Cities are built from CITYDATA (real coordinates): water, parks,
   squares, named main streets and landmarks are placed where they really
   are; side streets and buildings follow each neighbourhood's style.
   ===================================================================== */
let TL,CITYA,DISTA,RES,DTYPE,USED;
let BUILDINGS=[],TREES=[],POIS=[],DECOR=[],STREETS=[],LAMPS=[],EXITS=[],HWYS=[];
let BW=1,BH=1,BBUCK=[],TBUCK=[],SBUCK=[];
let MAP={id:null,kind:'city',name:''};
const DISTRICTS=[];
const idx=(x,y)=>y*W+x;
const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const tileAt=(x,y)=>inb(x,y)?TL[y*W+x]:T.ABROAD;
const setT=(x,y,t)=>{if(inb(x,y))TL[y*W+x]=t};
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function paintLine(pts,r,fn){for(let i=0;i<pts.length-1;i++){const[ax,ay]=pts[i],[bx,by]=pts[i+1];const L=Math.hypot(bx-ax,by-ay),n=Math.ceil(L*2);
  for(let s=0;s<=n;s++){const t=s/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;const R=Math.ceil(r);
    for(let oy=-R;oy<=R;oy++)for(let ox=-R;ox<=R;ox++){if(ox*ox+oy*oy>r*r+.3)continue;const X=Math.round(x+ox),Y=Math.round(y+oy);if(inb(X,Y))fn(X,Y)}}}}
function fillPoly(P,fn){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)});
  for(let y=Math.max(0,Math.floor(y0));y<=Math.min(H-1,Math.ceil(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<=Math.min(W-1,Math.ceil(x1));x++)if(inPoly(x+.5,y+.5,P))fn(x,y)}
function addB(b){b.id=BUILDINGS.length;BUILDINGS.push(b);for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){if(!inb(x,y))continue;if(b.solid!==false)setT(x,y,T.BUILD);RES[idx(x,y)]=1;USED[idx(x,y)]=1}
  const k=(clamp(b.y,0,H-1)>>4)*BW+(clamp(b.x,0,W-1)>>4);BBUCK[k].push(b);return b}
function addTree(x,y,kind){if(!inb(x,y))return;const t={x:x*TS+16+sr(-6,6),y:y*TS+22+sr(-5,5),k:kind||spick(['oak','birch','pine','lime']),s:sr(.8,1.2)};TREES.push(t);TBUCK[(y>>4)*BW+(x>>4)].push(t)}
const curCityObj=()=>MAP.kind==='city'?cityById(MAP.id):null;
function cityOf(){return curCityObj()}

/* ---------- map setup ---------- */
function setupMap(w,h){W=w;H=h;TL=new Uint8Array(W*H);CITYA=new Uint8Array(W*H);DISTA=new Uint16Array(W*H);RES=new Uint8Array(W*H);DTYPE=new Uint8Array(W*H);USED=new Uint8Array(W*H);
  BUILDINGS=[];TREES=[];POIS=[];DECOR=[];STREETS=[];LAMPS=[];EXITS=[];HWYS=[];BW=Math.ceil(W/16);BH=Math.ceil(H/16);
  BBUCK=Array.from({length:BW*BH},()=>[]);TBUCK=Array.from({length:BW*BH},()=>[]);SBUCK=Array.from({length:BW*BH},()=>[]);chunkCache.clear()}
function projFor(bbox){const[la0,lo0,la1,lo1]=bbox,latc=(la0+la1)/2,kx=111320*Math.cos(latc*Math.PI/180)/MPT,ky=110574/MPT;
  return{w:Math.round((lo1-lo0)*kx),h:Math.round((la0-la1)*ky),p:([lat,lon])=>[(lon-lo0)*kx,(la0-lat)*ky]}}
const DTN=['none','old','center','modern','soviet','private','industrial','resort','fishing','karaim','field'];
const DTP={
 old:{sp:15,rw:2,jit:4,lim:4,bw:[2,6],bh:[2,5],gap:0,ht:[44,72],kind:'old'},
 center:{sp:23,rw:3,lim:6,bw:[3,9],bh:[3,6],gap:0,ht:[66,112],kind:'old',center:1},
 modern:{sp:30,rw:4,lim:14,bw:[5,8],bh:[5,8],gap:4,ht:[150,290],kind:'office'},
 soviet:{sp:34,rw:3,lim:40,slab:1,gap:6,ht:[70,116],kind:'sov'},
 private:{sp:14,rw:2,lim:6,bw:[2,3],bh:[2,3],gap:2,ht:[30,38],kind:'house'},
 industrial:{sp:36,rw:3,lim:22,bw:[6,14],bh:[5,10],gap:3,ht:[30,42],kind:'warehouse'},
 resort:{sp:18,rw:2,lim:7,bw:[3,5],bh:[3,4],gap:3,ht:[34,48],kind:'house'},
 fishing:{sp:16,rw:2,lim:6,bw:[3,4],bh:[2,3],gap:3,ht:[28,34],kind:'house'},
 karaim:{sp:14,rw:2,lim:5,bw:[2,3],bh:[2,3],gap:2,ht:[28,34],kind:'house'},
 field:{sp:999,rw:0,lim:0,bw:[3,3],bh:[3,3],gap:9,ht:[30,30],kind:'house'},
};
const FAC={old:['#E9D7A8','#E6C3B3','#CFE0D0','#F1EBDD','#E3C07E','#D9CBB7','#C8D7E3','#E8B9A0'],center:['#D8CDB4','#C9C4B8','#E3D3B0','#BFC8C9','#D9C27A','#C99A8A','#A8B9CC'],
 sov:['#C9C4B8','#B8B3A6','#D3CBB5','#A9AFA8','#BDB8AE','#D9C27A','#9FB7A8','#C99A8A','#A8B9CC'],house:['#E9E2D0','#D8CFB8','#C9D1C7','#E7D6C1','#D3D9DD'],
 office:['#8FA8B8','#A7B6BF','#6F8796','#B7C3C9','#7E97A6'],fish:['#8B3A2E','#3E5F7A','#7A5A3C','#2F5E4E'],karaim:['#D9B44A','#4F7FA6','#B5533A','#6E9F55']};
const ROOF_OLD=['#B5523B','#A94832','#C0623F','#9A4630','#59636B'],ROOF_HOUSE=['#7B3B2E','#4E5A3E','#5B4A3A','#8C3C2C','#3D4650'];

/* ---------- districts (global, ownership persists) ---------- */
function initDistricts(){if(DISTRICTS.length)return;CITIES.forEach(c=>{const D=CITYDATA[c.id];D.districts.forEach((d,di)=>DISTRICTS.push({id:DISTRICTS.length,city:c.id,ci:c.i,di,name:d.name,type:d.type,peace:!!d.peace,owner:(START_OWNERS[c.id]||[])[di]||null,cx:0,cy:0}))})}

/* ---------- city generator ---------- */
function genFromData(D,mapId,city){
  const pr=projFor(D.bbox);setupMap(pr.w,pr.h);SR=mulberry(hashStr(mapId));const P_=pts=>pts.map(pr.p);
  const ci=city?city.i+1:0;const defType=DTN.indexOf(D.defType||'private');
  for(let i=0;i<W*H;i++){TL[i]=D.base===undefined?T.GRASS:D.base;CITYA[i]=ci;DTYPE[i]=defType}
  // districts
  const dl=city?DISTRICTS.filter(d=>d.city===city.id):[];
  (D.districts||[]).forEach((d,k)=>{const poly=P_(d.poly);d._p=poly;const t=DTN.indexOf(d.type);fillPoly(poly,(x,y)=>{const i=idx(x,y);DTYPE[i]=t;if(dl[k])DISTA[i]=dl[k].id+1})});
  // water, beaches, dunes
  (D.water||[]).forEach(w=>{const p=P_(w.pts);if(w.poly)fillPoly(p,(x,y)=>{TL[idx(x,y)]=w.sea?T.SEA:T.WATER;RES[idx(x,y)]=2});else paintLine(p,Math.max(1,w.w/2/MPT),(x,y)=>{TL[idx(x,y)]=T.WATER;RES[idx(x,y)]=2})});
  if(D.beach)fillPoly(P_(D.beach.poly),(x,y)=>{if(TL[idx(x,y)]!==T.SEA){TL[idx(x,y)]=T.SAND;RES[idx(x,y)]=2}});
  (D.dunes||[]).forEach(d=>fillPoly(P_(d.poly),(x,y)=>{const i=idx(x,y);if(TL[i]===T.GRASS){TL[i]=T.DUNE;RES[i]=2}}));
  (D.abroad||[]).forEach(a=>fillPoly(P_(a.poly),(x,y)=>{TL[idx(x,y)]=T.ABROAD;RES[idx(x,y)]=2}));
  (D.fields||[]).forEach(a=>fillPoly(P_(a.poly),(x,y)=>{const i=idx(x,y);if(TL[i]===T.GRASS){TL[i]=T.FIELD;RES[i]=2}}));
  (D.lots||[]).forEach(a=>fillPoly(P_(a.poly),(x,y)=>{const i=idx(x,y);if(TL[i]===T.GRASS){TL[i]=T.LOT;RES[i]=1}}));
  const parkTiles=[];
  (D.parks||[]).forEach(p=>{const poly=P_(p.poly);p._p=poly;fillPoly(poly,(x,y)=>{const i=idx(x,y);if(TL[i]===T.WATER||TL[i]===T.SEA)return;TL[i]=p.forest?T.FOREST:T.PARK;RES[i]=2;if(!p.forest)parkTiles.push([x,y,p])})});
  (D.plazas||[]).forEach(p=>fillPoly(P_(p.poly),(x,y)=>{const i=idx(x,y);if(TL[i]!==T.WATER&&TL[i]!==T.SEA){TL[i]=T.COBBLE;RES[i]=1}}));
  // named main streets
  (D.streets||[]).forEach(st=>{const pts=P_(st.pts);const r=Math.max(1,st.w/2/MPT);
    paintLine(pts,r,(x,y)=>{const i=idx(x,y),t=TL[i];if(t===T.ABROAD)return;if(st.rail){if(t!==T.WATER&&t!==T.SEA)TL[i]=T.RAIL;RES[i]=1;return}
      if(t===T.WATER||t===T.SEA){TL[i]=st.ped?T.WBRIDGE:T.BRIDGE}else TL[i]=st.ped?T.COBBLE:st.hwy?T.HWY:T.ROAD;RES[i]=1});
    addStreet({name:st.n,pts,w:r,troll:!!st.troll,ped:!!st.ped,rail:!!st.rail,trees:!!st.trees,main:1,hwy:!!st.hwy})});
  (D.bridges||[]).forEach(b=>{const pts=P_(b.pts);paintLine(pts,Math.max(1,b.w/2/MPT),(x,y)=>{const i=idx(x,y);TL[i]=b.white?T.WBRIDGE:T.BRIDGE;RES[i]=1})});
  // generated side streets in each neighbourhood
  procStreets(D,P_);
  // sidewalks
  const isStreet=t=>t===T.ROAD||t===T.HWY;
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=idx(x,y);if(TL[i]!==T.GRASS)continue;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(isStreet(TL[i+dy*W+dx])){TL[i]=T.WALK;RES[i]=1;dy=2;break}}}
  // ship, cranes, ferry, pier, meet spot, landmarks (before buildings)
  if(D.pier){const[px,py]=pr.p(D.pier.at).map(Math.round);for(let k=0;k<D.pier.len;k++)for(let w=0;w<3;w++){const x=px-k,y=py+w-1;if(inb(x,y)&&(TL[idx(x,y)]===T.SEA||TL[idx(x,y)]===T.SAND)){TL[idx(x,y)]=T.PIER;RES[idx(x,y)]=1}}
    POIS.push({id:'lm_pier',kind:'landmark',name:D.pier.name,x:(px-2)*TS,y:(py+1)*TS+20,desc:'The Palanga pier, 470 m into the Baltic. Sunset here is the law.'})}
  if(D.ship){const[sx,sy]=pr.p(D.ship.at);DECOR.push({k:'ship',x:sx*TS-80,y:sy*TS-20,name:D.ship.name});POIS.push({id:'lm_ship',kind:'landmark',name:D.ship.name,x:sx*TS+60,y:sy*TS+50,desc:'The sailing ship Meridianas, moored on the Danė since 1948.'})}
  (D.cranes||[]).forEach(c=>{const[x,y]=pr.p(c);DECOR.push({k:'crane',x:x*TS,y:y*TS})});
  if(D.ferry){const[fx,fy]=pr.p(D.ferry.at).map(Math.round);stamp(fx-2,fy-2,5,5,T.LOT);POIS.push({id:'ferry_'+mapId,kind:'ferry',name:D.ferry.name,x:fx*TS+16,y:fy*TS+16,to:D.ferry.to})}
  if(D.meet){const[mx,my]=pr.p(D.meet.at).map(Math.round);stamp(mx-8,my-5,16,10,T.LOT);const b=addB({x:mx-4,y:my-5,w:8,h:3,kind:'warehouse',ht:34,landmark:true,name:D.meet.name,city:city&&city.id,fac:'#C9CED1',roof:'#7E878C'});
    const p={id:'meet_'+mapId,kind:'landmark',name:D.meet.name,city:city&&city.id,b,x:mx*TS+16,y:(my-1)*TS+20,meet:D.meet.fac,desc:`Car park. At night ${FACTIONS[D.meet.fac]?FACTIONS[D.meet.fac].name:'a car club'} meet here.`};b.poi=p;POIS.push(p)}
  (D.landmarks||[]).forEach(l=>{const[x,y]=pr.p(l.at);const x0=Math.round(x-l.w/2),y0=Math.round(y-l.h/2);stamp(x0-1,y0-1,l.w+2,l.h+3,l.k==='tower'?T.PARK:T.COBBLE);
    const b=addB({x:x0,y:y0,w:l.w,h:l.h,kind:l.k,ht:l.ht,landmark:!!l.name,name:l.name,city:city&&city.id,solid:l.solid,fac:l.fac,roof:l.roof});
    if(l.name){const p={id:'lm_'+mapId+'_'+POIS.length,kind:'landmark',name:l.name,city:city&&city.id,b,x:(x0+l.w/2)*TS,y:(y0+l.h)*TS+18,desc:l.desc||'',hq:l.hq};b.poi=p;POIS.push(p)}});
  // buildings
  packBuildings();
  // leftovers: yards, gardens, trees
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);if(TL[i]!==T.GRASS)continue;const dt=DTN[DTYPE[i]];
    if(USED[i]===2||!RES[i]){if(dt==='old'||dt==='center'||dt==='soviet'||dt==='modern'){TL[i]=dt==='modern'&&hash2(x>>3,y>>3)<.22?T.COBBLE:T.YARD}
      const h=hash2(x*3,y*7);if(TL[i]===T.YARD&&h<.025||TL[i]===T.GRASS&&h<(dt==='private'||dt==='karaim'||dt==='fishing'||dt==='resort'?.07:.02)){addTree(x,y,dt==='fishing'||dt==='resort'?'pine':undefined);RES[i]=1}
      else if(TL[i]===T.YARD&&dt==='soviet'&&h>.9985)DECOR.push({k:'play',x:x*TS,y:y*TS})}}
  parkTiles.forEach(([x,y,p])=>{const h=hash2(x*5,y*11);if(TL[idx(x,y)]!==T.PARK)return;if(h<.06){addTree(x,y);RES[idx(x,y)]=1}else if(p.sport&&h>.996)DECOR.push({k:'hoop',x:x*TS,y:y*TS})});
  (D.streets||[]).forEach(st=>{if(!st.trees)return;const s=STREETS.find(q=>q.name===st.n);if(!s)return;walkLine(s.pts,3,(x,y,nx,ny)=>{for(const sg of[-1,1]){const X=Math.round(x+nx*sg*(s.w-1)),Y=Math.round(y+ny*sg*(s.w-1));if(inb(X,Y)&&TL[idx(X,Y)]===T.COBBLE)addTree(X,Y,'lime')}})});
  // lamps and street furniture
  STREETS.forEach(s=>{if(s.rail)return;walkLine(s.pts,s.main?9:14,(x,y,nx,ny)=>{const X=Math.round(x+nx*(s.w+1)),Y=Math.round(y+ny*(s.w+1));if(inb(X,Y)&&WALKABLE[TL[idx(X,Y)]])LAMPS.push({x:X*TS+8,y:Y*TS+10})})});
  // map exits (main streets reaching the edge)
  STREETS.forEach(s=>{if(s.ped||s.rail||!s.main)return;[s.pts[0],s.pts[s.pts.length-1]].forEach(p=>{if(p[0]<3||p[1]<3||p[0]>W-4||p[1]>H-4)EXITS.push({x:clamp(p[0],2,W-3)*TS,y:clamp(p[1],2,H-3)*TS,name:s.name})})});
  // district centres
  if(city){dl.forEach(d=>{d.sx=0;d.sy=0;d.cnt=0});for(let i=0;i<W*H;i++){const v=DISTA[i];if(v){const d=DISTRICTS[v-1];d.sx+=i%W;d.sy+=(i/W|0);d.cnt++}}
    dl.forEach(d=>{if(d.cnt){d.cx=Math.round(d.sx/d.cnt);d.cy=Math.round(d.sy/d.cnt);const t=nearestTile(d.cx,d.cy,t=>WALKABLE[t]);if(t){d.cx=t[0];d.cy=t[1]}}})}
  return pr}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function nearestTile(x0,y0,test,maxR){for(let r=0;r<(maxR||40);r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=x0+dx,y=y0+dy;if(inb(x,y)&&test(TL[idx(x,y)],x,y))return[x,y]}return null}
function walkLine(pts,step,fn){let acc=0;for(let i=0;i<pts.length-1;i++){const[ax,ay]=pts[i],[bx,by]=pts[i+1];const L=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/L,ny=(bx-ax)/L;
  for(let d=acc;d<L;d+=step){fn(ax+(bx-ax)*d/L,ay+(by-ay)*d/L,nx,ny)}acc=(acc-L)%step;if(acc<0)acc+=step}}
function addStreet(s){s.id=STREETS.length;STREETS.push(s);s.pts.forEach((p,i)=>{const bx=clamp(p[0]|0,0,W-1)>>4,by=clamp(p[1]|0,0,H-1)>>4;SBUCK[by*BW+bx].push([s.id,i])})}
function procStreets(D,P_){
  (D.districts||[]).forEach(d=>{const prm=DTP[d.type];if(!prm||prm.sp>500)return;const poly=d._p;const a=(d.ang||0)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);const[ox,oy]=poly[0];
    const isOld=d.type==='old';
    fillPoly(poly,(x,y)=>{const i=idx(x,y);if(RES[i]||TL[i]!==T.GRASS)return;let u=(x-ox)*ca+(y-oy)*sa,v=-(x-ox)*sa+(y-oy)*ca;
      if(prm.jit){u+=(vnoise(x*.035+7,y*.035)-.5)*2*prm.jit;v+=(vnoise(x*.035,y*.035+13)-.5)*2*prm.jit}
      const mu=((u%prm.sp)+prm.sp)%prm.sp,mv=((v%prm.sp)+prm.sp)%prm.sp;if(mu<prm.rw||mv<prm.rw){TL[i]=isOld?T.COBBLE:T.ROAD;RES[i]=3}});
    if(isOld)return;
    // polylines for traffic along generated streets
    let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;poly.forEach(([x,y])=>{const u=(x-ox)*ca+(y-oy)*sa,v=-(x-ox)*sa+(y-oy)*ca;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)});
    const run=(fixU,c)=>{let cur=[];const flush=()=>{if(cur.length>=8){const pts=cur.filter((p,k)=>k%4===0||k===cur.length-1);addStreet({name:'',pts,w:prm.rw/2+.5,proc:1})}cur=[]};
      for(let t=(fixU?v0:u0);t<=(fixU?v1:u1);t+=1){const u=fixU?c:t,v=fixU?t:c;const x=ox+u*ca-v*sa,y=oy+u*sa+v*ca;const X=Math.round(x),Y=Math.round(y);
        if(inb(X,Y)&&RES[idx(X,Y)]===3)cur.push([x,y]);else if(inb(X,Y)&&RES[idx(X,Y)]===1&&(TL[idx(X,Y)]===T.ROAD||TL[idx(X,Y)]===T.BRIDGE)&&cur.length)cur.push([x,y]);else flush()}flush()};
    for(let k=Math.floor(u0/prm.sp);k<=Math.ceil(u1/prm.sp);k++)run(true,k*prm.sp+prm.rw/2-.5);
    for(let k=Math.floor(v0/prm.sp);k<=Math.ceil(v1/prm.sp);k++)run(false,k*prm.sp+prm.rw/2-.5)});
  for(let i=0;i<W*H;i++)if(RES[i]===3)RES[i]=1}

/* ---------- buildings: greedy rectangle packing by neighbourhood ---------- */
function packBuildings(){
  // distance from walkable street tiles
  const D=new Uint8Array(W*H).fill(255),q=new Int32Array(W*H);let qh=0,qt=0;
  for(let i=0;i<W*H;i++){const t=TL[i];if(t===T.WALK||t===T.COBBLE||t===T.ROAD){D[i]=0;q[qt++]=i}}
  while(qh<qt){const i=q[qh++],x=i%W,y=i/W|0,d=D[i]+1;if(d>60)continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(!inb(X,Y))continue;const j=Y*W+X;if(D[j]>d&&TL[j]===T.GRASS&&!RES[j]){D[j]=d;q[qt++]=j}}}
  const free=(x,y,t)=>{if(!inb(x,y))return false;const i=idx(x,y);return TL[i]===T.GRASS&&!RES[i]&&!USED[i]&&DTYPE[i]===t&&D[i]<=DTP[DTN[t]].lim};
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=idx(x,y);if(TL[i]!==T.GRASS||RES[i]||USED[i])continue;const t=DTYPE[i],tn=DTN[t],prm=DTP[tn];if(!prm||D[i]>prm.lim)continue;
    let mw,mh,minw=2,minh=2;
    if(prm.slab){const hz=hash2(x>>5,y>>5)<.55;if(hash2(x>>4,(y>>4)+9)<.12){mw=5;mh=5;minw=5;minh=5}else{mw=hz?16:3;mh=hz?3:16;minw=hz?8:3;minh=hz?3:8}}
    else{mw=sri(prm.bw[0],prm.bw[1]);mh=sri(prm.bh[0],prm.bh[1]);minw=Math.min(prm.bw[0],mw);minh=Math.min(prm.bh[0],mh)}
    let w=0;while(w<mw&&free(x+w,y,t))w++;if(w<minw){USED[i]=2;continue}
    let h=1;outer:while(h<mh){for(let k=0;k<w;k++)if(!free(x+k,y+h,t))break outer;h++}if(h<minh){USED[i]=2;continue}
    const b={x,y,w,h,city:MAP.city||null,dt:tn};
    if(tn==='soviet'){b.kind='sov';b.ht=w===5&&h===5?sri(140,170):(hash2(x>>5,y>>6)<.45?sri(100,116):sri(66,74));b.fac=spick(FAC.sov);b.roof='#6E7478'}
    else if(tn==='modern'){b.kind='office';b.ht=sri(prm.ht[0],prm.ht[1]);b.fac=spick(FAC.office);b.roof='#5D6970'}
    else if(tn==='industrial'){b.kind='warehouse';b.ht=sri(30,42);b.fac=spick(['#9AA0A3','#B8B3A6','#8C949A','#A9AFA8']);b.roof='#6E7478'}
    else if(tn==='old'||tn==='center'){b.kind=tn==='center'&&hash2(x,y)<.15?'office':'old';b.ht=sri(prm.ht[0],prm.ht[1]);b.fac=spick(tn==='old'?FAC.old:FAC.center);b.roof=b.kind==='office'?'#5D6970':spick(ROOF_OLD);if(b.kind==='office')b.fac=spick(FAC.office)}
    else{b.kind='house';b.ht=sri(prm.ht[0],prm.ht[1]);b.fac=spick(tn==='fishing'?FAC.fish:tn==='karaim'?FAC.karaim:FAC.house);b.roof=tn==='fishing'?'#4A3B2E':spick(ROOF_HOUSE)}
    addB(b);
    if(prm.gap)for(let yy=y-prm.gap;yy<y+h+prm.gap;yy++)for(let xx=x-prm.gap;xx<x+w+prm.gap;xx++){if(inb(xx,yy)&&!USED[idx(xx,yy)])USED[idx(xx,yy)]=2}}}

/* ---------- POIs ---------- */
function doorOf(b){return [b.x+Math.floor(b.w/2),b.y+b.h]}
const doorOK=b=>{const[dx,dy]=doorOf(b);return WALKABLE[tileAt(dx,dy)]};
function freeBuildingT(types,kinds,minW,near){const c=BUILDINGS.filter(b=>!b.poi&&!b.landmark&&(!types||types.includes(b.dt))&&(!kinds||kinds.includes(b.kind))&&b.w>=(minW||2)&&doorOK(b));
  if(!c.length)return null;if(near){let best=null,bd=1e9;c.forEach(b=>{const d=dist(b.x+b.w/2,b.y+b.h/2,near[0],near[1]);if(d<bd){bd=d;best=b}});return bd<60?best:null}return spick(c)}
function freeBuilding(c,a,b,kinds,minW){return freeBuildingT(null,kinds,minW)}
function addPOI(c,kind,name,b,extra){if(!b)return null;const[dx,dy]=doorOf(b);const p=Object.assign({id:kind+'_'+MAP.id+'_'+POIS.length,kind,name,city:MAP.id,b,x:dx*TS+16,y:dy*TS+14},extra||{});b.poi=p;POIS.push(p);return p}
function kiosk(){for(let k=0;k<6000;k++){const x=sri(2,W-5),y=sri(2,H-4);let ok=true;
    for(let yy=y;yy<y+2&&ok;yy++)for(let xx=x;xx<x+3;xx++){const i=idx(xx,yy),t=TL[i];if(RES[i]&&RES[i]!==2||!(t===T.YARD||t===T.GRASS)){ok=false;break}}
    if(ok&&WALKABLE[tileAt(x+1,y+2)])return addB({x,y,w:3,h:2,kind:'house',ht:30,fac:spick(FAC.house),roof:spick(ROOF_HOUSE),city:MAP.city||null,dt:'private'})}return null}
function buildAt(x0,y0){for(let r=0;r<12;r++)for(let k=0;k<16;k++){const x=x0+Math.round(Math.cos(k/16*6.283)*r),y=y0+Math.round(Math.sin(k/16*6.283)*r);let ok=true;
    for(let yy=y-1;yy<y+4&&ok;yy++)for(let xx=x-1;xx<x+4;xx++){const t=tileAt(xx,yy);if(t===T.WATER||t===T.SEA||t===T.BUILD||t===T.ABROAD||t===T.ROAD||t===T.HWY){ok=false;break}}
    if(ok){stamp(x-1,y-1,5,5,T.YARD);setT(x+1,y+2,T.WALK);setT(x+1,y+3,T.WALK);return addB({x,y,w:3,h:2,kind:'house',ht:32,fac:spick(FAC.house),roof:spick(ROOF_HOUSE),dt:'field'})}}return null}
function stamp(x0,y0,w,h,ground){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){if(!inb(x,y))continue;const t=TL[idx(x,y)];if(t===T.SEA||t===T.WATER||t===T.ABROAD)continue;if(ground!==undefined)TL[idx(x,y)]=ground;RES[idx(x,y)]=1}}
function placeCityPOIs(c,D,pr){const S=(k,n,types,kinds,e)=>addPOI(c,k,n,freeBuildingT(types,kinds)||freeBuildingT(null,null)||kiosk(),e);
  (D.pois||[]).forEach(q=>{const[x,y]=pr.p(q.at);const b=freeBuildingT(null,null,2,[x,y])||kiosk();const p=addPOI(c,q.kind,q.name,b,q.hq?{hq:q.hq}:{});if(p&&q.hq)b.hqColor=FACTIONS[q.hq].color});
  const has=k=>POIS.some(p=>p.kind===k);const big=['vilnius','kaunas','klaipeda','siauliai','panevezys'].includes(c.id);
  SCHOOLS[c.id].forEach((s,k)=>{const b=freeBuildingT(['soviet','center','private','fishing','resort'],['sov','old','house'],3)||freeBuildingT(null,null)||kiosk();if(b){b.fac=k?'#D9B28A':'#C9B79A';b.school=true;addPOI(c,'school',s[0],b,{fac:'sch_'+c.id+k})}});
  const nShops=big?4:2;for(let k=0;k<nShops;k++)S('shop',SHOPS.shop.name,['soviet','center','old','resort','fishing','private']);
  if(!has('kebab'))S('kebab','Kebabinė „Pas Ahmedą“',['center','old','soviet']);if(big)S('kebab','Kebabinė „Turkas“',['soviet']);
  if(!has('cafe'))S('cafe','Kavinė „Cepelinų namai“',['old','center','resort','fishing'],['old','house']);
  if(!has('bus'))S('bus','Autobusų stotis',['center','soviet']);
  S('garage','Autoservisas „Pas Stasį“',['soviet','industrial','private']);S('police','Policijos komisariatas',['center','old','soviet']);
  if(big||c.id==='alytus'){S('hospital','Ligoninė',['center','soviet']);S('gym','Sporto klubas „Geležis“',['soviet','center']);if(!has('market'))S('market','Turgus',['center','soviet']);
    S('office','Verslo centras',['modern','center'],['office','old','sov']);if(!has('bar'))S('bar','Baras „Bambalynė“',['old','center'])}
  else if(!has('bar'))S('bar','Baras „Prie jūros“',null);
  if(!has('club')&&big)S('club','Naktinis klubas',['old','center']);
  for(let k=0;k<(big?3:1);k++)S('kiosk','Spaudos kioskas',['soviet','center','old']);
  Object.entries(FACTIONS).forEach(([id,f])=>{if(f.city!==c.id||f.type==='school'||f.type==='crew'||id==='pasienio')return;if(POIS.some(p=>p.hq===id))return;
    const own=DISTRICTS.find(d=>d.city===c.id&&d.owner===id);const b=(own?freeBuildingT([own.type],null,3,[own.cx,own.cy]):null)||freeBuildingT(f.type==='auto'?['soviet','industrial','private']:['soviet','private'],null,3)||freeBuildingT(null,null)||kiosk();
    if(b){addPOI(c,'hq',(f.type==='auto'?'Klubo garažas · ':'Būstinė · ')+f.short,b,{hq:id});b.hqColor=f.color}});
  // public transport stops along main streets
  const troll=['vilnius','kaunas'].includes(c.id);STREETS.forEach(s=>{if(!s.main||s.ped||s.rail||(troll&&!s.troll&&hash2(s.id,3)<.5))return;
    walkLine(s.pts,70,(x,y,nx,ny)=>{const X=Math.round(x+nx*(s.w+1.2)),Y=Math.round(y+ny*(s.w+1.2));if(!inb(X,Y)||!WALKABLE[TL[idx(X,Y)]])return;
      if(POIS.some(p=>p.kind==='stop'&&dist(p.x,p.y,X*TS,Y*TS)<30*TS))return;POIS.push({id:'stop_'+MAP.id+'_'+POIS.length,kind:'stop',name:`Stotelė „${s.name}“`,city:MAP.id,x:X*TS+16,y:Y*TS+16,street:s.id,troll:troll&&s.troll});DECOR.push({k:'stop',x:X*TS,y:Y*TS,troll:troll&&s.troll})})})}

/* ---------- special locations ---------- */
const LOCDATA={
 trakai:{bbox:[54.6550,24.9200,54.6380,24.9480],defType:'karaim',
  water:[{poly:1,name:'Galvė',pts:[[54.6555,24.9195],[54.6555,24.9485],[54.6492,24.9485],[54.6484,24.9380],[54.6490,24.9300],[54.6497,24.9195]]},{poly:1,name:'Totoriškių ežeras',pts:[[54.6480,24.9420],[54.6480,24.9485],[54.6400,24.9485],[54.6410,24.9440]]}],
  parks:[{name:'Salos pilies sala',poly:[[54.6530,24.9322],[54.6530,24.9350],[54.6512,24.9350],[54.6512,24.9322]]},{name:'Pušynas',forest:1,poly:[[54.6460,24.9200],[54.6460,24.9290],[54.6380,24.9290],[54.6380,24.9200]]}],
  districts:[{name:'Trakai',type:'karaim',ang:0,poly:[[54.6490,24.9300],[54.6484,24.9420],[54.6380,24.9440],[54.6380,24.9300]]}],
  streets:[{n:'Karaimų g.',w:12,pts:[[54.6491,24.9338],[54.6440,24.9345],[54.6380,24.9360]]},{n:'Vytauto g.',w:12,pts:[[54.6440,24.9345],[54.6420,24.9420]]},{n:'Kelias į Vilnių',w:14,pts:[[54.6380,24.9360],[54.6380,24.9480]]}],
  bridges:[{n:'Salos tiltas',white:1,w:6,pts:[[54.6493,24.9337],[54.6513,24.9336]]}],
  landmarks:[{k:'castle',name:'Trakų salos pilis',at:[54.6522,24.9336],w:12,h:8,ht:70,desc:'Trakai Island Castle, finished by Vytautas the Great in the early 1400s.'},{k:'castle',name:'Pusiasalio pilis',at:[54.6455,24.9370],w:8,h:5,ht:30,desc:'Ruins of the Peninsula Castle.'}],
  pois:[{kind:'cafe',name:'Kibininė „Karaimai“',at:[54.6470,24.9345]},{kind:'bus',name:'Trakų autobusų stotis',at:[54.6395,24.9365]},{kind:'train',name:'Trakų geležinkelio stotis',at:[54.6388,24.9400]},{kind:'shop',name:'Maksi Trakai',at:[54.6420,24.9340]}]},
 kryziu:{bbox:[56.0185,23.4090,56.0125,23.4230],base:T.FIELD,defType:'field',
  parks:[{name:'Kryžių kalnas',poly:[[56.0162,23.4148],[56.0162,23.4182],[56.0143,23.4182],[56.0143,23.4148]]}],
  lots:[{poly:[[56.0140,23.4110],[56.0140,23.4140],[56.0130,23.4140],[56.0130,23.4110]]}],
  streets:[{n:'Kryžių kalno kelias',w:12,pts:[[56.0185,23.4100],[56.0150,23.4105],[56.0135,23.4110],[56.0125,23.4112]]},{n:'Takas',w:6,ped:1,pts:[[56.0135,23.4125],[56.0150,23.4150]]}],
  landmarks:[{k:'crosses',name:'Kryžių kalnas',at:[56.0153,23.4165],w:12,h:9,ht:30,desc:'The Hill of Crosses: more than 100,000 crosses left by pilgrims. Destroyed by the Soviets three times, rebuilt every time.'},{k:'church',name:'Pranciškonų vienuolynas',at:[56.0170,23.4210],w:7,h:5,ht:60,desc:'The Franciscan hermitage built after Pope John Paul II visited in 1993.'}],
  pois:[{kind:'kiosk',name:'Suvenyrų kioskas',at:[56.0133,23.4125]},{kind:'bus',name:'Autobusų stotelė',at:[56.0138,23.4105]}]},
 pasienis:{bbox:[54.1040,24.6900,54.0920,24.7120],base:T.FOREST,defType:'field',
  abroad:[{poly:[[54.1045,24.7080],[54.1045,24.7125],[54.0915,24.7125],[54.0915,24.7070]]}],
  fields:[{poly:[[54.1000,24.6960],[54.1000,24.7010],[54.0975,24.7010],[54.0975,24.6960]]}],
  lots:[{poly:[[54.0995,24.6965],[54.0995,24.6985],[54.0985,24.6985],[54.0985,24.6965]]}],
  streets:[{n:'Miško keliukas',w:8,pts:[[54.0920,24.6905],[54.0960,24.6950],[54.0990,24.6975],[54.1020,24.7030],[54.1035,24.7060]]},{n:'Pasieniečių kelias',w:6,pts:[[54.1040,24.7065],[54.0920,24.7060]]}],
  landmarks:[{k:'barn',name:'Senoji ferma',at:[54.0991,24.6975],w:8,h:5,ht:34,fac:'#7A5A3C',roof:'#4E463F',hq:'pasienio',desc:'An old farm in the forest near the border. Not many cows here any more.'},{k:'ptower',name:'Pasieniečių bokštas',at:[54.0990,24.7064],w:3,h:3,ht:120,desc:'Border guard watchtower. Somebody is always watching.'}]},
 autoturgus:{bbox:[54.5660,23.3400,54.5600,23.3520],base:T.GRASS,defType:'field',
  lots:[{poly:[[54.5650,23.3420],[54.5650,23.3505],[54.5610,23.3505],[54.5610,23.3420]]}],
  streets:[{n:'Kelias į Marijampolę',w:16,pts:[[54.5660,23.3410],[54.5600,23.3412]]},{n:'Turgaus gatvė',w:10,pts:[[54.5630,23.3412],[54.5630,23.3510]]}],
  pois:[{kind:'carmarket',name:'Autoturgaus administracija',at:[54.5648,23.3425]},{kind:'kebab',name:'Šašlykinė „Pas Armeną“',at:[54.5615,23.3430]},{kind:'bus',name:'Autobusų stotelė',at:[54.5655,23.3415]}]},
};

/* ---------- highway (road trip) map ---------- */
const ROAD_NAMES={'vilnius-kaunas':'A1','kaunas-klaipeda':'A1','vilnius-panevezys':'A2','kaunas-panevezys':'A8','panevezys-siauliai':'A9','kaunas-siauliai':'A12','palanga-siauliai':'A11','klaipeda-palanga':'A13','alytus-kaunas':'KK130','alytus-vilnius':'A4','trakai-vilnius':'A1','kaunas-trakai':'A1','klaipeda-nida':'KK167'};
const ROAD_KEYS={};Object.entries(ROAD_NAMES).forEach(([k,v])=>{ROAD_KEYS[k.split('-').sort().join('-')]=v});
function roadName(a,b){return ROAD_KEYS[[a,b].sort().join('-')]||'Kelias'}
function genRoadMap(from,to){setupMap(720,64);SR=mulberry(hashStr(from+to));const name=roadName(from,to);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const f=fbm(x*.03,y*.05+hashStr(name)%100);TL[idx(x,y)]=f>.58?T.FOREST:f<.38?T.FIELD:T.GRASS}
  const cy=x=>32+Math.sin(x/70)*9+Math.sin(x/23)*2;const pts=[];for(let x=0;x<=W;x+=8)pts.push([x,cy(x)]);
  paintLine(pts,2.2,(x,y)=>{TL[idx(x,y)]=T.HWY;RES[idx(x,y)]=1});
  // a lake with a bridge, a petrol station halfway
  const lx=200+(hashStr(name)%200);for(let y=0;y<H;y++)for(let x=lx-10;x<lx+10;x++){if(Math.hypot((x-lx)/1.4,y-cy(lx)-((hashStr(to)%2)?12:-12))<7+vnoise(x*.3,y*.3)*2&&inb(x,y)&&TL[idx(x,y)]!==T.HWY)TL[idx(x,y)]=T.WATER}
  const fx=Math.round(W*.55),fy=Math.round(cy(fx)+7);stamp(fx-5,fy-2,11,7,T.LOT);paintLine([[fx,cy(fx)],[fx,fy]],1.2,(x,y)=>{if(TL[idx(x,y)]!==T.HWY)TL[idx(x,y)]=T.HWY});
  const b=addB({x:fx-2,y:fy+2,w:5,h:2,kind:'mall',ht:30,fac:'#E9EDE6',roof:'#B5332B',dt:'field'});const p={id:'fuel_'+name+'_'+from+to,kind:'fuel',name:'Degalinė „Kelias“ · '+name,city:null,b,x:fx*TS+16,y:(fy+4)*TS+14};b.poi=p;POIS.push(p);DECOR.push({k:'pumps',x:(fx-2)*TS,y:(fy+1)*TS});
  for(let k=0;k<14;k++){const x=sri(20,W-20);DECOR.push({k:'pothole',x:x*TS+sr(-20,20),y:cy(x)*TS+sr(-30,30)})}
  for(let k=0;k<60;k++){const x=sri(5,W-5),y=sri(2,H-3);if(TL[idx(x,y)]===T.GRASS||TL[idx(x,y)]===T.FIELD){if(sr()<.3)addB({x,y,w:3,h:2,kind:'house',ht:30,fac:spick(FAC.house),roof:spick(ROOF_HOUSE),dt:'field'});else addTree(x,y,'birch')}}
  const s=addStreet({name,pts,w:2.2,main:1,hwy:1});HWYS=[{name,pts}];
  DECOR.push({k:'sign',x:4*TS,y:(cy(4)-4)*TS,txt:cityName(from)},{k:'sign',x:(W-8)*TS,y:(cy(W-8)-4)*TS,txt:cityName(to)});
  for(let x=0;x<W;x++)CITYA[idx(x,0)]=0;return{name,cy}}
function cityName(id){const c=cityById(id);return c?c.name:LOCATIONS[id]?LOCATIONS[id].name:id}

/* ---------- load a map ---------- */
function loadMap(id,opt){opt=opt||{};initDistricts();
  ENT.peds=ENT.peds.filter(e=>e.kind==='crew'||e.kind==='dog');ENT.cars=[];ENT.pickups=[];ENT.fx=[];ENT.bubbles=[];
  const city=cityById(id);
  if(opt.road){MAP={id:'road',kind:'road',name:'',from:opt.from,to:opt.to,city:null};const r=genRoadMap(opt.from,opt.to);MAP.name=r.name+' · '+cityName(opt.from)+' → '+cityName(opt.to);MAP.cy=r.cy}
  else if(city){MAP={id,kind:'city',name:city.name,city:id};const D=CITYDATA[id];const pr=genFromData(D,id,city);city.cx=W/2;city.cy=H/2;city.R=Math.max(W,H)/2;placeCityPOIs(city,D,pr);MAP.pr=pr}
  else{const L=LOCATIONS[id],D=LOCDATA[id];MAP={id,kind:'loc',name:L.name,city:null};const pr=genFromData(D,id,null);MAP.pr=pr;
    (D.pois||[]).forEach(q=>{const[x,y]=pr.p(q.at);const b=freeBuildingT(null,null,2,[x,y])||buildAt(Math.round(x),Math.round(y));addPOI({id},q.kind,q.name,b,{})});
    if(id==='pasienis'){const f=POIS.find(p=>p.hq==='pasienio');if(f&&f.b)f.b.hqColor=FACTIONS.pasienio.color}}
  buildMinimap();if(typeof refreshOverlay==='function')refreshOverlay();
  if(MAP.kind==='city'){cityAtmosphere();placeChess()}
  return MAP}

/* ---------- minimap base ---------- */
const TCOL=['#86A85F','#3F6B3A','#3D6D8D','#4F87A8','#E5D5A6','#5A5E62','#B9BAB3','#7D7366','#6FA05A','#9C8F82','#8A8F94','#C8B868','#4A4E52','#62666A','#E2D3A2','#8EAF6C','#2A3036','#EDEDE6','#9B7650','#8A7E70'];
let MMC=null;
function buildMinimap(){MMC=document.createElement('canvas');MMC.width=W;MMC.height=H;const g=MMC.getContext('2d'),im=g.createImageData(W,H),d=im.data;
  const rgb=TCOL.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
  for(let i=0;i<W*H;i++){let t=TL[i];let c=rgb[t]||rgb[0];if(t===T.FIELD&&hash2(i%W>>2,(i/W|0)>>2)<.4)c=[150,175,90];if(t===T.HWY)c=[230,200,90];
    d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=255}
  g.putImageData(im,0,0);g.fillStyle='rgba(230,200,90,.9)';STREETS.forEach(s=>{if(!s.main||s.rail||s.ped)return;g.strokeStyle='rgba(240,214,120,.95)';g.lineWidth=Math.max(1.5,s.w*1.2);g.beginPath();s.pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke()})}
