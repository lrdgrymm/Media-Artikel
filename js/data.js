/**
 * RuangWarta - Article Data & Categories
 * =======================================
 * Database artikel dan informasi kategori.
 */
'use strict';

const articles = {
  featured:{cat:'Lingkungan',title:'Krisis Air di Pesisir Selatan: Ketika Warga Harus Pilih Antara Minum dan Mandi',lede:'Ribuan warga di lima kecamatan pesisir kini menghadapi krisis air bersih yang makin parah seiring mundurnya muka air tanah.',author:'Sari Dewanti',av:'SD',date:'14 Mei 2025',read:'8 menit baca'},
  a2:{cat:'Komunitas',title:'Pasar Tradisional Terakhir di Pusat Kota Hadapi Ancaman Pembangunan Mall',lede:'Pedagang yang sudah berjualan puluhan tahun kini was-was setelah investor besar melirik lahan pasar.',author:'Adi Pratama',av:'AP',date:'13 Mei 2025',read:'5 menit baca'},
  a3:{cat:'Pendidikan',title:'Sekolah Satu Atap di Perbatasan: Satu Guru untuk Enam Kelas',lede:'Di pelosok perbatasan, seorang guru mengabdi sendirian, mengajar dari kelas satu hingga enam.',author:'Lilis Handayani',av:'LH',date:'13 Mei 2025',read:'7 menit baca'},
  a4:{cat:'Opini',title:'Mengapa Subsidi Bahan Bakar Bukan Solusi Energi Jangka Panjang',lede:'Ketergantungan pada subsidi BBM justru memperlambat transisi energi bersih yang sudah mendesak.',author:'Prof. Budi Santoso',av:'BS',date:'13 Mei 2025',read:'6 menit baca'},
  a5:{cat:'Lingkungan',title:'Hutan Mangrove Terancam: 40% Kawasan Pesisir Rusak Akibat Tambak Ilegal',lede:'Riset terbaru menunjukkan kerusakan yang jauh lebih parah dari perkiraan awal.',author:'Yanti Kusuma',av:'YK',date:'13 Mei 2025',read:'5 menit baca'},
  a6:{cat:'Berita',title:'DPRD Kota Gelar Rapat Darurat Soal Anggaran Infrastruktur yang Tersendat',lede:'Sembilan proyek pembangunan jalan dihentikan sementara karena menunggu pencairan anggaran.',author:'Rahmat Hakim',av:'RH',date:'12 Mei 2025',read:'4 menit baca'},
  a7:{cat:'Budaya',title:'Festival Seni Lokal Kembali Hadir: Puluhan Seniman Muda Pamerkan Karyanya',lede:'Setelah tiga tahun vakum, festival ini kembali menjadi ruang ekspresi bagi komunitas seni lokal.',author:'Dewi Anggraini',av:'DA',date:'12 Mei 2025',read:'6 menit baca'},
  op1:{cat:'Opini',title:'Kota Pintar tanpa Warga Cerdas: Ironi Digitalisasi yang Tak Merata',lede:'Program smart city menghabiskan miliaran rupiah, namun masih banyak warga yang belum bisa mengakses internet.',author:'Mirna Sanjaya',av:'MS',date:'12 Mei 2025',read:'7 menit baca'},
  op2:{cat:'Esai',title:'Belajar dari Desa: Kenapa Kota Justru Perlu Meniru Gotong Royong',lede:'Di saat urbanisasi mengikis solidaritas, desa-desa kecil justru membuktikan nilai-nilai komunal masih bisa diandalkan.',author:'Hendra Wijaya',av:'HW',date:'11 Mei 2025',read:'8 menit baca'},
  op3:{cat:'Opini',title:'Media Lokal di Titik Kritis: Antara Bertahan dan Bermartabat',lede:'Tekanan ekonomi dan konsolidasi media mengancam keberagaman informasi yang selama ini dijaga media lokal.',author:'Fitri Amaliah',av:'FA',date:'10 Mei 2025',read:'6 menit baca'},
  op4:{cat:'Esai',title:'Ruang Publik yang Kita Rindukan: Taman Kota bukan untuk Warga',lede:'Taman yang seharusnya menjadi milik semua kini semakin sulit diakses oleh warga dari kalangan bawah.',author:'Ahmad Fauzan',av:'AF',date:'9 Mei 2025',read:'5 menit baca'},
  lw1:{cat:'Liputan Warga',title:'Kisah Bu Siti: Bertahan Jadi Petani Garam di Tengah Gempuran Impor',lede:'Tiga generasi keluarga Siti bergantung pada ladang garam yang kini terancam kebijakan impor besar-besaran.',author:'Kontributor Lokal',av:'KL',date:'10 Mei 2025',read:'6 menit baca'},
  lw2:{cat:'Liputan Warga',title:'Kampung Digital: Ketika Ibu-Ibu PKK Belajar Jualan Online dari Nol',lede:'Program pelatihan ekonomi digital membawa perubahan nyata bagi kehidupan warga kampung terpencil ini.',author:'Kontributor Lokal',av:'KL',date:'9 Mei 2025',read:'5 menit baca'},
  lw3:{cat:'Liputan Warga',title:'Perpustakaan Keliling di Desa: Satu Motor, Ratusan Buku, Ribuan Mimpi',lede:'Pak Darmawan sudah 12 tahun membawa buku ke pelosok desa dengan motor tuanya yang mulai sering mogok.',author:'Kontributor Lokal',av:'KL',date:'8 Mei 2025',read:'7 menit baca'},
};

