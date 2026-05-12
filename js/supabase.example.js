/**
 * RuangWarta - Supabase Client & CRUD
 */
'use strict';

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== AUTH STATE =====
let _currentUser = null;

async function initSupabaseAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  _currentUser = session?.user || null;
  _supabase.auth.onAuthStateChange((_event, session) => {
    _currentUser = session?.user || null;
    const btn = document.getElementById('navAdminBtn');
    if (btn) btn.textContent = _currentUser ? 'Panel' : 'Admin';
  });
}

// ===== ARTICLES CRUD =====
async function dbFetchArticles(opts = {}) {
  let q = _supabase.from('articles').select('*, categories(id, name, slug)');
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.categoryName) q = q.eq('categories.name', opts.categoryName);
  if (opts.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts.isFeatured) q = q.eq('is_featured', true);
  if (opts.limit) q = q.limit(opts.limit);
  q = q.order(opts.orderBy || 'published_at', { ascending: false, nullsFirst: false });
  const { data, error } = await q;
  if (error) { console.error('dbFetchArticles:', error); return []; }
  // Filter by categoryName post-query (Supabase embedded filter quirk)
  if (opts.categoryName) {
    return data.filter(a => a.categories && a.categories.name === opts.categoryName);
  }
  return data || [];
}

async function dbFetchArticleById(id) {
  const { data, error } = await _supabase.from('articles').select('*, categories(id, name, slug)').eq('id', id).single();
  if (error) { console.error('dbFetchArticleById:', error); return null; }
  return data;
}

async function dbCreateArticle(article) {
  const { data, error } = await _supabase.from('articles').insert(article).select('*, categories(id, name, slug)').single();
  if (error) { console.error('dbCreateArticle:', error); return null; }
  return data;
}

async function dbUpdateArticle(id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await _supabase.from('articles').update(updates).eq('id', id).select('*, categories(id, name, slug)').single();
  if (error) { console.error('dbUpdateArticle:', error); return null; }
  return data;
}

async function dbDeleteArticle(id) {
  const { error } = await _supabase.from('articles').delete().eq('id', id);
  if (error) { console.error('dbDeleteArticle:', error); return false; }
  return true;
}

async function dbUploadImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await _supabase.storage
    .from('images')
    .upload(filePath, file);

  if (error) {
    console.error('dbUploadImage error:', error);
    return null;
  }
  
  const { data: publicUrlData } = _supabase.storage
    .from('images')
    .getPublicUrl(filePath);
    
  return publicUrlData.publicUrl;
}

async function dbIncrementViews(id) {
  await _supabase.rpc('increment_views', { article_id: id });
}

// ===== CATEGORIES CRUD =====
async function dbFetchCategories() {
  const { data, error } = await _supabase.from('categories').select('*').order('name');
  if (error) { console.error('dbFetchCategories:', error); return []; }
  return data || [];
}

async function dbCreateCategory(cat) {
  const { data, error } = await _supabase.from('categories').insert(cat).select().single();
  if (error) { console.error('dbCreateCategory:', error); return null; }
  return data;
}

async function dbUpdateCategory(id, updates) {
  const { data, error } = await _supabase.from('categories').update(updates).eq('id', id).select().single();
  if (error) { console.error('dbUpdateCategory:', error); return null; }
  return data;
}

async function dbDeleteCategory(id) {
  const { error } = await _supabase.from('categories').delete().eq('id', id);
  if (error) { console.error('dbDeleteCategory:', error); return false; }
  return true;
}

// ===== AUTH =====
async function dbSignIn(email, password) {
  return await _supabase.auth.signInWithPassword({ email, password });
}

async function dbSignUp(email, password, meta) {
  return await _supabase.auth.signUp({ email, password, options: { data: meta } });
}

async function dbSignOut() {
  return await _supabase.auth.signOut();
}

function dbIsLoggedIn() {
  return !!_currentUser;
}
