import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,collection,query,orderBy,limit,getDocs,addDoc,where,deleteDoc,runTransaction} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const C={
 havuc:{n:'Havuç',e:'🥕',g:30,s:5,p:9,l:1,x:2},
 marul:{n:'Marul',e:'🥬',g:45,s:8,p:14,l:1,x:3},
 sogan:{n:'Soğan',e:'🧅',g:60,s:10,p:18,l:2,x:4},
 cilek:{n:'Çilek',e:'🍓',g:90,s:15,p:28,l:3,x:6},
 domates:{n:'Domates',e:'🍅',g:120,s:20,p:38,l:4,x:8},
 misir:{n:'Mısır',e:'🌽',g:180,s:30,p:60,l:5,x:12},
 balkabagi:{n:'Balkabağı',e:'🎃',g:300,s:50,p:100,l:7,x:20}
};
let S,uid,pend,tool='water',moles={},nextEv=0,dirty=false;
const $=i=>document.getElementById(i);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lvl=()=>Math.floor(Math.sqrt(S.xp/10))+1;
const unl=()=>Object.keys(C).filter(k=>C[k].l<=lvl());
const npc=k=>Math.round(C[k].p*.8)*(S.inv[k]||0);
const save=()=>{dirty=true};
const say=(t,e)=>{const m=$('msg');m.textContent=t;m.className='msg'+(e?' err':'')};
const newUser=n=>({name:n||'Bahçıvan',coins:50,xp:0,inv:{},plots:Array(8).fill(null),gnome:false});

/* ---------- Giriş / kayıt ---------- */
const errs={'auth/invalid-credential':'E-posta veya şifre hatalı.','auth/email-already-in-use':'Bu e-posta zaten kayıtlı.','auth/weak-password':'Şifre en az 6 karakter olmalı.','auth/invalid-email':'Geçersiz e-posta.','auth/missing-password':'Şifre gir.'};
const aerr=e=>{$('aerr').textContent=errs[e.code]||('Hata: '+e.code)};
$('login').onclick=()=>signInWithEmailAndPassword(auth,$('em').value,$('pw').value).catch(aerr);
$('reg').onclick=()=>{
 const n=$('nm').value.trim();
 if(n.length<3||n.length>16){$('aerr').textContent='Takma ad 3-16 karakter olmalı.';return}
 pend=n;createUserWithEmailAndPassword(auth,$('em').value,$('pw').value).catch(aerr);
};
onAuthStateChanged(auth,async u=>{
 $('auth').hidden=!!u;$('app').hidden=!u;
 if(!u){uid=null;S=null;return}
 uid=u.uid;const r=doc(db,'users',uid);let s=await getDoc(r);
 if(!s.exists()){await setDoc(r,newUser(pend));s=await getDoc(r)}
 S=s.data();nextEv=Date.now()+20000;
 await collect();draw();show('garden');
});

