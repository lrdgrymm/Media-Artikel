/**
 * RuangWarta - Main App Logic (Supabase CRUD)
 */
'use strict';

// ===== TOAST =====
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

// ===== MODAL =====
let _modalCb=null;
function openModal(title,desc,cb){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalDesc').textContent=desc;
  document.getElementById('confirmModal').classList.add('open');
  _modalCb=cb;
}
function closeModal(){document.getElementById('confirmModal').classList.remove('open');_modalCb=null;}
function confirmAction(){if(_modalCb)_modalCb();closeModal();}

// ===== PAGE NAV =====
function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('page-'+p);if(!el)return;
  el.classList.add('active');window.scrollTo(0,0);
  if(p==='admin'){
    if(!isLoggedIn()){showPage('login');return;}
  }
}
function toggleMobileNav(){
  const c=document.getElementById('navCats');
  if(c)c.classList.toggle('open');
}

// ===== RENDER HELPERS =====
const gradients=['#1b4332,#40916c','#312e81,#4c1d95','#7c2d12,#c2410c','#1e3a5f,#2d6a9f','#065f46,#047857','#4a1942,#7b2d72','#0d1b2a,#1a4a6e','#1a1a2e,#2d4a3a'];
const emojis=['🌿','📰','🎭','🤝','🏛️','🎓','🌾','🏘️'];
function randGrad(){return gradients[Math.floor(Math.random()*gradients.length)];}
function randEmoji(){return emojis[Math.floor(Math.random()*emojis.length)];}

function renderCardHTML(id, a){
  const imgContent = a.image ? '<img src="'+sanitize(a.image)+'" style="width:100%;height:100%;object-fit:cover">' : '<div class="card-img-ph" style="background:linear-gradient(135deg,'+randGrad()+')">'+randEmoji()+'</div>';
  return '<div class="article-card" onclick="showArticle(\''+id+'\')">'+
    '<div class="card-img">'+imgContent+'</div>'+
    '<div class="card-cat">'+sanitize(a.cat)+'</div>'+
    '<div class="card-title">'+sanitize(a.title)+'</div>'+
    '<div class="card-excerpt">'+sanitize(a.lede)+'</div>'+
    '<div class="card-meta"><span>'+sanitize(a.author)+'</span><div class="card-dot"></div><span>'+sanitize(a.date)+'</span></div></div>';
}

