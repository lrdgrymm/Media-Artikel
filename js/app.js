/**
 * RuangWarta - Main Application Logic
 * =====================================
 * UI interactions, page navigation, admin actions,
 * reading history, recommendations, and sharing.
 */
'use strict';

// ===== TOAST NOTIFICATION SYSTEM =====
function showToast(type,msg){
  const c=document.getElementById('toastContainer');
  const icons={success:'\u2713',error:'\u2715',info:'\u2139'};
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML='<span class="toast-icon">'+icons[type]+'</span>'+sanitize(msg);
  c.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3500);
}

// ===== CONFIRMATION MODAL =====
let _modalCb=null;
function openModal(title,desc,cb){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalDesc').textContent=desc;
  document.getElementById('confirmModal').classList.add('open');
  _modalCb=cb;
}
function closeModal(){document.getElementById('confirmModal').classList.remove('open');_modalCb=null;}
function confirmAction(){if(_modalCb)_modalCb();closeModal();}

// ===== PAGE NAVIGATION =====
function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('page-'+p);if(!el)return;
  el.classList.add('active');window.scrollTo(0,0);
  if(p==='admin'){
    if(!isLoggedIn()){showPage('login');return;}
    document.querySelectorAll('.admin-page').forEach(el=>el.classList.remove('active'));
    document.getElementById('admin-dashboard').classList.add('active');
    document.querySelectorAll('.admin-nav-item').forEach(el=>el.classList.remove('active'));
    document.querySelector('.admin-nav-item').classList.add('active');
  }
}

function toggleMobileNav(){
  const cats = document.getElementById('navCats');
  if(cats) {
    cats.classList.toggle('open');
  }
}

// ===== READING HISTORY & RECOMMENDATIONS =====
function recordReadHistory(cat){
  let h=JSON.parse(localStorage.getItem('ruangwarta_history')||'[]');
  h.push(cat);if(h.length>20)h.shift();
  localStorage.setItem('ruangwarta_history',JSON.stringify(h));
}
function getRecommendedCategory(){
  let h=JSON.parse(localStorage.getItem('ruangwarta_history')||'[]');
  if(!h.length)return null;
  const c={};let mx=h[0],mc=0;
  for(let cat of h){c[cat]=(c[cat]||0)+1;if(c[cat]>mc){mc=c[cat];mx=cat;}}
  return mx;
}
function updateRecommendations(){
  const rc=getRecommendedCategory(),s=document.getElementById('rekomendasi-section'),g=document.getElementById('rekomendasi-grid');
  if(!rc||!s||!g)return;
  const keys=Object.keys(articles).filter(k=>articles[k].cat===rc);
  const shown=keys.sort(()=>0.5-Math.random()).slice(0,3);
  if(shown.length>0){
    s.style.display='block';
    g.innerHTML=shown.map(k=>{const a=articles[k];
      return '<div class="article-card" onclick="showArticle(\''+sanitize(k)+'\')">'+
      '<div class="card-img"><div class="card-img-ph" style="background:linear-gradient(135deg,#d97706,#b45309);font-size:28px">\u2728</div></div>'+
      '<div class="card-cat">'+sanitize(a.cat)+'</div>'+
      '<div class="card-title">'+sanitize(a.title)+'</div>'+
      '<div class="card-excerpt">'+sanitize(a.lede)+'</div>'+
      '<div class="card-meta"><span>'+sanitize(a.author)+'</span><div class="card-dot"></div><span>'+sanitize(a.date)+'</span></div></div>';
    }).join('');
  }
}

// ===== ARTICLE VIEW =====
function showArticle(id){
  const a=articles[id];if(!a)return;
  document.getElementById('article-cat').textContent=a.cat;
  document.getElementById('article-breadcat').textContent=a.cat;
  document.getElementById('article-title').textContent=a.title;
  document.getElementById('article-lede').textContent=a.lede;
  document.getElementById('article-author').textContent=a.author;
  document.getElementById('article-avatar').textContent=a.av;
  document.getElementById('article-date').textContent=a.date;
  document.getElementById('article-read').textContent=a.read;
  recordReadHistory(a.cat);updateRecommendations();
  showPage('article');
}

