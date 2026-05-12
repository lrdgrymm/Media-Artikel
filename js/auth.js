/**
 * RuangWarta - Authentication & Security Module
 * ===============================================
 * Menggunakan Web Crypto API (SHA-256) untuk hashing.
 * Session management dengan localStorage (fallback) + cookie.
 * Rate limiting untuk mencegah brute force.
 */
'use strict';

// ===== XSS SANITIZER =====
function sanitize(str){
  const d=document.createElement('div');d.appendChild(document.createTextNode(str));return d.innerHTML;
}

// ===== CRYPTO (Web Crypto API - SHA-256) =====
async function sha256(message){
  const msgBuf=new TextEncoder().encode(message);
  const hashBuf=await crypto.subtle.digest('SHA-256',msgBuf);
  return Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function generateToken(email){
  const ts=Date.now().toString();
  const rand=crypto.getRandomValues(new Uint8Array(16));
  const randHex=Array.from(rand).map(b=>b.toString(16).padStart(2,'0')).join('');
  return await sha256(email+'|'+ts+'|'+randHex);
}

// ===== SESSION MANAGEMENT =====
// Uses localStorage as primary (works on file://), cookie as secondary
const _sessionKey='rw_session';
const _userKey='rw_user';
const _csrfKey='rw_csrf';
const _expiryKey='rw_expiry';

function setSession(token,email,csrf,hours){
  const expiry=Date.now()+hours*3600000;
  localStorage.setItem(_sessionKey,token);
  localStorage.setItem(_userKey,email);
  localStorage.setItem(_csrfKey,csrf);
  localStorage.setItem(_expiryKey,expiry.toString());
  // Also set cookie for server-side compatibility
  try{
    const d=new Date(expiry);
    document.cookie=_sessionKey+'='+encodeURIComponent(token)+';expires='+d.toUTCString()+';path=/;SameSite=Strict';
  }catch(e){}
}

function getSession(){
  const expiry=localStorage.getItem(_expiryKey);
  if(expiry&&Date.now()>parseInt(expiry)){
    clearSession();
    return null;
  }
  return localStorage.getItem(_sessionKey);
}

function clearSession(){
  localStorage.removeItem(_sessionKey);
  localStorage.removeItem(_userKey);
  localStorage.removeItem(_csrfKey);
  localStorage.removeItem(_expiryKey);
  try{
    document.cookie=_sessionKey+'=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict';
  }catch(e){}
}

// ===== LOGIN HANDLER =====
let _loginAttempts=0;
let _lockoutUntil=0;

async function handleLogin(){
  // Check lockout
  if(Date.now()<_lockoutUntil){
    const remaining=Math.ceil((_lockoutUntil-Date.now())/60000);
    showToast('error','Terlalu banyak percobaan. Tunggu '+remaining+' menit.');
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
    document.getElementById('navAdminBtn').textContent='Panel';
    showToast('success','Login berhasil! Selamat datang.');
    showPage('admin');
  } else {
    _loginAttempts++;
    const left=CREDENTIALS.MAX_ATTEMPTS-_loginAttempts;
    errEl.textContent='Email atau kata sandi salah. ('+left+' percobaan tersisa)';
    errEl.classList.add('show');
    showToast('error','Kredensial tidak valid.');
  }
}

function handleAdminNav(){
  if(getSession()){showPage('admin');}
  else{showPage('login');}
}

function handleLogout(){
  openModal('Keluar','Apakah Anda yakin ingin keluar dari Panel Redaksi?',()=>{
    clearSession();
    document.getElementById('navAdminBtn').textContent='Admin';
    showToast('success','Anda telah keluar.');
    showPage('home');
  });
}

function isLoggedIn(){
  return !!getSession();
}