// ===== HOMEPAGE RENDERING =====
function renderHomepage(){
  const items = Object.entries(articles).filter(([,a])=>a.status==='published');
  items.sort((a,b)=>new Date(b[1].published_at||0)-new Date(a[1].published_at||0));

  // Hero
  const featured = items.find(([,a])=>a.is_featured) || items[0];
  const heroEl = document.getElementById('heroContainer');
  if(heroEl && featured){
    const [fid,fa] = featured;
    const sideItems = items.filter(x=>x[0]!==fid).slice(0,3);
    const heroImg = fa.image ? '<img src="'+sanitize(fa.image)+'" style="width:100%;height:100%;object-fit:cover;opacity:0.6">' : '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0d1b2a,#1b4332,#0d1b2a);display:flex;align-items:center;justify-content:center"><svg width="120" height="80" viewBox="0 0 120 80" fill="none" opacity="0.15"><rect x="10" y="20" width="100" height="6" rx="3" fill="white"/><rect x="10" y="34" width="80" height="4" rx="2" fill="white"/><rect x="10" y="46" width="90" height="4" rx="2" fill="white"/></svg></div>';
    heroEl.innerHTML =
      '<div class="hero-main" onclick="showArticle(\''+fid+'\')">'+
        '<div class="hero-img-placeholder">'+heroImg+'</div>'+
        '<div class="hero-img-text"><div class="hero-cat-badge">'+sanitize(fa.cat)+'</div>'+
        '<div class="hero-title">'+sanitize(fa.title)+'</div>'+
        '<div class="hero-meta"><span>'+sanitize(fa.author)+'</span><span>'+sanitize(fa.date)+'</span><span>'+sanitize(fa.read)+'</span></div></div></div>'+
      '<div class="hero-sidebar">'+sideItems.map(([sid,sa])=>
        '<div class="hero-side-item" onclick="showArticle(\''+sid+'\')"><div><div class="side-cat">'+sanitize(sa.cat)+'</div><div class="side-title">'+sanitize(sa.title)+'</div></div><div class="side-meta">'+sanitize(sa.author)+' · '+sanitize(sa.date)+'</div></div>'
      ).join('')+'</div>';
  }

  // Terbaru
  const latestEl = document.getElementById('latestGrid');
  if(latestEl){
    const latest = items.slice(0,3);
    latestEl.innerHTML = latest.map(([id,a])=>renderCardHTML(id,a)).join('');
  }

  // Opini
  const opiniEl = document.getElementById('opiniList');
  if(opiniEl){
    const opini = items.filter(([,a])=>a.cat==='Opini'||a.cat==='Esai').slice(0,4);
    opiniEl.innerHTML = opini.map(([id,a],i)=>
      '<div class="opinion-item" onclick="showArticle(\''+id+'\')"><div class="opinion-num">'+(String(i+1).padStart(2,'0'))+'</div><div><div class="opinion-cat">'+sanitize(a.cat)+'</div><div class="opinion-title">'+sanitize(a.title)+'</div><div class="opinion-author">oleh '+sanitize(a.author)+'</div></div></div>'
    ).join('');
  }

  // Populer
  const popEl = document.getElementById('populerList');
  if(popEl){
    const popular = [...items].sort((a,b)=>(b[1].views||0)-(a[1].views||0)).slice(0,5);
    popEl.innerHTML = popular.map(([id,a],i)=>
      '<div class="pop-item" onclick="showArticle(\''+id+'\')"><div class="pop-num">'+(i+1)+'</div><div class="pop-title">'+sanitize(a.title.substring(0,55))+'</div></div>'
    ).join('');
  }

  // Kategori strip
  const catEl = document.getElementById('catStrip');
  if(catEl){
    const catIcons = {'Berita':'📰','Budaya':'🎭','Komunitas':'🤝','Lingkungan':'🌿','Pendidikan':'🎓','Opini':'📝','Liputan Warga':'🌾','Esai':'📖'};
    const topCats = categoriesList.filter(c=>['Berita','Budaya','Komunitas','Lingkungan'].includes(c.name));
    catEl.innerHTML = topCats.map(c=>{
      const count = items.filter(([,a])=>a.cat===c.name).length;
      return '<div class="cat-box" onclick="showCat(\''+sanitize(c.name)+'\')"><div class="cat-box-icon">'+(catIcons[c.name]||'📄')+'</div><div class="cat-box-name">'+sanitize(c.name)+'</div><div class="cat-box-count">'+count+' artikel</div></div>';
    }).join('');
  }

  // Liputan Warga
  const lwEl = document.getElementById('liputanGrid');
  if(lwEl){
    const lw = items.filter(([,a])=>a.cat==='Liputan Warga').slice(0,3);
    lwEl.innerHTML = lw.map(([id,a])=>renderCardHTML(id,a)).join('');
  }
}

