/**
 * RuangWarta - Authentication & Security Module
 * ===============================================
 * Menggunakan Web Crypto API (SHA-256) untuk hashing.
 * Session management dengan localStorage (fallback in-memory) + cookie.
 * Rate limiting untuk mencegah brute force.
 */
'use strict';

// ===== XSS SANITIZER =====
function sanitize(str){
  const d=document.createElement('div');d.appendChild(document.createTextNode(str));return d.innerHTML;
}

// ===== CRYPTO (Web Crypto API - SHA-256) =====
async function sha256(message){
  try {
    const msgBuf=new TextEncoder().encode(message);
    const hashBuf=await crypto.subtle.digest('SHA-256',msgBuf);
    return Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  } catch(e) {
    console.error("Crypto error:", e);
    // Fallback insecure hash just to prevent complete breakage if crypto.subtle is blocked
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
  }
}

async function generateToken(email){
  const ts=Date.now().toString();
  try {
    const rand=crypto.getRandomValues(new Uint8Array(16));
    const randHex=Array.from(rand).map(b=>b.toString(16).padStart(2,'0')).join('');
    return await sha256(email+'|'+ts+'|'+randHex);
  } catch(e) {
    return await sha256(email+'|'+ts+'|'+Math.random().toString());
  }
}

// ===== SESSION MANAGEMENT =====
// Uses localStorage/cookie with in-memory fallback for strict browsers (like Brave on file://)
const _sessionKey='rw_session';
const _userKey='rw_user';
const _csrfKey='rw_csrf';
const _expiryKey='rw_expiry';

// In-memory fallback if localStorage is blocked
const _memoryStorage = {};

function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); } 
  catch(e) { _memoryStorage[key] = value; }
}

function safeGetItem(key) {
  try { return localStorage.getItem(key) || _memoryStorage[key]; } 
  catch(e) { return _memoryStorage[key]; }
}

function safeRemoveItem(key) {
  try { localStorage.removeItem(key); } catch(e) {}
  delete _memoryStorage[key];
}

function setSession(token,email,csrf,hours){
  const expiry=Date.now()+hours*3600000;
  safeSetItem(_sessionKey,token);
  safeSetItem(_userKey,email);
  safeSetItem(_csrfKey,csrf);
  safeSetItem(_expiryKey,expiry.toString());
  try{
    const d=new Date(expiry);
    document.cookie=_sessionKey+'='+encodeURIComponent(token)+';expires='+d.toUTCString()+';path=/;SameSite=Strict';
  }catch(e){}
}

function getSession(){
  const expiry=safeGetItem(_expiryKey);
  if(expiry&&Date.now()>parseInt(expiry)){
    clearSession();
    return null;
  }
  return safeGetItem(_sessionKey);
}

function clearSession(){
  safeRemoveItem(_sessionKey);
  safeRemoveItem(_userKey);
  safeRemoveItem(_csrfKey);
  safeRemoveItem(_expiryKey);
  try{
    document.cookie=_sessionKey+'=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict';
  }catch(e){}
}

// ===== LOGIN HANDLER =====
let _loginAttempts=0;
let _lockoutUntil=0;

async function handleLogin(){
  try {
    // Check lockout
    if(Date.now()<_lockoutUntil){
      const remaining=Math.ceil((_lockoutUntil-Date.now())/60000);
      showToast('error','Terlalu banyak percobaan. Tunggu '+remaining+' menit.');
      return;
    }
    if(typeof CREDENTIALS === 'undefined') {
      showToast('error','Sistem tidak dapat memuat file kredensial (CORS/File Error).');
      console.error('CREDENTIALS object is missing. If opening via file://, your browser might block local scripts.');
      return;
    }
    if(_loginAttempts>=CREDENTIALS.MAX_ATTEMPTS){
      _lockoutUntil=Date.now()+5*60000; // 5 menit lockout
      _loginAttempts=0;
      showToast('error','Akun terkunci selama 5 menit.');
      return;
    }

    const email=document.getElementById('loginEmail').value.trim();
    const pass=document.getElementById('loginPassword').value;
    const errEl=document.getElementById('loginError');

    if(!email||!pass){
      errEl.textContent='Mohon isi email dan kata sandi.';errEl.classList.add('show');return;
    }

    const passHash=await sha256(pass);
    if(email===CREDENTIALS.VALID_EMAIL&&passHash===CREDENTIALS.ADMIN_HASH){
      _loginAttempts=0;errEl.classList.remove('show');
      const token=await generateToken(email);
      const csrf=await sha256(token+navigator.userAgent);
      
      setSession(token,email,csrf,CREDENTIALS.SESSION_HOURS);
      
      const navBtn = document.getElementById('navAdminBtn');
      if(navBtn) navBtn.textContent='Panel';
      
      showToast('success','Login berhasil! Selamat datang.');
      showPage('admin');
    } else {
      _loginAttempts++;
      const left=CREDENTIALS.MAX_ATTEMPTS-_loginAttempts;
      errEl.textContent='Email atau kata sandi salah. ('+left+' percobaan tersisa)';
      errEl.classList.add('show');
      showToast('error','Kredensial tidak valid.');
    }
  } catch (err) {
    console.error("Login error: ", err);
    showToast('error', 'Terjadi kesalahan sistem. Cek console browser.');
  }
}

function handleAdminNav(){
  if(getSession()){showPage('admin');}
  else{showPage('login');}
}

function handleLogout(){
  openModal('Keluar','Apakah Anda yakin ingin keluar dari Panel Redaksi?',()=>{
    clearSession();
    const navBtn = document.getElementById('navAdminBtn');
    if(navBtn) navBtn.textContent='Admin';
    showToast('success','Anda telah keluar.');
    showPage('home');
  });
}

function isLoggedIn(){
  return !!getSession();
}
