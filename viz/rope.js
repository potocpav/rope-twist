// Shared rope rendering for all figures: palette and theme handling, embedding,
// frame math, and the line-style drawing of the braided rope with its marker.
(function(){
// Theme: ?theme=light|dark, otherwise follow the reader's system preference.
const THEMES={
light:{css:{bg:'#ffffff',panel:'#f3f2ee',text:'#1f1e1c',muted:'#5f5e5a',line:'#d6d4cc',accent:'#b8501f'},
c:{cf:'#F1EFE8',cs:'#888780',rf:'#FAECE7',ro:'#D85A30',st:'#F0997B',sb:'#993C1D',mk:'#26215C'}},
dark:{css:{bg:'#1e1d1b',panel:'#2a2927',text:'#ecebe6',muted:'#a9a8a2',line:'#45443f',accent:'#e8875a'},
c:{cf:'#2C2C2A',cs:'#888780',rf:'#4A1B0C',ro:'#D85A30',st:'#993C1D',sb:'#F0997B',mk:'#CECBF6'}}};
const C={},themeListeners=[];
function applyTheme(name){const t=THEMES[name]||THEMES.light;Object.assign(C,t.c);for(const k in t.css)document.documentElement.style.setProperty('--'+k,t.css[k]);document.documentElement.style.colorScheme=name;themeListeners.forEach(f=>f());}
const qTheme=new URLSearchParams(location.search).get('theme'),mq=matchMedia('(prefers-color-scheme: dark)');
if(THEMES[qTheme])applyTheme(qTheme);else{applyTheme(mq.matches?'dark':'light');mq.addEventListener('change',e=>applyTheme(e.matches?'dark':'light'));}
// Host page may set the theme: postMessage({type:'rope-twist-theme',theme:'dark'}).
addEventListener('message',e=>{if(e.data&&e.data.type==='rope-twist-theme')applyTheme(e.data.theme);});
// When embedded, report content height so the host page can size the iframe.
if(parent!==window){document.documentElement.style.overflow='hidden';new ResizeObserver(()=>parent.postMessage({type:'rope-twist-height',h:Math.ceil(document.body.getBoundingClientRect().height)},'*')).observe(document.body);}

// Rope: radius rr (cm); braid of NS strands per direction, row spacing D (cm), every HL-th strand bold.
const rr=0.5,NS=10,D=0.5,HL=5,STEP=2*Math.PI/NS;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>mul(a,1/Math.hypot(...a)),lerp=(a,b,f)=>add(a,mul(sub(b,a),f));
const mod=(a,n)=>((a%n)+n)%n;

// Rotation-minimizing frame (double reflection, Wang et al. 2008) = zero-twist reference frame,
// plus arc length. P: centreline points, Tg: unit tangents, u0: initial normal.
function rmf(P,Tg,u0){const U=[u0];
for(let i=0;i<P.length-1;i++){const v1=sub(P[i+1],P[i]),c1=dot(v1,v1),r=U[i],t=Tg[i];
const rL=sub(r,mul(v1,2/c1*dot(v1,r))),tL=sub(t,mul(v1,2/c1*dot(v1,t))),v2=sub(Tg[i+1],tL),c2=dot(v2,v2);
U.push(c2<1e-12?rL:nrm(sub(rL,mul(v2,2/c2*dot(v2,rL)))));}
const S=[0];for(let i=1;i<P.length;i++)S.push(S[i-1]+Math.hypot(...sub(P[i],P[i-1])));
return{U,S,L:S[S.length-1]};}
function at(m,s){const S=m.S;let lo=0,hi=S.length-1;while(hi-lo>1){const md=(lo+hi)>>1;if(S[md]<=s)lo=md;else hi=md;}
const f=(s-S[lo])/(S[hi]-S[lo]||1),t=nrm(lerp(m.Tg[lo],m.Tg[hi],f));let u=lerp(m.U[lo],m.U[hi],f);u=nrm(sub(u,mul(t,dot(u,t))));return{p:lerp(m.P[lo],m.P[hi],f),t,u,i:lo};}

// Draw one depth layer of rope m = {P,Tg,U,S,L}: body of each run [i0,i1], then braid, then marker.
// o: S project to screen px, vw view direction (toward viewer, world coords), s px per cm,
// spin rope rotation (rad), kap twist strain (rad/cm), pulled braid offset (cm),
// back[i] whether point i belongs to the back layer, isBack which layer this is.
function drawLayer(ctx,m,runs,o){const{S,vw,s,spin,kap,pulled,back,isBack}=o;
const offp=(i,th,k)=>{const u=m.U[i],b=cross(m.Tg[i],u),n=add(mul(u,Math.cos(th)),mul(b,Math.sin(th)));return[add(m.P[i],mul(n,rr*k)),n];};
const seg=(a,b,col,w,dash,al)=>{ctx.globalAlpha=al;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.globalAlpha=1;ctx.setLineDash([]);};
function marker(i0,i1){let prev=null,pv=null;for(let i=i0;i<=i1;i++){const[p,n]=offp(i,spin+kap*m.S[i],0.9),q=S(p),vis=dot(n,vw)>0.02;
if(prev){if(vis&&pv)seg(prev,q,C.mk,2.6,[],1);else seg(prev,q,C.mk,1,[2,4],0.35);}prev=q;pv=vis;}}
function body(r){const[i0,i1]=r;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();for(let i=i0;i<=i1;i++){const q=S(m.P[i]);i===i0?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1]);}
ctx.strokeStyle=C.ro;ctx.lineWidth=2*rr*s+2;ctx.stroke();ctx.strokeStyle=C.rf;ctx.lineWidth=Math.max(1,2*rr*s-1.5);ctx.stroke();}
function braid(boldPass){ctx.lineCap='round';
const n0=Math.floor(-pulled/D)-1,n1=Math.ceil((m.L-pulled)/D);
for(let n=n0;n<=n1;n++){const s0=pulled+n*D;
for(let k=0;k<NS;k++){const th0=k*STEP+STEP/2+spin;for(const dir of[1,-1]){
const carrier=dir>0?mod(k-n,NS):mod(k+n,NS),bold=carrier%HL===0;if(bold!==boldPass)continue;
const col=bold?C.sb:C.st,w=bold?2.2:1;let prev=null,pv=false;
for(let j=0;j<=5;j++){const ss=s0+D*j/5;if(ss<0||ss>m.L){prev=null;continue;}
const f=at(m,ss);if(back[f.i]!==isBack){prev=null;continue;}
const th=th0+dir*STEP*j/5+kap*ss,b=cross(f.t,f.u),nn=add(mul(f.u,Math.cos(th)),mul(b,Math.sin(th))),q=S(add(f.p,mul(nn,rr*0.9))),vis=dot(nn,vw)>0.05;
if(prev&&vis&&pv)seg(prev,q,col,w,[],1);prev=q;pv=vis;}}}}}
runs.forEach(body);braid(false);braid(true);runs.forEach(r=>marker(r[0],r[1]));}