// ===== ARTICLE VIEW =====
async function showArticle(id){
  const a = articles[id];
  if(!a)return;
  document.getElementById('article-cat').textContent=a.cat;
  document.getElementById('article-breadcat').textContent=a.cat;
  document.getElementById('article-title').textContent=a.title;
  document.getElementById('article-lede').textContent=a.lede;
  document.getElementById('article-author').textContent=a.author;
  document.getElementById('article-avatar').textContent=a.av||'';
  document.getElementById('article-date').textContent=a.date;
  document.getElementById('article-read').textContent=a.read;
  const bodyEl = document.getElementById('article-body');
  if(a.body) bodyEl.innerHTML = a.body;
  else bodyEl.innerHTML = '<p>'+sanitize(a.lede)+'</p>';
  
  const coverEl = document.getElementById('article-cover');
  if(coverEl) {
    if(a.image) {
      coverEl.innerHTML = '<img src="'+sanitize(a.image)+'" style="width:100%;height:100%;object-fit:cover">';
      coverEl.style.background = 'none';
    } else {
      coverEl.innerHTML = '<svg width="160" height="100" viewBox="0 0 160 100" fill="none" opacity="0.12"><rect x="20" y="30" width="120" height="8" rx="4" fill="white"/><rect x="20" y="46" width="95" height="6" rx="3" fill="white"/><rect x="20" y="60" width="110" height="6" rx="3" fill="white"/></svg>';
      coverEl.style.background = 'linear-gradient(135deg,#0d2137,#1a4a6e,#0d2137)';
    }
  }

  // Tags
  const tagsEl = document.getElementById('article-tags-list');
  if(tagsEl && a.tags){
    tagsEl.innerHTML = (a.tags||[]).map(t=>'<span class="tag">'+sanitize(t)+'</span>').join('');
  }
  showPage('article');
  dbIncrementViews(id);
}

// ===== CATEGORY VIEW =====
function showCat(name){
  document.getElementById('cat-name').textContent=name;
  document.getElementById('cat-desc').textContent=(catInfo[name]||{desc:'Artikel pilihan dalam kategori ini.'}).desc;
  const items = Object.entries(articles).filter(([,a])=>a.cat===name && a.status==='published');
  const grid=document.getElementById('cat-articles');
  grid.innerHTML=items.slice(0,9).map(([id,a])=>renderCardHTML(id,a)).join('') || '<p style="color:var(--ink3)">Belum ada artikel dalam kategori ini.</p>';
  showPage('category');
  document.querySelectorAll('.nav-cat').forEach(el=>el.classList.toggle('active',el.textContent===name));
}

// ===== SEARCH =====
function openSearch(){document.getElementById('searchOverlay').classList.add('open');setTimeout(()=>document.getElementById('searchInput').focus(),50);}
function closeSearch(){document.getElementById('searchOverlay').classList.remove('open');}
function doSearch(q){
  const res=document.getElementById('searchResults');
  if(!q.trim()){res.innerHTML='';return;}
  const sq=q.toLowerCase();
  const m=Object.entries(articles).filter(([,a])=>a.title.toLowerCase().includes(sq)||a.cat.toLowerCase().includes(sq));
  res.innerHTML=m.slice(0,5).map(([id,a])=>
    '<div class="search-result-item" onclick="closeSearch();showArticle(\''+id+'\')"><div class="sr-cat">'+sanitize(a.cat)+'</div><div class="sr-title">'+sanitize(a.title)+'</div></div>'
  ).join('')||'<div style="padding:16px 0;color:var(--ink3);font-size:14px">Tidak ada hasil untuk "'+sanitize(q)+'"</div>';
}

// ===== ADMIN DASHBOARD =====
function loadAdminDashboard(){
  switchAdmin('dashboard');
  const all = Object.values(articles);
  const pub = all.filter(a=>a.status==='published');
  const draft = all.filter(a=>a.status==='draft');
  const rev = all.filter(a=>a.status==='review');
  const totalViews = all.reduce((s,a)=>s+(a.views||0),0);
  document.getElementById('statTotal').textContent = all.length;
  document.getElementById('statViews').textContent = totalViews > 1000 ? (totalViews/1000).toFixed(1)+'K' : totalViews;
  document.getElementById('statDraft').textContent = draft.length + rev.length;
  document.getElementById('statPub').textContent = pub.length;
  // Recent articles table
  const tbody = document.getElementById('dashboardArticles');
  tbody.innerHTML = all.slice(0,5).map(a=>
    '<tr><td><span style="font-weight:600">'+sanitize(a.title.substring(0,40))+'</span></td><td>'+sanitize(a.author)+'</td><td>'+sanitize(a.cat)+'</td>'+
    '<td><span class="status-pill '+(a.status==='published'?'published':a.status==='review'?'review':'draft')+'">'+statusLabel(a.status)+'</span></td>'+
    '<td>'+(a.views||'—')+'</td><td><button class="admin-action-btn" onclick="editArticle(\''+a.id+'\')">Edit</button></td></tr>'
  ).join('');
}