// ===== CATEGORY VIEW (XSS-safe) =====
function showCat(name){
  document.getElementById('cat-name').textContent=name;
  document.getElementById('cat-desc').textContent=(catInfo[name]||{desc:'Artikel-artikel pilihan dalam kategori ini.'}).desc;
  const keys=Object.keys(articles).filter(k=>articles[k].cat===name||name==='Berita');
  const grid=document.getElementById('cat-articles');
  const emojis=['\uD83C\uDF3F','\uD83D\uDCF0','\uD83C\uDFAD','\uD83C\uDFD8\uFE0F','\uD83C\uDF93','\uD83C\uDF0A'];
  grid.innerHTML=keys.slice(0,6).map(k=>{const a=articles[k];
    return '<div class="article-card" onclick="showArticle(\''+sanitize(k)+'\')">'+
    '<div class="card-img"><div class="card-img-ph" style="background:linear-gradient(135deg,#1a1a2e,#2d4a3a)">'+emojis[Math.floor(Math.random()*6)]+'</div></div>'+
    '<div class="card-cat">'+sanitize(a.cat)+'</div>'+
    '<div class="card-title">'+sanitize(a.title)+'</div>'+
    '<div class="card-excerpt">'+sanitize(a.lede)+'</div>'+
    '<div class="card-meta"><span>'+sanitize(a.author)+'</span><div class="card-dot"></div><span>'+sanitize(a.date)+'</span></div></div>';
  }).join('');
  showPage('category');
  document.querySelectorAll('.nav-cat').forEach(el=>el.classList.toggle('active',el.textContent===name));
}

// ===== ADMIN NAVIGATION =====
function switchAdmin(panel){
  document.querySelectorAll('.admin-page').forEach(el=>el.classList.remove('active'));
  const t=document.getElementById('admin-'+panel);if(t)t.classList.add('active');
  document.querySelectorAll('.admin-nav-item').forEach(el=>el.classList.remove('active'));
  const map={dashboard:0,articles:1,'new-article':2,categories:3,access:4};
  const items=document.querySelectorAll('.admin-nav-item');
  if(map[panel]!==undefined&&items[map[panel]])items[map[panel]].classList.add('active');
}

// ===== SEARCH (XSS-safe) =====
function openSearch(){
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('searchInput').focus(),50);
}
function closeSearch(){document.getElementById('searchOverlay').classList.remove('open');}
function doSearch(q){
  const res=document.getElementById('searchResults');
  if(!q.trim()){res.innerHTML='';return;}
  const sq=q.toLowerCase();
  const m=Object.keys(articles).filter(k=>articles[k].title.toLowerCase().includes(sq)||articles[k].cat.toLowerCase().includes(sq));
  res.innerHTML=m.slice(0,5).map(k=>
    '<div class="search-result-item" onclick="closeSearch();showArticle(\''+sanitize(k)+'\')">'+
    '<div class="sr-cat">'+sanitize(articles[k].cat)+'</div>'+
    '<div class="sr-title">'+sanitize(articles[k].title)+'</div></div>'
  ).join('')||'<div style="padding:16px 0;color:var(--ink3);font-size:14px">Tidak ada hasil untuk "'+sanitize(q)+'"</div>';
}

// ===== EDITOR TOOLS =====
function updateSlug(v){
  document.getElementById('articleSlug').value=v.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
}
function aiGenerate(type){
  const r=document.getElementById('aiResult');
  r.style.display='block';r.textContent='\uD83E\uDD16 Memproses...';
  setTimeout(()=>{r.textContent=aiResponses[type][0];r.style.whiteSpace='pre-line';},800);
}

