/**
 * RuangWarta - Authentication (Supabase Auth)
 */
'use strict';

// XSS Sanitizer
function sanitize(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

let _loginAttempts = 0;
let _lockoutUntil = 0;

async function handleLogin() {
  if (Date.now() < _lockoutUntil) {
    const rem = Math.ceil((_lockoutUntil - Date.now()) / 60000);
    showToast('error', 'Terlalu banyak percobaan. Tunggu ' + rem + ' menit.');
    return;
  }

  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  if (!email || !pass) {
    errEl.textContent = 'Mohon isi email dan kata sandi.';
    errEl.classList.add('show');
    return;
  }

  errEl.classList.remove('show');
  const { data, error } = await dbSignIn(email, pass);

  if (error) {
    _loginAttempts++;
    if (_loginAttempts >= 5) {
      _lockoutUntil = Date.now() + 5 * 60000;
      _loginAttempts = 0;
      showToast('error', 'Akun terkunci selama 5 menit.');
      return;
    }
    errEl.textContent = error.message === 'Invalid login credentials'
      ? 'Email atau kata sandi salah. (' + (5 - _loginAttempts) + ' percobaan tersisa)'
      : error.message;
    errEl.classList.add('show');
    showToast('error', 'Kredensial tidak valid.');
    return;
  }

  _loginAttempts = 0;
  errEl.classList.remove('show');
  _currentUser = data.user;
  document.getElementById('navAdminBtn').textContent = 'Panel';
  showToast('success', 'Login berhasil! Selamat datang.');

  // Reload data (now with auth, can see drafts/reviews)
  await loadAllData();
  showPage('admin');
  loadAdminDashboard();
}

async function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const specialty = document.getElementById('regSpecialty').value;
  const pass = document.getElementById('regPassword').value;

  if (!name || !email || !pass) {
    showToast('error', 'Mohon lengkapi semua field.');
    return;
  }
  if (pass.length < 6) {
    showToast('error', 'Kata sandi minimal 6 karakter.');
    return;
  }

  const { error } = await dbSignUp(email, pass, { full_name: name, specialty: specialty });

  if (error) {
    showToast('error', error.message);
    return;
  }

  showToast('success', 'Pendaftaran berhasil! Cek email untuk konfirmasi, lalu login.');
  showPage('login');
}

function handleAdminNav() {
  if (dbIsLoggedIn()) {
    showPage('admin');
    loadAdminDashboard();
  } else {
    showPage('login');
  }
}

async function handleLogout() {
  openModal('Keluar', 'Apakah Anda yakin ingin keluar dari Panel Redaksi?', async () => {
    await dbSignOut();
    _currentUser = null;
    document.getElementById('navAdminBtn').textContent = 'Admin';
    showToast('success', 'Anda telah keluar.');
    await loadAllData(); // Reload with public-only view
    showPage('home');
    renderHomepage();
  });
}

function isLoggedIn() {
  return dbIsLoggedIn();
}