function statusLabel(s){return {published:'Terbit',draft:'Draft',review:'Review',archived:'Arsip'}[s]||s;}

// ===== ADMIN ARTICLE LIST =====
function loadAdminArticles(){
  const all = Object.values(articles);
  const tbody = document.getElementById('adminArticleList');
  tbody.innerHTML = all.map(a=>
    '<tr data-id="'+a.id+'"><td><span style="font-weight:600">'+sanitize(a.title.substring(0,45))+'</span></td>'+
    '<td>'+sanitize(a.author)+'</td><td>'+sanitize(a.cat)+'</td>'+
    '<td><span class="status-pill '+(a.status==='published'?'published':a.status==='review'?'review':'draft')+'">'+statusLabel(a.status)+'</span></td>'+
    '<td>'+sanitize(a.date)+'</td><td>'+(a.views||'—')+'</td>'+
    '<td>'+
    (a.status==='draft'?'<button class="admin-action-btn" onclick="adminSetStatus(\''+a.id+'\',\'review\')">Review</button>':'')+
    (a.status==='review'?'<button class="admin-action-btn" onclick="adminSetStatus(\''+a.id+'\',\'published\')">Publish</button>':'')+
    '<button class="admin-action-btn" onclick="editArticle(\''+a.id+'\')">Edit</button>'+
    '<button class="admin-action-btn" onclick="adminDelete(\''+a.id+'\')">Hapus</button></td></tr>'
  ).join('');
}

// ===== ADMIN CATEGORY LIST =====
function loadAdminCategories(){
  const tbody = document.getElementById('adminCatList');
  tbody.innerHTML = categoriesList.map(c=>{
    const count = Object.values(articles).filter(a=>a.category_id===c.id).length;
    return '<tr data-id="'+c.id+'"><td><strong>'+sanitize(c.name)+'</strong></td><td style="color:var(--brick);font-size:12px">/kategori/'+sanitize(c.slug)+'</td>'+
    '<td style="color:var(--ink3)">'+sanitize(c.description.substring(0,40))+'</td><td>'+count+'</td>'+
    '<td><button class="admin-action-btn" onclick="adminDeleteCat(\''+c.id+'\',\''+sanitize(c.name)+'\')">Hapus</button></td></tr>';
  }).join('');
}

// ===== ADMIN NAV =====
function switchAdmin(panel){
  document.querySelectorAll('.admin-page').forEach(el=>el.classList.remove('active'));
  const t=document.getElementById('admin-'+panel);if(t)t.classList.add('active');
  document.querySelectorAll('.admin-nav-item').forEach(el=>el.classList.remove('active'));
  const map={dashboard:0,articles:1,'new-article':2,categories:3};
  const items=document.querySelectorAll('.admin-nav-item');
  if(map[panel]!==undefined&&items[map[panel]])items[map[panel]].classList.add('active');
  if(panel==='articles') loadAdminArticles();
  if(panel==='categories') loadAdminCategories();
  if(panel==='new-article') clearEditor();
}

// ===== ARTICLE EDITOR =====
let _editingId = null;

function clearEditor(){
  _editingId = null;
  document.getElementById('articleTitle').value='';
  document.getElementById('articleSlug').value='';
  document.getElementById('articleImage').value='';
  document.getElementById('articleLede').value='';
  document.getElementById('articleBody').value='';
  document.getElementById('articleCategory').value='';
  document.getElementById('articleStatus').value='draft';
  document.getElementById('articleAuthor').value='';
  document.getElementById('articleTags').value='';
  document.getElementById('articleMetaTitle').value='';
  document.getElementById('articleMetaDesc').value='';
  // Populate category dropdown
  const sel = document.getElementById('articleCategory');
  sel.innerHTML = '<option value="">Pilih...</option>' + categoriesList.map(c=>'<option value="'+c.id+'">'+sanitize(c.name)+'</option>').join('');
}