// ===== ADMIN ACTION HANDLERS =====
function adminPublish(btn){
  const row=btn.closest('tr');const title=row.querySelector('td:first-child span').textContent;
  openModal('Publish Artikel','Publish "'+title+'" sekarang?',()=>{
    const pill=row.querySelector('.status-pill');
    pill.className='status-pill published';pill.textContent='Terbit';
    btn.remove();showToast('success','Artikel "'+title+'" berhasil dipublikasikan!');
  });
}
function adminReview(btn){
  const row=btn.closest('tr');const title=row.querySelector('td:first-child span').textContent;
  const pill=row.querySelector('.status-pill');
  pill.className='status-pill review';pill.textContent='Review';
  btn.remove();showToast('success','Artikel "'+title+'" masuk tahap review.');
}
function adminArsip(btn){
  const row=btn.closest('tr');const title=row.querySelector('td:first-child span').textContent;
  openModal('Arsipkan Artikel','Arsipkan "'+title+'"? Artikel tidak akan tampil di publik.',()=>{
    const pill=row.querySelector('.status-pill');
    pill.className='status-pill draft';pill.textContent='Arsip';
    btn.textContent='Pulihkan';btn.onclick=function(){adminPulihkan(this);};
    showToast('success','Artikel "'+title+'" diarsipkan.');
  });
}
function adminPulihkan(btn){
  const row=btn.closest('tr');const title=row.querySelector('td:first-child span').textContent;
  const pill=row.querySelector('.status-pill');
  pill.className='status-pill published';pill.textContent='Terbit';
  btn.textContent='Arsip';btn.onclick=function(){adminArsip(this);};
  showToast('success','Artikel "'+title+'" dipulihkan.');
}
function adminHapus(btn){
  const row=btn.closest('tr');const title=row.querySelector('td:first-child span').textContent;
  openModal('Hapus Artikel','Hapus "'+title+'" secara permanen? Tindakan ini tidak bisa dibatalkan.',()=>{
    row.style.transition='opacity .3s';row.style.opacity='0';
    setTimeout(()=>row.remove(),300);
    showToast('success','Artikel "'+title+'" dihapus.');
  });
}
function adminHapusKategori(btn){
  const row=btn.closest('tr');const name=row.querySelector('strong').textContent;
  openModal('Hapus Kategori','Hapus kategori "'+name+'"? Artikel di dalamnya akan dipindah ke Umum.',()=>{
    row.style.transition='opacity .3s';row.style.opacity='0';
    setTimeout(()=>row.remove(),300);
    showToast('success','Kategori "'+name+'" dihapus.');
  });
}
function addCategory(){showToast('info','Form tambah kategori aktif. Fitur lengkap tersedia pada versi mendatang.');}
function saveDraft(){showToast('success','Draft berhasil disimpan.');}
function previewArticle(){
  const title=document.getElementById('articleTitle').value;
  if(!title){showToast('error','Judul artikel harus diisi sebelum preview.');return;}
  showToast('info','Preview artikel "'+title.substring(0,30)+'..." terbuka.');
}
function publishDone(){
  const title=document.getElementById('articleTitle').value;
  if(!title){showToast('error','Judul artikel harus diisi.');return;}
  openModal('Publish Artikel','Publish "'+title.substring(0,40)+'..."?',()=>{
    showToast('success','Artikel berhasil dipublikasikan!');switchAdmin('articles');
  });
}
function fakeUpload(){
  const p=document.getElementById('uploadPlaceholder');
  p.innerHTML='<div style="font-size:28px">\u2705</div><div style="font-size:12px;color:#1a7a3f;margin-top:4px;font-weight:600">foto-pesisir-air.jpg</div><div style="font-size:10px;color:var(--ink3)">2.4 MB \u00B7 Klik untuk ganti</div>';
}
function toggleReadMode(){document.body.classList.toggle('reading-mode');}

// ===== SHARE HANDLERS =====
function getShareUrl(){return 'https://ruangwarta.id/artikel/'+(document.getElementById('article-title').textContent||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').substring(0,60);}
function getShareTitle(){return document.getElementById('article-title').textContent||'Artikel RuangWarta';}
function shareWA(){window.open('https://wa.me/?text='+encodeURIComponent(getShareTitle()+' '+getShareUrl()),'_blank');showToast('success','Membuka WhatsApp...');}
function shareFB(){window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(getShareUrl()),'_blank','width=600,height=400');showToast('success','Membuka Facebook...');}
function shareTW(){window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(getShareTitle())+'&url='+encodeURIComponent(getShareUrl()),'_blank','width=600,height=400');showToast('success','Membuka X/Twitter...');}
function copyLink(){
  navigator.clipboard.writeText(getShareUrl()).then(()=>showToast('success','Tautan artikel disalin!')).catch(()=>showToast('error','Gagal menyalin tautan.'));
}

// ===== NEWSLETTER =====
function subscribeNL(){
  const e=document.getElementById('nlEmail');
  if(e.value&&e.value.includes('@')){showToast('success','Terima kasih! Kamu sudah berlangganan RuangWarta Newsletter.');e.value='';}
  else showToast('error','Masukkan alamat email yang valid.');
}

// ===== INIT =====
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();closeModal();}});
updateRecommendations();
if(isLoggedIn()){document.getElementById('navAdminBtn').textContent='Panel';}