/* ---------- Bahçe ---------- */
function click(i){
 const p=S.plots[i];
 if(moles[i]){delete moles[i];S.coins+=2;say('Köstebeği yakaladın! +2 🪙')}
 else if(p&&p.w){S.plots[i]=null;S.coins+=1;say('Yabani ot temizlendi. +1 🪙')}
 else if(p&&p.c){
  const c=C[p.c];
  if(p.at&&Date.now()-p.at>=c.g*1000){
   const b=lvl();S.inv[p.c]=(S.inv[p.c]||0)+2;S.xp+=c.x;S.plots[i]=null;
   say('2 '+c.n+' topladın! +'+c.x+' XP');if(lvl()>b)say('Seviye '+lvl()+'! Yeni bitkiler açıldı.');
  }else if(!p.at){if(tool==='water'){p.at=Date.now();say('Sulandı, büyüyor.')}else say('Önce sulama aletini seç.',1)}
  else say('Henüz olgunlaşmadı.',1);
 }else if(!p){
  if(tool==='water')say('Boş tarla. Bir tohum seç.',1);
  else{const c=C[tool];if(S.coins>=c.s){S.coins-=c.s;S.plots[i]={c:tool,at:null};say(c.n+' ekildi. Şimdi sula.')}else say('Yetersiz altın.',1)}
 }
 save();draw();
}
function drawGrid(){
 const now=Date.now();
 $('grid').innerHTML=S.plots.map((p,i)=>{
  let h='',cls='p',lab='Boş tarla';
  if(moles[i]){cls+=' mole';h='🕳️';lab='Köstebek'}
  else if(p&&p.w){h='🌿';lab='Yabani ot'}
  else if(p){
   const c=C[p.c],pr=p.at?Math.min(1,(now-p.at)/(c.g*1000)):0;
   if(pr>=1){h=c.e;cls+=' ready';lab=c.n+' hazır'}
   else{lab=c.n+' büyüyor';h=(!p.at?'🌰':pr<.5?'🌱':'🪴')+'<span class="b"><i style="width:'+pr*100+'%"></i></span>'+(!p.at?'<span class="d">💧</span>':'')}
  }
  return '<button class="'+cls+'" data-i="'+i+'" aria-label="'+lab+'">'+h+'</button>';
 }).join('');
}
function drawBar(){
 const l=lvl(),lo=(l-1)**2*10,hi=l*l*10;
 $('bar').innerHTML='<span>👤 '+esc(S.name)+'</span><span>🪙 '+S.coins+'</span><span>⭐ Seviye '+l+'</span><span class="mut">'+S.xp+' / '+hi+' XP</span><button class="btn" data-out="1">Çıkış</button><div class="xp"><i style="width:'+Math.min(100,(S.xp-lo)/(hi-lo)*100)+'%"></i></div>';
}
function drawPanels(){
 $('tools').innerHTML='<button class="t" data-tool="water" aria-pressed="'+(tool==='water')+'">💧 Sula</button>'+unl().map(k=>'<button class="t" data-tool="'+k+'" aria-pressed="'+(tool===k)+'">'+C[k].e+' '+C[k].n+' ('+C[k].s+')</button>').join('');
 const pc=S.plots.length*50-200;
 $('shop').innerHTML='<div class="row"><span>🟫 Yeni tarlalar (+4) <span class="mut">'+S.plots.length+'/20</span></span><button class="btn" data-buy="plot"'+(S.plots.length>=20||S.coins<pc?' disabled':'')+'>'+(S.plots.length>=20?'En fazla':pc+' 🪙')+'</button></div>'+
  '<div class="row"><span>🧙 Sulama cücesi <span class="mut">(Seviye 3)</span></span><button class="btn" data-buy="gnome"'+(S.gnome||lvl()<3||S.coins<300?' disabled':'')+'>'+(S.gnome?'Satın alındı':'300 🪙')+'</button></div>';
}
function draw(){drawBar();drawGrid();drawPanels()}

/* ---------- Pazar ---------- */
async function collect(){
 const qs=await getDocs(query(collection(db,'listings'),where('seller','==',uid),where('sold','==',true)));
 for(const d of qs.docs){const x=d.data();S.coins+=x.price*x.qty;await deleteDoc(d.ref);say(x.qty+' '+(C[x.crop]?.n||'ürün')+' satıldı! +'+x.price*x.qty+' 🪙')}
 if(!qs.empty){save();draw()}
}
async function drawMarket(){
 const inv=Object.keys(S.inv).filter(k=>S.inv[k]>0&&C[k]);
 $('mk-inv').innerHTML='<h2>Deponun</h2>'+(inv.map(k=>'<div class="row"><span>'+C[k].e+' '+C[k].n+' × '+S.inv[k]+'</span><span class="f"><input id="q-'+k+'" type="number" min="1" max="'+S.inv[k]+'" value="'+S.inv[k]+'" aria-label="Adet"><input id="p-'+k+'" type="number" min="1" value="'+C[k].p+'" aria-label="Birim fiyat"><button class="btn" data-list="'+k+'">Pazara koy</button><button class="btn" data-npc="'+k+'">Tüccara '+npc(k)+' 🪙</button></span></div>').join('')||'<p class="mut">Deponda ürün yok. Hasat edince burada görünür.</p>');
 $('mk-list').innerHTML='<p class="mut">Yükleniyor…</p>';
 const qs=await getDocs(query(collection(db,'listings'),where('sold','==',false),limit(30)));
 const ls=qs.docs.map(d=>({id:d.id,...d.data()})).filter(d=>C[d.crop]).sort((a,b)=>b.createdAt-a.createdAt);
 $('mk-list').innerHTML=ls.map(d=>'<div class="row"><span>'+C[d.crop].e+' '+d.qty+' × '+d.price+' 🪙 <span class="mut">'+esc(d.name)+'</span></span>'+(d.seller===uid?'<button class="btn" data-cancel="'+d.id+'">İptal</button>':'<button class="btn" data-buyl="'+d.id+'"'+(S.coins<d.price*d.qty?' disabled':'')+'>Al ('+d.price*d.qty+' 🪙)</button>')+'</div>').join('')||'<p class="mut">Şu an ilan yok. İlk ilanı sen ver.</p>';
}
async function drawTop(){
 $('tp').innerHTML='<p class="mut">Yükleniyor…</p>';
 const qs=await getDocs(query(collection(db,'users'),orderBy('xp','desc'),limit(10)));
 $('tp').innerHTML=qs.docs.map((d,i)=>{const x=d.data();return '<div class="row"><span>'+(i+1)+'. '+esc(x.name)+'</span><span class="mut">Seviye '+(Math.floor(Math.sqrt(x.xp/10))+1)+' · '+x.xp+' XP</span></div>'}).join('');
}
function show(v){
 ['garden','market','top'].forEach(k=>{$('v-'+k).hidden=k!==v});
 document.querySelectorAll('#tabs .t').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));
 if(v==='market')drawMarket();if(v==='top')drawTop();
}

