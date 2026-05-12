/**
 * RuangWarta - Credential Configuration TEMPLATE
 * ================================================
 * Salin file ini menjadi 'credentials.js' lalu isi dengan hash yang benar.
 * 
 * Cara membuat SHA-256 hash dari password:
 * 1. Buka browser console (F12)
 * 2. Jalankan:
 *    crypto.subtle.digest('SHA-256', new TextEncoder().encode('password_anda'))
 *      .then(h => console.log(Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('')))
 * 3. Salin output hash ke ADMIN_HASH di bawah
 */
'use strict';

const CREDENTIALS = {
  ADMIN_HASH: 'GANTI_DENGAN_SHA256_HASH_PASSWORD_ANDA',
  VALID_EMAIL: 'admin@ruangwarta.id',
  MAX_ATTEMPTS: 5,
  SESSION_HOURS: 8,
  COOKIE_PREFIX: 'rw_'
};
