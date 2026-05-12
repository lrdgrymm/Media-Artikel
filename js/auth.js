/**
 * RuangWarta - Authentication & Security Module
 * ===============================================
 * Menggunakan Web Crypto API (SHA-256) untuk hashing.
 * Cookie session dengan SameSite=Strict & Secure flags.
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

// ===== COOKIE MANAGEMENT =====
function setSecureCookie(name,val,hours){
  const d=new Date();d.setTime(d.getTime()+hours*3600000);
  document.cookie=name+'='+encodeURIComponent(val)+';expires='+d.toUTCString()+';path=/;SameSite=Strict;Secure';
}

function getCookie(name){
  const v=document.cookie.match('(^|;)\\s*'+name+'=([^;]*)');
  return v?decodeURIComponent(v[2]):null;
}

function deleteCookie(name){
  document.cookie=name+'=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict';
}

// ===== LOGIN HANDLER =====
let _loginAttempts=0;

async function handleLogin(){
  if(_loginAttempts>=CREDENTIALS.MAX_ATTEMPTS){
    showToast('error','Terlalu banyak percobaan. Coba lagi dalam 5 menit.');return;
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
    const prefix=CREDENTIALS.COOKIE_PREFIX;
    const hours=CREDENTIALS.SESSION_HOURS;
    setSecureCookie(prefix+'session',token,hours);
    setSecureCookie(prefix+'user',email,hours);
    setSecureCookie(prefix+'csrf',await sha256(token+navigator.userAgent),hours);
    showToast('success','Login berhasil! Selamat datang.');
    showPage('admin');
  } else {
    _loginAttempts++;
    errEl.textContent='Email atau kata sandi salah. ('+_loginAttempts+'/'+CREDENTIALS.MAX_ATTEMPTS+')';
    errEl.classList.add('show');
    showToast('error','Kredensial tidak valid.');
  }
}

function handleAdminNav(){
  if(getCookie(CREDENTIALS.COOKIE_PREFIX+'session')){showPage('admin');}
  else{showPage('login');}
}

function handleLogout(){
  openModal('Keluar','Apakah Anda yakin ingin keluar dari Panel Redaksi?',()=>{
    const prefix=CREDENTIALS.COOKIE_PREFIX;
    deleteCookie(prefix+'session');deleteCookie(prefix+'user');deleteCookie(prefix+'csrf');
    document.getElementById('navAdminBtn').textContent='Admin';
    showToast('success','Anda telah keluar.');showPage('home');
  });
}

function isLoggedIn(){
  return !!getCookie(CREDENTIALS.COOKIE_PREFIX+'session');
}