// Rope wrapped around a bar of radius R0 along the z axis, at wrap angle al (rad, from the bar's
// cross-sectional plane), for the given number of turns. Centreline: straight lead-in, helix of
// radius R0+rr, straight lead-out (both tangent). Frame U: rotation-minimizing = zero-twist frame.
const NI=40;
function buildWrap(al,R0,turns){const R=R0+rr,NH=Math.max(60,Math.round(240*turns));
const ta=Math.tan(al),phi0=0.55*Math.PI,ph1=phi0+turns*2*Math.PI,Lz=R*(ph1-phi0)*ta,zo=-Lz/2,P=[],Tg=[],Hx=[];
const hp=f=>[R*Math.cos(f),R*Math.sin(f),R*(f-phi0)*ta+zo],ht=f=>nrm([-Math.sin(f),Math.cos(f),ta]);
const t0=ht(phi0),t1=ht(ph1),p0=hp(phi0),p1=hp(ph1),Lin=4,Lout=4.5;
for(let i=NI;i>0;i--){P.push(sub(p0,mul(t0,Lin*i/NI)));Tg.push(t0);Hx.push(null);}
for(let i=0;i<=NH;i++){const f=phi0+(ph1-phi0)*i/NH;P.push(hp(f));Tg.push(ht(f));Hx.push([Math.cos(f),Math.sin(f),0]);}
for(let i=1;i<=NI;i++){P.push(add(p1,mul(t1,Lout*i/NI)));Tg.push(t1);Hx.push(null);}
const{U,S,L}=rmf(P,Tg,[Math.cos(phi0),Math.sin(phi0),0]);
// tw: measured rate (rad/cm) at which the zero-twist frame turns relative to the bar's outward normal = helix torsion (signed).
let psi=0,prev=0;for(let i=NI+1;i<=NI+NH;i++){const h=Hx[i],u=U[i],b=cross(Tg[i],u),a=Math.atan2(dot(h,b),dot(h,u));let d=a-prev;d=Math.atan2(Math.sin(d),Math.cos(d));psi+=d;prev=a;}
return{P,Tg,U,S,L,tw:psi/(S[NI+NH]-S[NI]),R0};}
// Fixed orthographic view of the wrap: spin about the bar axis, tilt toward the viewer, then a
// screen rotation so the bar runs diagonally. Returns [screen x, screen y (up), depth toward viewer].
const DEG=Math.PI/180,sp=90*DEG,tb=0.3,g=55*DEG;
function view(p){const c=Math.cos(sp),s=Math.sin(sp);let x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c,z=p[2];
let X=x,Y=z,Z=-y;const cb=Math.cos(tb),sb=Math.sin(tb);const Y2=Y*cb-Z*sb,Z2=Y*sb+Z*cb;
const cg=Math.cos(g),sg=Math.sin(g);return[X*cg-Y2*sg,X*sg+Y2*cg,Z2];}

window.Rope={THEMES,C,onTheme:f=>themeListeners.push(f),rr,NS,D,HL,add,sub,mul,dot,cross,nrm,lerp,rmf,at,drawLayer,buildWrap,view};
})();
