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

// ===== CRYPTO (Pure JS SHA-256 Fallback for strict browsers) =====
async function sha256(ascii) {
  try {
    const msgBuf = new TextEncoder().encode(ascii);
    const hashBuf = await crypto.subtle.digest('SHA-256', msgBuf);
    return Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  } catch (e) {
    // Pure JS Fallback
    function rightRotate(value, amount) { return (value>>>amount) | (value<<(32 - amount)); }
    var mathPow = Math.pow; var maxWord = mathPow(2, 32); var lengthProperty = 'length';
    var i, j; var result = ''; var words = []; var asciiBitLength = ascii[lengthProperty]*8;
    var hash = sha256.h = sha256.h || []; var k = sha256.k = sha256.k || []; var primeCounter = k[lengthProperty];
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
        k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty]%64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i>>2] |= j << ((3 - i)%4)*8;
    }
    words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16); var oldHash = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e&hash[5])^((~e)&hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)))|0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
        hash = [(temp1 + temp2)|0].concat(hash); hash[4] = (hash[4] + temp1)|0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i])|0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i]>>(j*8))&255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
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
      // Fallback for GitHub Pages demo where credentials.js is gitignored
      window.CREDENTIALS = {
        ADMIN_HASH: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        VALID_EMAIL: 'admin@ruangwarta.id',
        MAX_ATTEMPTS: 5,
        SESSION_HOURS: 8
      };
      console.warn('Menggunakan kredensial demo bawaan karena config/credentials.js tidak ditemukan.');
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