/* ---------- Olaylar ---------- */
document.addEventListener('click',async e=>{
 const t=e.target.closest('button');if(!t||!S)return;const d=t.dataset;
 try{
  if(d.i!==undefined)return click(+d.i);
  if(d.v)return show(d.v);
  if(d.out)return signOut(auth);
  if(d.tool)tool=d.tool;
  else if(d.buy==='plot'){const pc=S.plots.length*50-200;if(S.coins>=pc&&S.plots.length<20){S.coins-=pc;S.plots.push(null,null,null,null);say('Yeni tarlalar açıldı.')}}
  else if(d.buy==='gnome'&&S.coins>=300&&!S.gnome){S.coins-=300;S.gnome=true;say('Sulama cücesi işe başladı.')}
  else if(d.npc){const k=d.npc,g=npc(k);S.coins+=g;S.inv[k]=0;say('Tüccara satıldı. +'+g+' 🪙');save();draw();return drawMarket()}
  else if(d.list){
   const k=d.list,q=Math.floor(+$('q-'+k).value),p=Math.floor(+$('p-'+k).value);
   if(!(q>=1&&q<=S.inv[k]&&p>=1&&p<=9999))return say('Adet ve fiyat geçersiz.',1);
   await addDoc(collection(db,'listings'),{seller:uid,name:S.name,crop:k,qty:q,price:p,sold:false,createdAt:Date.now()});
   S.inv[k]-=q;say('İlan verildi.');save();draw();return drawMarket();
  }
  else if(d.buyl){
   const ref=doc(db,'listings',d.buyl);
   const x=await runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists()||s.data().sold)throw new Error('gone');tx.update(ref,{sold:true,buyer:uid});return s.data()});
   if(!C[x.crop]||S.coins<x.price*x.qty)return say('Satın alma başarısız.',1);
   S.coins-=x.price*x.qty;S.inv[x.crop]=(S.inv[x.crop]||0)+x.qty;say(x.qty+' '+C[x.crop].n+' satın aldın.');save();draw();return drawMarket();
  }
  else if(d.cancel){
   const ref=doc(db,'listings',d.cancel);
   const x=await runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists()||s.data().sold)throw new Error('gone');tx.delete(ref);return s.data()});
   S.inv[x.crop]=(S.inv[x.crop]||0)+x.qty;say('İlan iptal edildi.');save();draw();return drawMarket();
  }
  save();draw();
 }catch(err){say('İşlem tamamlanamadı. İlan satılmış ya da bağlantı kopmuş olabilir.',1);if(!$('v-market').hidden)drawMarket()}
});

/* ---------- Döngü ---------- */
setInterval(()=>{
 if(!S)return;const now=Date.now();
 for(const k in moles)if(now>moles[k]){delete moles[k];if(S.plots[k]?.c){S.plots[k]=null;say('Bir köstebek mahsulünü yedi!',1);save()}}
 if(S.gnome)S.plots.forEach(p=>{if(p?.c&&!p.at){p.at=now;save()}});
 if(now>nextEv){
  nextEv=now+20000+Math.random()*15000;
  const empty=[],pl=[];S.plots.forEach((p,i)=>{if(!p)empty.push(i);else if(p.c&&!moles[i])pl.push(i)});
  if(Math.random()<.5&&empty.length)S.plots[empty[Math.floor(Math.random()*empty.length)]]={w:1};
  else if(pl.length){moles[pl[Math.floor(Math.random()*pl.length)]]=now+15000;say('Bir köstebek geldi! Hemen tıkla.',1)}
  save();
 }
 drawGrid();
},500);
setInterval(()=>{if(S&&dirty){dirty=false;setDoc(doc(db,'users',uid),S).catch(()=>{dirty=true})}},4000);
setInterval(()=>{if(S)collect().catch(()=>{})},30000);
document.addEventListener('visibilitychange',()=>{if(S&&dirty&&document.hidden){dirty=false;setDoc(doc(db,'users',uid),S)}});
