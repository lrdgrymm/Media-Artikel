-- =============================================
-- RuangWarta Database Schema for Supabase
-- =============================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 2. ARTICLES
CREATE TABLE IF NOT EXISTS articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  lede text DEFAULT '',
  body text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_name text DEFAULT '',
  author_avatar text DEFAULT '',
  image_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  views integer DEFAULT 0,
  read_time text DEFAULT '5 menit baca',
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Categories: public read, auth write
CREATE POLICY "cat_select" ON categories FOR SELECT USING (true);
CREATE POLICY "cat_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "cat_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "cat_delete" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Articles: public read published, auth full access
CREATE POLICY "art_select" ON articles FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "art_insert" ON articles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "art_update" ON articles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "art_delete" ON articles FOR DELETE USING (auth.role() = 'authenticated');

-- 4. INCREMENT VIEWS FUNCTION (bypasses RLS)
CREATE OR REPLACE FUNCTION increment_views(article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE articles SET views = views + 1 WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SEED CATEGORIES
INSERT INTO categories (name, slug, description) VALUES
('Berita', 'berita', 'Laporan peristiwa terkini dari berbagai penjuru dengan pendekatan jurnalistik yang bertanggung jawab.'),
('Opini', 'opini', 'Ruang bagi penulis, peneliti, dan warga untuk menyuarakan gagasan, kritik, dan refleksi.'),
('Budaya', 'budaya', 'Cerita tentang seni, tradisi, identitas lokal, dan ekspresi budaya masyarakat.'),
('Komunitas', 'komunitas', 'Liputan gerakan, inisiatif, dan cerita dari berbagai komunitas.'),
('Lingkungan', 'lingkungan', 'Isu alam, perubahan iklim, dan keberlanjutan dari sudut pandang warga dan peneliti.'),
('Pendidikan', 'pendidikan', 'Cerita dari ruang belajar: sekolah, kampus, komunitas, dan semua tempat ilmu tumbuh.'),
('Liputan Warga', 'liputan-warga', 'Suara langsung dari lapangan: warga bercerita tentang kehidupan mereka.'),
('Esai', 'esai', 'Tulisan mendalam yang mengajak pembaca merenungkan isu-isu penting.');

-- 6. SEED ARTICLES
INSERT INTO articles (title, slug, lede, body, category_id, author_name, author_avatar, status, is_featured, tags, views, read_time, published_at) VALUES
(
  'Krisis Air di Pesisir Selatan: Ketika Warga Harus Pilih Antara Minum dan Mandi',
  'krisis-air-pesisir-selatan',
  'Ribuan warga di lima kecamatan pesisir kini menghadapi krisis air bersih yang makin parah seiring mundurnya muka air tanah.',
  '<p>Sudah tiga bulan terakhir, Ibu Sumiyati (58) harus bangun pukul empat pagi hanya untuk mendapatkan air. Bukan dari keran rumahnya—sudah lama itu kering—melainkan dari mata air yang jaraknya dua kilometer dari tempat tinggalnya di Dusun Pantai Rejo, Kecamatan Pasir Kidul.</p><blockquote>"Dulu tinggal buka keran, sekarang harus jalan jauh. Kalau hujan baru ada air, kalau tidak ya begini terus," ujar Sumiyati.</blockquote><h2>Krisis yang Tak Terdokumentasi</h2><p>Persoalan yang dialami Sumiyati bukan pengecualian. Di lima kecamatan pesisir yang membentang sepanjang 47 kilometer garis pantai, setidaknya 12.400 kepala keluarga menghadapi masalah yang sama.</p><h2>Faktor Penyebab yang Berlapis</h2><p>Para ahli menunjuk pada kombinasi beberapa faktor: perluasan tambak yang menyedot air tanah, deforestasi di kawasan hulu, hingga peningkatan konsumsi akibat pertumbuhan populasi.</p>',
  (SELECT id FROM categories WHERE slug='lingkungan'), 'Sari Dewanti', 'SD', 'published', true,
  ARRAY['Air Bersih','Pesisir','Lingkungan','Krisis'], 4821, '8 menit baca', now() - interval '1 day'
),
(
  'Pasar Tradisional Terakhir di Pusat Kota Hadapi Ancaman Pembangunan Mall',
  'pasar-tradisional-terakhir',
  'Pedagang yang sudah berjualan puluhan tahun kini was-was setelah investor besar melirik lahan pasar.',
  '<p>Pasar Sentral yang sudah berdiri sejak tahun 1960-an kini terancam digusur untuk pembangunan pusat perbelanjaan modern.</p><p>Lebih dari 200 pedagang kecil bergantung pada pasar ini setiap hari untuk menafkahi keluarga mereka.</p>',
  (SELECT id FROM categories WHERE slug='komunitas'), 'Adi Pratama', 'AP', 'published', false,
  ARRAY['Pasar','Tradisional','Pembangunan'], 1204, '5 menit baca', now() - interval '2 days'
),
(
  'Sekolah Satu Atap di Perbatasan: Satu Guru untuk Enam Kelas',
  'sekolah-satu-atap-perbatasan',
  'Di pelosok perbatasan, seorang guru mengabdi sendirian mengajar dari kelas satu hingga enam.',
  '<p>Pak Darto sudah 15 tahun mengajar sendirian di sekolah satu atap ini. Setiap hari ia harus berpindah dari satu kelas ke kelas lain.</p>',
  (SELECT id FROM categories WHERE slug='pendidikan'), 'Lilis Handayani', 'LH', 'published', false,
  ARRAY['Pendidikan','Perbatasan','Guru'], 876, '7 menit baca', now() - interval '2 days'
),
(
  'Mengapa Subsidi Bahan Bakar Bukan Solusi Energi Jangka Panjang',
  'subsidi-bahan-bakar-bukan-solusi',
  'Ketergantungan pada subsidi BBM justru memperlambat transisi energi bersih yang sudah mendesak.',
  '<p>Setiap tahun, pemerintah mengalokasikan ratusan triliun rupiah untuk subsidi bahan bakar fosil. Angka yang terus membengkak ini menimbulkan pertanyaan: sampai kapan?</p>',
  (SELECT id FROM categories WHERE slug='opini'), 'Prof. Budi Santoso', 'BS', 'published', false,
  ARRAY['Energi','Subsidi','Opini'], 654, '6 menit baca', now() - interval '2 days'
),
(
  'Hutan Mangrove Terancam: 40% Kawasan Pesisir Rusak Akibat Tambak Ilegal',
  'hutan-mangrove-terancam',
  'Riset terbaru menunjukkan kerusakan yang jauh lebih parah dari perkiraan awal.',
  '<p>Penelitian kolaboratif antara Universitas Maritim dan LSM lingkungan mengungkap fakta mengejutkan tentang kondisi hutan mangrove di pesisir selatan.</p>',
  (SELECT id FROM categories WHERE slug='lingkungan'), 'Yanti Kusuma', 'YK', 'published', false,
  ARRAY['Mangrove','Pesisir','Lingkungan'], 987, '5 menit baca', now() - interval '3 days'
),
(
  'DPRD Kota Gelar Rapat Darurat Soal Anggaran Infrastruktur yang Tersendat',
  'dprd-rapat-darurat-anggaran',
  'Sembilan proyek pembangunan jalan dihentikan sementara karena menunggu pencairan anggaran.',
  '<p>Ketua Komisi D DPRD Kota mengakui bahwa keterlambatan pencairan dana telah berdampak signifikan terhadap pembangunan infrastruktur.</p>',
  (SELECT id FROM categories WHERE slug='berita'), 'Rahmat Hakim', 'RH', 'published', false,
  ARRAY['DPRD','Anggaran','Infrastruktur'], 2103, '4 menit baca', now() - interval '3 days'
),
(
  'Festival Seni Lokal Kembali Hadir: Puluhan Seniman Muda Pamerkan Karyanya',
  'festival-seni-lokal-kembali',
  'Setelah tiga tahun vakum, festival ini kembali menjadi ruang ekspresi bagi komunitas seni lokal.',
  '<p>Lebih dari 40 seniman muda dari berbagai disiplin seni memamerkan karya mereka di Festival Seni Rupa Lokal yang kembali digelar setelah tiga tahun absen.</p>',
  (SELECT id FROM categories WHERE slug='budaya'), 'Dewi Anggraini', 'DA', 'published', false,
  ARRAY['Festival','Seni','Budaya'], 1876, '6 menit baca', now() - interval '3 days'
),
(
  'Kota Pintar tanpa Warga Cerdas: Ironi Digitalisasi yang Tak Merata',
  'kota-pintar-tanpa-warga-cerdas',
  'Program smart city menghabiskan miliaran rupiah, namun masih banyak warga yang belum bisa mengakses internet.',
  '<p>Di balik gemerlapnya program smart city, realita di lapangan menunjukkan kesenjangan digital yang masih sangat lebar.</p>',
  (SELECT id FROM categories WHERE slug='opini'), 'Mirna Sanjaya', 'MS', 'review', false,
  ARRAY['Smart City','Digital','Opini'], 0, '7 menit baca', NULL
),
(
  'Belajar dari Desa: Kenapa Kota Justru Perlu Meniru Gotong Royong',
  'belajar-dari-desa-gotong-royong',
  'Di saat urbanisasi mengikis solidaritas, desa-desa kecil justru membuktikan nilai-nilai komunal masih bisa diandalkan.',
  '<p>Urbanisasi telah menciptakan masyarakat yang individualistis. Namun di desa-desa kecil, semangat gotong royong masih hidup dan justru menjadi kekuatan utama.</p>',
  (SELECT id FROM categories WHERE slug='esai'), 'Hendra Wijaya', 'HW', 'published', false,
  ARRAY['Desa','Gotong Royong','Esai'], 432, '8 menit baca', now() - interval '4 days'
),
(
  'Media Lokal di Titik Kritis: Antara Bertahan dan Bermartabat',
  'media-lokal-titik-kritis',
  'Tekanan ekonomi dan konsolidasi media mengancam keberagaman informasi yang dijaga media lokal.',
  '<p>Satu per satu media lokal berguguran. Yang tersisa harus berjuang keras antara menjaga idealisme dan bertahan hidup secara ekonomi.</p>',
  (SELECT id FROM categories WHERE slug='opini'), 'Fitri Amaliah', 'FA', 'published', false,
  ARRAY['Media','Jurnalisme','Opini'], 321, '6 menit baca', now() - interval '5 days'
),
(
  'Kisah Bu Siti: Bertahan Jadi Petani Garam di Tengah Gempuran Impor',
  'kisah-bu-siti-petani-garam',
  'Tiga generasi keluarga Siti bergantung pada ladang garam yang kini terancam kebijakan impor.',
  '<p>Setiap pagi pukul lima, Bu Siti sudah berada di ladang garamnya. Tradisi yang sudah berlangsung tiga generasi ini kini terancam oleh kebijakan impor garam.</p>',
  (SELECT id FROM categories WHERE slug='liputan-warga'), 'Kontributor Lokal', 'KL', 'published', false,
  ARRAY['Petani','Garam','Warga'], 543, '6 menit baca', now() - interval '5 days'
),
(
  'Kampung Digital: Ketika Ibu-Ibu PKK Belajar Jualan Online dari Nol',
  'kampung-digital-pkk-online',
  'Program pelatihan ekonomi digital membawa perubahan nyata bagi kehidupan warga kampung terpencil.',
  '<p>Awalnya mereka ragu, bahkan takut memegang smartphone. Kini, ibu-ibu PKK di Kampung Mekar sudah mahir berjualan online.</p>',
  (SELECT id FROM categories WHERE slug='liputan-warga'), 'Kontributor Lokal', 'KL', 'published', false,
  ARRAY['Digital','PKK','Warga'], 387, '5 menit baca', now() - interval '6 days'
),
(
  'Perpustakaan Keliling di Desa: Satu Motor, Ratusan Buku, Ribuan Mimpi',
  'perpustakaan-keliling-desa',
  'Pak Darmawan sudah 12 tahun membawa buku ke pelosok desa dengan motor tuanya.',
  '<p>Motor Honda Supra tahun 2008 itu sudah berkali-kali mogok. Tapi Pak Darmawan tidak pernah menyerah membawa buku-buku ke pelosok desa.</p>',
  (SELECT id FROM categories WHERE slug='liputan-warga'), 'Kontributor Lokal', 'KL', 'draft', false,
  ARRAY['Perpustakaan','Desa','Pendidikan'], 0, '7 menit baca', NULL
);