function editArticle(id){
  const a = articles[id];if(!a)return;
  _editingId = id;
  document.getElementById('articleTitle').value = a.title;
  document.getElementById('articleSlug').value = a.slug;
  document.getElementById('articleLede').value = a.lede||'';
  document.getElementById('articleBody').value = a.body||'';
  document.getElementById('articleStatus').value = a.status;
  document.getElementById('articleAuthor').value = a.author_name||'';
  document.getElementById('articleTags').value = (a.tags||[]).join(', ');
  document.getElementById('articleMetaTitle').value = a.meta_title||'';
  document.getElementById('articleMetaDesc').value = a.meta_description||'';
  // Category
  const sel = document.getElementById('articleCategory');
  sel.innerHTML = '<option value="">Pilih...</option>' + categoriesList.map(c=>'<option value="'+c.id+'"'+(c.id===a.category_id?' selected':'')+'>'+sanitize(c.name)+'</option>').join('');
  switchAdmin('new-article');
}

function updateSlug(v){
  document.getElementById('articleSlug').value=v.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
}

function getEditorData(){
  const title = document.getElementById('articleTitle').value.trim();
  if(!title){showToast('error','Judul artikel harus diisi.');return null;}
  const tags = document.getElementById('articleTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  return {
    title: title,
    slug: document.getElementById('articleSlug').value.trim() || title.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-'),
    lede: document.getElementById('articleLede').value.trim(),
    body: document.getElementById('articleBody').value.trim(),
    category_id: document.getElementById('articleCategory').value || null,
    status: document.getElementById('articleStatus').value,
    author_name: document.getElementById('articleAuthor').value.trim(),
    author_avatar: (document.getElementById('articleAuthor').value.trim().match(/\b\w/g)||[]).slice(0,2).join('').toUpperCase(),
    tags: tags,
    meta_title: document.getElementById('articleMetaTitle').value.trim(),
    meta_description: document.getElementById('articleMetaDesc').value.trim(),
    read_time: Math.max(1,Math.ceil((document.getElementById('articleBody').value.length)/1000))+' menit baca'
  };
}

async function handleImageUpload(d) {
  const fileInput = document.getElementById('articleImage');
  if (fileInput && fileInput.files.length > 0) {
    showToast('info', 'Mengunggah gambar...');
    const url = await dbUploadImage(fileInput.files[0]);
    if (url) {
      d.image_url = url;
    } else {
      showToast('error', 'Gagal mengunggah gambar.');
    }
  }
}

async function saveDraft(){
  const d = getEditorData(); if(!d) return;
  await handleImageUpload(d);
  d.status = 'draft';
  if(_editingId){
    const r = await dbUpdateArticle(_editingId, d);
    if(r){showToast('success','Draft berhasil disimpan.'); await loadAllData(); loadAdminArticles();}
    else showToast('error','Gagal menyimpan draft.');
  } else {
    const r = await dbCreateArticle(d);
    if(r){_editingId=r.id;showToast('success','Draft baru berhasil dibuat.'); await loadAllData();}
    else showToast('error','Gagal membuat draft.');
  }
}

async function publishDone(){
  const d = getEditorData(); if(!d) return;
  d.status = 'published';
  d.published_at = new Date().toISOString();
  openModal('Publish Artikel','Publish "'+d.title.substring(0,40)+'..."?', async()=>{
    await handleImageUpload(d);
    let r;
    if(_editingId) r = await dbUpdateArticle(_editingId, d);
    else r = await dbCreateArticle(d);
    if(r){
      showToast('success','Artikel berhasil dipublikasikan!');
      await loadAllData();
      switchAdmin('articles');
    } else showToast('error','Gagal mempublikasikan artikel.');
  });
}

