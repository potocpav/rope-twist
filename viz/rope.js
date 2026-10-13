// Shared rope code for the figures: palette and theme handling, embedding, and frame math.
(function(){
// Theme: ?theme=light|dark, otherwise follow the reader's system preference.
const THEMES={
light:{css:{bg:'#ffffff',panel:'#f3f2ee',text:'#1f1e1c',muted:'#5f5e5a',line:'#d6d4cc',outline:'#444444',accent:'#b8501f'},
c:{cf:'#F1EFE8',cs:'#888780',rf:'#FAECE7',ro:'#D85A30',st:'#F0997B',sb:'#993C1D',mk:'#26215C'}},
dark:{css:{bg:'#1e1d1b',panel:'#2a2927',text:'#ecebe6',muted:'#a9a8a2',line:'#45443f',outline:'#444444',accent:'#e8875a'},
c:{cf:'#2C2C2A',cs:'#888780',rf:'#4A1B0C',ro:'#D85A30',st:'#993C1D',sb:'#F0997B',mk:'#CECBF6'}}};
const C={},themeListeners=[];
function applyTheme(name){const t=THEMES[name]||THEMES.light;Object.assign(C,t.c);for(const k in t.css)document.documentElement.style.setProperty('--'+k,t.css[k]);document.documentElement.style.colorScheme=name;themeListeners.forEach(f=>f());}
const qTheme=new URLSearchParams(location.search).get('theme'),mq=matchMedia('(prefers-color-scheme: dark)');
if(THEMES[qTheme])applyTheme(qTheme);else{applyTheme(mq.matches?'dark':'light');mq.addEventListener('change',e=>applyTheme(e.matches?'dark':'light'));}
// Host page may set the theme: postMessage({type:'rope-twist-theme',theme:'dark'}).
addEventListener('message',e=>{if(e.data&&e.data.type==='rope-twist-theme')applyTheme(e.data.theme);});
// When embedded, report content height so the host page can size the iframe.
if(parent!==window){document.documentElement.style.overflow='hidden';new ResizeObserver(()=>parent.postMessage({type:'rope-twist-height',h:Math.ceil(document.body.getBoundingClientRect().height)},'*')).observe(document.body);}

// Rope: radius rr (cm); braid of NS strands per direction.
const rr=0.5,NS=10;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>mul(a,1/Math.hypot(...a));

// Rotation-minimizing frame (double reflection, Wang et al. 2008) = zero-twist reference frame,
// plus arc length. P: centreline points, Tg: unit tangents, u0: initial normal.
function rmf(P,Tg,u0){const U=[u0];
for(let i=0;i<P.length-1;i++){const v1=sub(P[i+1],P[i]),c1=dot(v1,v1),r=U[i],t=Tg[i];
const rL=sub(r,mul(v1,2/c1*dot(v1,r))),tL=sub(t,mul(v1,2/c1*dot(v1,t))),v2=sub(Tg[i+1],tL),c2=dot(v2,v2);
U.push(c2<1e-12?rL:nrm(sub(rL,mul(v2,2/c2*dot(v2,rL)))));}
const S=[0];for(let i=1;i<P.length;i++)S.push(S[i-1]+Math.hypot(...sub(P[i],P[i-1])));
return{U,S,L:S[S.length-1]};}

// Rope wrapped around a bar of radius R0 along the z axis, at wrap angle al (rad, from the bar's
// cross-sectional plane), for the given number of turns. Centreline: straight lead-in, helix of
// radius R0+rr, straight lead-out (both tangent, long enough to leave the view). The helix starts
// and ends at angle π/2 (+y, the back of the bar in view()). Frame U: rotation-minimizing = zero-twist frame.
const NI=40;
function buildWrap(al,R0,turns){const R=R0+rr,NH=Math.max(60,Math.round(240*turns));
const ta=Math.tan(al),phi0=0.5*Math.PI,ph1=phi0+turns*2*Math.PI,Lz=R*(ph1-phi0)*ta,zo=-Lz/2,P=[],Tg=[],Hx=[];
const hp=f=>[R*Math.cos(f),R*Math.sin(f),R*(f-phi0)*ta+zo],ht=f=>nrm([-Math.sin(f),Math.cos(f),ta]);
const t0=ht(phi0),t1=ht(ph1),p0=hp(phi0),p1=hp(ph1),Lin=30,Lout=30;
for(let i=NI;i>0;i--){P.push(sub(p0,mul(t0,Lin*i/NI)));Tg.push(t0);Hx.push(null);}
for(let i=0;i<=NH;i++){const f=phi0+(ph1-phi0)*i/NH;P.push(hp(f));Tg.push(ht(f));Hx.push([Math.cos(f),Math.sin(f),0]);}
for(let i=1;i<=NI;i++){P.push(add(p1,mul(t1,Lout*i/NI)));Tg.push(t1);Hx.push(null);}
const{U,S,L}=rmf(P,Tg,[Math.cos(phi0),Math.sin(phi0),0]);
// tw: measured rate (rad/cm) at which the zero-twist frame turns relative to the bar's outward normal = helix torsion (signed).
let psi=0,prev=0;for(let i=NI+1;i<=NI+NH;i++){const h=Hx[i],u=U[i],b=cross(Tg[i],u),a=Math.atan2(dot(h,b),dot(h,u));let d=a-prev;d=Math.atan2(Math.sin(d),Math.cos(d));psi+=d;prev=a;}
return{P,Tg,U,S,L,tw:psi/(S[NI+NH]-S[NI]),R0};}
// Fixed orthographic side view of the wrap, as in the article's helix diagram: the bar runs
// horizontally (z to the right), and the viewer looks at it from -y. This is a mirror image, so the
// (right-handed) helix's front strand rises to the right like the diagram's; the physics is
// mirror-symmetric. Returns [screen x, screen y (up), depth toward viewer].
function view(p){return[p[2],p[0],-p[1]];}

window.Rope={THEMES,C,onTheme:f=>themeListeners.push(f),rr,NS,add,sub,mul,dot,cross,nrm,rmf,buildWrap,view};
})();