const catInfo = {
  Berita:{desc:'Laporan peristiwa terkini dari berbagai penjuru dengan pendekatan jurnalistik yang bertanggung jawab.'},
  Opini:{desc:'Ruang bagi penulis, peneliti, dan warga untuk menyuarakan gagasan, kritik, dan refleksi.'},
  Budaya:{desc:'Cerita tentang seni, tradisi, identitas lokal, dan ekspresi budaya masyarakat.'},
  Komunitas:{desc:'Liputan gerakan, inisiatif, dan cerita dari berbagai komunitas yang membentuk masyarakat kita.'},
  Lingkungan:{desc:'Isu alam, perubahan iklim, dan keberlanjutan dari sudut pandang warga dan peneliti.'},
  Pendidikan:{desc:'Cerita dari ruang belajar: sekolah, kampus, komunitas, dan semua tempat ilmu tumbuh.'},
  'Liputan Warga':{desc:'Suara langsung dari lapangan: warga bercerita tentang kehidupan dan perjuangan mereka.'},
};

const aiResponses = {
  headline:['5 Alternatif Judul:\n1. Air di Ujung Tanduk: Ribuan Warga Pesisir Kehabisan Sumber\n2. Mata Air Mengering, Warga Bertahan: Laporan dari Pesisir Selatan\n3. Tiga Bulan Tanpa Air: Kisah dari Balik Krisis yang Tak Terliput\n4. Ketika Laut Ada di Mana-Mana Tapi Air Bersih Tak Ada\n5. Sumur Mengering, Harapan Tak Boleh Ikut Mengering'],
  summary:['Ringkasan: Lebih dari 12.000 kepala keluarga di lima kecamatan pesisir menghadapi krisis air bersih akibat penurunan debet air tanah hingga 70 persen.'],
  meta:['Meta Description (118 karakter):\n"Krisis air bersih di pesisir selatan memaksa ribuan warga tempuh jarak jauh setiap hari. Investigasi RuangWarta."'],
  tags:['Rekomendasi 8 Tag:\n\u2022 Air Bersih \u2022 Pesisir Selatan \u2022 Krisis Air \u2022 Lingkungan Hidup\n\u2022 Tambak Ilegal \u2022 Warga Terdampak \u2022 Investigasi \u2022 Kebijakan Daerah'],
  proofread:['\u2713 Ejaan dan tanda baca: Baik\n\u2713 Konsistensi gaya bahasa: Cukup baik\n\u26A0 Kalimat ke-3 paragraf 2: Terlalu panjang\n\u2713 Lead sudah kuat dan langsung ke inti'],
  caption:['Caption Instagram:\n"Tiga bulan. Jarak 2 km. Jeriken 20 liter. Itu rutinitas Bu Sumiyati setiap pagi hanya untuk mendapat air minum.\n\n#AirBersih #LingkunganHidup #RuangWarta"']
};