async function adminSetStatus(id, status){
  const a = articles[id];if(!a)return;
  const label = statusLabel(status);
  openModal(label+' Artikel', label+' "'+a.title.substring(0,40)+'"?', async()=>{
    const updates = {status};
    if(status==='published') updates.published_at = new Date().toISOString();
    const r = await dbUpdateArticle(id, updates);
    if(r){showToast('success','Artikel "'+a.title.substring(0,30)+'" → '+label); await loadAllData(); loadAdminArticles();}
    else showToast('error','Gagal mengubah status.');
  });
}

async function adminDelete(id){
  const a = articles[id];if(!a)return;
  openModal('Hapus Artikel','Hapus "'+a.title.substring(0,40)+'" secara permanen?', async()=>{
    const ok = await dbDeleteArticle(id);
    if(ok){showToast('success','Artikel dihapus.'); await loadAllData(); loadAdminArticles();}
    else showToast('error','Gagal menghapus.');
  });
}

// ===== CATEGORY CRUD =====
function showAddCatModal(){
  document.getElementById('catModal').classList.add('open');
  document.getElementById('catModalName').value='';
  document.getElementById('catModalSlug').value='';
  document.getElementById('catModalDesc').value='';
}
function closeCatModal(){document.getElementById('catModal').classList.remove('open');}

async function submitNewCategory(){
  const name = document.getElementById('catModalName').value.trim();
  const slug = document.getElementById('catModalSlug').value.trim() || name.toLowerCase().replace(/\s+/g,'-');
  const desc = document.getElementById('catModalDesc').value.trim();
  if(!name){showToast('error','Nama kategori harus diisi.');return;}
  const r = await dbCreateCategory({name,slug,description:desc});
  if(r){showToast('success','Kategori "'+name+'" berhasil ditambahkan!'); closeCatModal(); categoriesList.push(r); catInfo[r.name]={desc:r.description,id:r.id,slug:r.slug}; loadAdminCategories();}
  else showToast('error','Gagal menambahkan kategori.');
}

async function adminDeleteCat(id, name){
  openModal('Hapus Kategori','Hapus kategori "'+name+'"?', async()=>{
    const ok = await dbDeleteCategory(id);
    if(ok){showToast('success','Kategori "'+name+'" dihapus.'); categoriesList=categoriesList.filter(c=>c.id!==id); delete catInfo[name]; loadAdminCategories();}
    else showToast('error','Gagal menghapus kategori.');
  });
}

// ===== AI TOOL =====
function aiGenerate(type){
  const r=document.getElementById('aiResult');
  r.style.display='block';r.textContent='\uD83E\uDD16 Memproses...';
  setTimeout(()=>{r.textContent=aiResponses[type][0];r.style.whiteSpace='pre-line';},800);
}

// ===== SHARE =====
function getShareUrl(){return 'https://ruangwarta.id/artikel/'+(document.getElementById('article-title').textContent||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').substring(0,60);}
function getShareTitle(){return document.getElementById('article-title').textContent||'Artikel RuangWarta';}
function shareWA(){window.open('https://wa.me/?text='+encodeURIComponent(getShareTitle()+' '+getShareUrl()),'_blank');}
function shareFB(){window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(getShareUrl()),'_blank');}
function shareTW(){window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(getShareTitle())+'&url='+encodeURIComponent(getShareUrl()),'_blank');}
function copyLink(){navigator.clipboard.writeText(getShareUrl()).then(()=>showToast('success','Tautan disalin!')).catch(()=>showToast('error','Gagal menyalin.'));}
function toggleReadMode(){document.body.classList.toggle('reading-mode');}

// ===== NEWSLETTER =====
function subscribeNL(){
  const e=document.getElementById('nlEmail');
  if(e.value&&e.value.includes('@')){showToast('success','Terima kasih! Kamu sudah berlangganan.');e.value='';}
  else showToast('error','Masukkan email yang valid.');
}

// ===== INIT =====
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();closeModal();closeCatModal();}});

async function initApp(){
  await initSupabaseAuth();
  await loadAllData();
  renderHomepage();
  if(isLoggedIn()){
    document.getElementById('navAdminBtn').textContent='Panel';
  }
}

initApp();
