/**
 * RuangWarta - Data Layer (loads from Supabase)
 */
'use strict';

// Global stores
let articles = {};
let categoriesList = [];
let catInfo = {};
let allArticlesRaw = [];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const m = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
}

function articleToLegacy(a) {
  return {
    ...a,
    cat: a.categories ? a.categories.name : 'Umum',
    author: a.author_name,
    av: a.author_avatar,
    date: formatDate(a.published_at || a.created_at),
    read: a.read_time,
    title: a.title,
    lede: a.lede,
    image: a.image_url
  };
}

async function loadAllData() {
  // Load categories
  categoriesList = await dbFetchCategories();
  catInfo = {};
  categoriesList.forEach(c => {
    catInfo[c.name] = { desc: c.description, id: c.id, slug: c.slug };
  });

  // Load all articles (authenticated users see all, public see published)
  allArticlesRaw = await dbFetchArticles({});
  articles = {};
  allArticlesRaw.forEach(a => { articles[a.id] = articleToLegacy(a); });
}

// AI responses (kept local - not in DB)
const aiResponses = {
  headline:['5 Alternatif Judul:\n1. Air di Ujung Tanduk: Ribuan Warga Pesisir Kehabisan Sumber\n2. Mata Air Mengering, Warga Bertahan\n3. Tiga Bulan Tanpa Air: Kisah dari Balik Krisis\n4. Ketika Laut Ada di Mana-Mana Tapi Air Bersih Tak Ada\n5. Sumur Mengering, Harapan Tak Boleh Ikut Mengering'],
  summary:['Ringkasan: Lebih dari 12.000 KK di lima kecamatan pesisir menghadapi krisis air bersih akibat penurunan debet air tanah hingga 70%.'],
  meta:['Meta Description (118 karakter):\n"Krisis air bersih di pesisir selatan memaksa ribuan warga tempuh jarak jauh setiap hari. Investigasi RuangWarta."'],
  tags:['Rekomendasi 8 Tag:\n\u2022 Air Bersih \u2022 Pesisir Selatan \u2022 Krisis Air \u2022 Lingkungan\n\u2022 Tambak Ilegal \u2022 Warga Terdampak \u2022 Investigasi \u2022 Kebijakan'],
  proofread:['\u2713 Ejaan dan tanda baca: Baik\n\u2713 Konsistensi gaya bahasa: Cukup baik\n\u26A0 Kalimat ke-3 paragraf 2: Terlalu panjang\n\u2713 Lead sudah kuat'],
  caption:['Caption Instagram:\n"Tiga bulan. Jarak 2 km. Jeriken 20 liter. Itu rutinitas Bu Sumiyati setiap pagi.\n\n#AirBersih #LingkunganHidup #RuangWarta"']
};
