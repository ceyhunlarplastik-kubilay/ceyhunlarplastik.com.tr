# Üretim Planlama — Demo ve Kullanım Kılavuzu

> **Kapsam:** branch `feature/production-planning` (Faz 1–5, 2026-09-25 → 2026-09-28). Tasarım ve kurallar
> [production-planning.md](production-planning.md)'de, dilim dilim uygulama notları [IMPROVEMENT_LOG.md](../IMPROVEMENT_LOG.md)'de.
> Bu dosya haftalık demo için: ne yapıldı, nasıl kanıtlanır, panel nasıl kullanılır, hangi örnek verilerle doldurulur.

## 1. Kısa yol haritası

| Faz | Ne getirdi | Nerede görülür |
|---|---|---|
| **1 · Tanımlar** | "Üretim Planlama" rolü ve `/uretim` paneli · alanlar, vardiya düzenleri (12/16/24 saat), makineler · kalıplar + göz grupları (aile kalıbı) + makine kartları + hammadde bilgisi · operatörler, takvim istisnaları, makine duruşları · kalıp ↔ makine uygunluk motoru | Tanımlar menüsü, Uyumluluk Matrisi |
| **2 · Emir + motor** | Üretim emirleri · planlama motoru (vardiya takvimi, süre, lotlara bölme) · "Öner" (hangi makinede ne zaman biter) · "Planla" (iş + vardiya lotları `1000-1, 1000-2…`) | Üretim Emirleri |
| **3 · Tahta + pano** | Planlama tahtası (Gantt) · sürükle-bırak / "Taşı" · bekleyen emirler paneli + "sonrakileri kaydır" · durum panosu (kanban) · vardiya ekibi · lotlar, notlar, QR etiket | Planlama Tahtası, Durum Panosu, Vardiya Ekibi, Lotlar |
| **4 · Saha** | Vardiya raporu (sağlam/fire, fire ve duruş nedenleri, kalıp sayacı) · planlanan ↔ gerçekleşen (tahmin, gecikme, kaydırma önerisi, kalıp bakımı) · canlı tahta (başka ekrandaki değişiklik anında gelir) · kalıcı bildirimler (zil) | Vardiya Raporu, tahta uyarıları, zil, "Canlı" göstergesi |
| **5 · İstatistik** | Ürün geçmişi · makine kullanımı ve OEE · kalıp istatistikleri + makine kartına çevrim önerisi · hepsinde Excel | Analiz menüsü |

Ertelenen: 4.1 operatör hesapları (kullanıcı kararı; şimdilik planlayıcı girer). Faz 6 isteğe bağlı (otomatik planlayıcı, sayaç entegrasyonu…).

## 2. Nasıl yapıldı — demoda söylenecekler

- **Dilim dilim:** her adımda kısa plan → onay → kod → test → yerel veritabanında gerçek veriyle deneme → telefon + masaüstü görsel kontrol → günlük (LOG) notu. 21 dilim, her birinin tarihli notu LOG'da.
- **Kurallar tek yerde:** vardiya takvimi, süre hesabı, uygunluk, tahmin, bakım, OEE, çevrim önerisi… hepsi `packages/core/src/core/helpers/production/` altında saf (veritabanına dokunmayan) ve testli modüller. Form ile sunucu AYNI fonksiyonu çağırır → ekrandaki önizleme ile kaydedilen sonuç ayrışmaz.
- **Güvenli yazma:** plan sunucuda her zaman yeniden hesaplanır (tarayıcıya güvenilmez); iki planlayıcı aynı işi taşırsa ikincisi "plan değişti" (409) alır; toplu yazmalar tek işlemde.
- **Canlı ve izlenebilir:** her yazma diğer açık ekranları ~1 sn'de tazeler; her durum değişikliği geçmişe yazılır; gecikme / termin / bakım uyarıları zile düşer.
- **Rakamlar:** üretime özel **410 test** (core 166 · functions 139 · frontend 105); tüm repo core 871 · functions 607 · frontend 517 test yeşil. **7 migration**, hepsi yalnız ekleme (mevcut tablolara dokunulmadı).

**Kanıtı canlı gösterme (1 dk):**

```bash
cd packages/core && npx vitest run src/core/helpers/production
# → 26 test dosyası, 166 test geçti (planlama motoru, tahmin, OEE, çevrim önerisi…)
```

Bölüm 6'daki örnek verilerin sonuçları (uygunluk matrisi, E1 süresi, OEE, çevrim önerisi, bakım) bu motorlardan geçirilerek önceden hesaplandı; ekranda aynı sayılar görünmeli.

## 3. Demo öncesi hazırlık (kubi)

1. **Migration + ortam:**
   `npx sst shell --stage kubi --target Prisma -- bash -lc "cd packages/core && npx prisma migrate deploy"`,
   sonra `export AWS_PROFILE=ceyhunlar-prod && npx sst dev --stage kubi`.
2. **Rol:** admin panelinde **Kullanıcılar** → demo kullanıcısına rol **Üretim planlama** → çıkış / giriş → kullanıcı doğrudan `/uretim`'e düşer.
3. **İç üretim tedarikçisi:** admin panelinde **Tedarikçiler** → "Ceyhunlar Üretim" → **Kendi üretimimiz (iç üretim)** kutusunu işaretleyin. İşaretlenene kadar üretim panelindeki ürün / ölçü seçicileri BOŞ gelir: yalnız bu tedarikçiye bağlı varyantlar üretime alınır.
4. **Örnek veriler:** Bölüm 6'daki sırayla girin (≈ 40 dk). Kalıp ve emirler için katalogda **iç üretim tedarikçisine bağlı varyantı olan 3 ürün modeli** seçin (aşağıda "Ürün A / B / C").
5. **Geçmiş vardiya raporları:** Bölüm 6.9 — istatistik ekranları bunlarla dolar.
6. **E4'ü toplantıdan ~2 saat önce planlayın ve başlatmayın** (6.8) → toplantıda "Başlamadı" uyarısı görünür.
7. **Zil (isteğe bağlı):** kubi `.env`'e `PRODUCTION_ALERTS_ENABLED="true"`, sst dev'i yeniden başlatın (tarama 5 dk'da bir). Demo bitince satırı silin (Neon boşuna uyanmasın).
8. **Canlı güncelleme için:** tarayıcıda iki pencere (ya da iki kullanıcı) açık tutun.

## 4. Demo akışı (~20 dk)

| # | Ekran | Yapılacak | Gösterilecek nokta |
|---|---|---|---|
| 1 | Genel Bakış `/uretim` | Menüyü gezin | Ayrı rol, ayrı panel; modüller faz faz |
| 2 | Makineler, Kalıplar | K-102'yi açın | Aile kalıbı (2 ürün modeli), makine kartı, bakım sayacı |
| 3 | Uyumluluk Matrisi | Hücrelere tıklayın | K-101 × M-01 ✗ tonaj · K-103 × M-02 ✗ kalıp kalınlığı (ince kalıp, ara plaka gerekir) · K-102 × M-03 ✗ robot · K-101 × M-03 ⚠ baskı kapasitesi + bilezik · ★ tercih edilen makine |
| 4 | Üretim Emirleri | E2 → **Öner** | Adaylar: bitiş, termin, maliyet; elenen makineler ve nedenleri → **Planla** → lotlar `kök-1, kök-2…` |
| 5 | Planlama Tahtası | E3'ü bekleyen emirlerden M-02 satırına, E2'nin başladığı yere sürükleyin (kip: **Sonrakileri kaydır**) | Uygun satır yeşil / uyarı sarı / engel kırmızı; E2 arkaya kayar; 29 Ekim tatili ve M-03 bakımı taralı |
| 6 | Tahta — 2. pencere | Bir işi taşıyın | Diğer pencere ~1 sn'de kendini tazeler ("Canlı") |
| 7 | Tahta — uyarılar | E4'e ve E1'e tıklayın | E4 ⚠ "Başlamadı"; E1 ilerleme %66 (3.360 / 5.103 baskı), tahmini bitiş; K-101 🔧 bakım (iş gecikseydi "Sonraki işleri tahmini bitişe kaydır" çıkardı) |
| 8 | Zil | Zili açın | "Başlamadı · İş …", "Bakım yaklaşıyor · K-101 · planlı işlerle aşılacak" → tıklayınca ilgili ekran |
| 9 | Durum Panosu | E4: Sahaya verildi → Kalıp bağlanıyor → Üretimde | Yalnız izinli geçişler; sahaya verilen iş tahtada kilitli |
| 10 | Vardiya Ekibi + Lotlar | Ekibi **Kopyala**; E4'ün ilk lotuna not + QR **Etiket** | Lot ekibi vardiyadan gelir; etiket yazdırılır |
| 11 | Vardiya Raporu | E4'ün ilk lotuna **Rapor gir** (bitiş = şimdi) | Sağlam/fire, fire nedeni, duruş; lot kapanır, sıradaki başlar, K-103 sayacı artar |
| 12 | Analiz → Ürün Geçmişi | Ürün A | Üretim başına satır, gerçek 22,5 ↔ plan 20 sn (+%12,5), Excel |
| 13 | Analiz → Makine Kullanımı ve OEE | Son 7 gün | M-02: OEE %81,7 (Orta) = %93,3 × %88,9 × %98,4; duruş nedenleri; zaman dağılımı grafiği |
| 14 | Analiz → Kalıp İstatistikleri | K-101 → **Karta uygula: 22,5 sn** | Öneri otomatik yazılmaz; onayla karta yazılır, öneri kalkar; Kalıplar sayfasında M-02 kartı 22,5 sn |

## 5. Kullanım kılavuzu (panele giren kullanıcı için)

**Önce bir kez (Tanımlar):**
- **Vardiya ve Takvim** — **Yeni Düzen** → hazır şablon (Günde 24 saat · 3 × 8 …) → günleri düzeltin. İlk düzen varsayılan olur. Aşağıdaki takvimde **Yeni Kayıt** ile bayram / toplu izin / ek mesai günlerini aralık olarak girin (fabrika, alan ya da makine için).
- **Parkur ve Alanlar** — **Yeni Alan**, alanın vardiya düzenini seçin. Düzen şu sırayla bulunur: makinede seçiliyse o, yoksa alanınki, o da yoksa **varsayılan** düzen. Alanda ya da makinede bir düzen seçiliyse varsayılanı değiştirmek o makineleri ETKİLEMEZ; tüm fabrikayı tek düzenle çalıştıracaksanız alanda "Varsayılan düzen" bırakın. Makineler sayfasındaki "Vardiya düzeni" sütunu her makinenin kullandığı düzeni ve nereden geldiğini (Makine / Alandan / Varsayılan) gösterir. Düzen değişince zaten planlanmış işler kendiliğinden yeniden planlanmaz; tahtada **Taşı** ile yeniden planlanır.
- **Makineler** — **Yeni Makine**; teknik değerleri föyden girin (tonaj, kolonlar arası, kalıp kalınlığı, strok, baskı kapasitesi…). Eksik değer planı kilitlemez, "doğrulanamadı" der. Sayfanın altındaki **Duruşlar**: planlı bakım / arıza pencereleri — planlama bu saatleri atlar.
- **Kalıplar** — **Yeni Kalıp**; göz grupları: ürün modeli → ölçü → göz sayısı (farklı ürün modelleri = aile kalıbı). Makine kartları: o makinede kanıtlanmış çevrim / bağlama süresi, tercih veya engel. Bakım aralığı + sayaç; bakım yapılınca **Bakım yapıldı**.
- **Hammadde Bilgisi** — çevrim katsayısı (ör. ABS 1,15), kurutma.
- **Operatörler** — **Yeni Operatör** (personel kaydı; giriş hesabı değildir).
- **Duruş ve Fire Nedenleri** — **Varsayılanları ekle** ile 12 duruş + 10 fire nedeni gelir.
- **Uyumluluk Matrisi** — hangi kalıp hangi makineye uyar; hücre ayrıntısı nedenini söyler.

**Her gün:**
- **Üretim Varyantları** (Tanımlar) — kendi ürettiğimiz varyantların listesi. Kalem düğmesiyle varyanta özel **çevrim süresi** girilir; boş kaydedilirse kaldırılır. Planlamada sıra: emirdeki elle çevrim → kalıbın makine kartı → varyant çevrimi → kalıbın standart çevrimi × hammadde katsayısı. Öner'de çevrimin altında kaynağı yazar ("varyanttan").
- **Üretim Emirleri** — **Yeni Emir**: varyant, sağlam adet, termin, öncelik. Satırdaki **Öner** makine/zaman adaylarını gösterir, **Planla** işi ve vardiya lotlarını yazar. **Çalışma süresi** makinenin fiilen çalışacağı süredir (bağlama + baskı × çevrim ÷ verim, saat olarak); altındaki **takvimde N gün**, işin geceler ve çalışılmayan saatler dahil kaç fabrika gününe yayıldığıdır — günde 12 saat çalışan makinede 34 saatlik iş takvimde 3 gün tutar.
- **Planlama Tahtası** — makine satırları, gün/vardiya ekseni. Planlı işi sürükleyerek taşıyın (ya da iş ayrıntısında **Taşı**). Sağdaki bekleyen emirleri makine satırına sürükleyin ya da **Öner**. Üstteki kip: çakışmada "İlk boşluğa koy" / "Sonrakileri kaydır". ⚠ gecikme / termin, 🔧 bakım işaretleri; iş ayrıntısında tahmin ve kaydırma önerisi.
- **Durum Panosu** — kartı sütunlar arasında sürükleyin: Planlandı ⇄ Sahaya verildi → Kalıp bağlanıyor → Üretimde ⇄ Duraklatıldı → Tamamlandı (tamamlamada sağlam / fire sorulur). Sahaya verilen iş tahtada kilitlenir.
- **Vardiya Ekibi** — gün seçin, makine × vardiya hücresine operatör atayın; **Kopyala** ile başka günlere aktarın.
- **Vardiya Raporu** — gün seçin; lotta **Başlat**, vardiya sonunda **Rapor gir**: başlangıç/bitiş, çıktı başına sağlam + fire (+ fire nedenleri), duruşlar (neden + dk), isteğe bağlı baskı ve devir notu. Rapor lotu kapatır, sıradakini başlatır, kalıp sayacını artırır. Yanlışsa **Düzelt**.
- **Lotlar** — lot ara (`1000-2`), ayrıntıda ekip, notlar (kalite / bakım / devir…), QR'lı **Etiket** yazdır.

**Analiz:**
- **Ürün Geçmişi** — ürün modeli → ölçü → versiyon: her üretim, adet, fire, gerçek ↔ plan çevrim, Excel.
- **Makine Kullanımı ve OEE** — alan + tarih: vardiya süresinin dağılımı, duruş nedenleri, OEE ve bileşenleri, Excel.
- **Kalıp İstatistikleri** — sayaç/bakım, gerçek çevrim; öneri varsa kalıp ayrıntısında **Karta uygula**, Excel.

Ekranların süzgeçleri adres satırındadır: bağlantıyı paylaşan aynı görünümü açar. Zil üretim uyarılarını gösterir; "Canlı" yeşilken başka ekrandaki değişiklik kendiliğinden gelir.

## 6. Örnek veriler (girme sırası)

> Teknik değerler **örnektir**; gerçek makine / kalıp föyleriyle düzeltin. Kişi adları kurgudur.

### 6.1 Hammadde bilgisi (katalogdaki hammaddelere)

| Hammadde | Aile | Yoğunluk | Kurutma | Çevrim katsayısı |
|---|---|---|---|---|
| PP | PP | 0,905 | yok | 1,00 |
| ABS | ABS | 1,05 | 80 °C · 3 sa | 1,15 |
| PA6 | PA6 | 1,13 | 80 °C · 4 sa | 1,20 |

### 6.2 Vardiya düzenleri ve takvim

| Düzen | Şablon | Günler | Varsayılan |
|---|---|---|---|
| 3 × 8 (24 saat) | Günde 24 saat · 3 × 8 (A 08–16, B 16–24, C 00–08) | Pzt–Cmt | ✓ |
| 2 × 8 (16 saat) | Günde 16 saat · 2 × 8 (A 08–16, B 16–24) | Pzt–Cum | |

Takvim (**Yeni Kayıt**): **29.10.2026 · Resmî tatil · fabrika** ("Cumhuriyet Bayramı") · **01.11.2026 (Pazar) · Ek mesai · P1**.

### 6.3 Alanlar

| Kod | Ad | Alanın vardiya düzeni |
|---|---|---|
| P1 | Pres Holü 1 | 3 × 8 (24 saat) |
| P2 | Pres Holü 2 | 2 × 8 (16 saat) |

Not: alana düzen seçildiği için bu alanlardaki makineler varsayılan düzen değişikliğinden etkilenmez. Tek düzenle çalışacaksanız alanlarda "Varsayılan düzen" seçin.

### 6.4 Makineler

| Kod | Ad | Alan | Tonaj | Kolonlar arası Y×D (mm) | Kalıp kalınlığı (mm) | Strok | Plaka açıklığı | Baskı kap. (PS g) | Vida Ø | Bilezik Ø | Sıcak yolluk | Maça | Robot | Verim | Saat maliyeti |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M-01 | Arburg 320 C | P1 | 50 | 320×320 | 200–350 | 350 | 550 (hidrolik) | 70 | 25 | 125 | 0 | 0 | yok | %85 | 450 TRY |
| M-02 | Engel e-mac 180/100 | P1 | 100 | 470×420 | 250–550 | 450 | — (dizlili) | 150 | 35 | 125 | 2 | 1 | var | %85 | 600 TRY |
| M-03 | Haitian Mars 250 | P2 | 250 | 570×570 | 220–570 | 540 | — | 480 | 50 | 160 | 4 | 2 | yok | %80 | 750 TRY |

Makine duruşu (Makineler → Duruşlar): **M-03 · Planlı bakım · yarın 10:00–14:00 · "Hidrolik yağ değişimi"**.

### 6.5 Kalıplar

| Kod | Ad | Göz grupları (parça ağırlığı) | Std. çevrim | Gerekli tonaj | G×Y×K (mm) | Açılma | Sıcak yolluk / maça / robot | Bilezik | Yolluk | Beklenen fire | Bağlama | Sayaç / bakım aralığı |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| K-101 | Tapa kalıbı | Ürün A · ölçü A1 · **4 göz** (8 g) | 20 sn | 60 t | 300×300×250 | 200 | 0 / 0 / hayır | 125 | 6 g | %2 | 45 dk | **95.000** / 100.000 |
| K-102 | Aile kalıbı | Ürün A · ölçü A2 · 2 göz (12 g) · Ürün B · ölçü B1 · 2 göz (10 g) | 24 sn | 90 t | 400×350×300 | 250 | 2 / 1 / evet | 125 | 10 g | %3 | 60 dk | 40.000 / 150.000 |
| K-103 | Kapak kalıbı | Ürün C · ölçü C1 · **8 göz** (3 g) | 15 sn | 40 t | 250×250×220 | 180 | 0 / 0 / hayır | 125 | 4 g | %1,5 | 30 dk | 12.000 / 80.000 |

Makine kartları: **K-101 → M-02** (tercih ✓, çevrim BOŞ — demoda öneriyle dolacak) · **K-102 → M-02** (tercih ✓, çevrim 24 sn) · **K-103 → M-01** (tercih ✓).

Beklenen Uyumluluk Matrisi (motorla doğrulandı):

| | M-01 | M-02 | M-03 |
|---|---|---|---|
| **K-101** | ✗ kapama kuvveti | ✓ ★ | ⚠ baskı ağırlığı, bilezik |
| **K-102** | ✗ tonaj, kolonlar, maça, robot | ✓ ★ | ✗ robot |
| **K-103** | ✓ ★ | ✗ kalıp kalınlığı | ⚠ baskı ağırlığı, bilezik |

### 6.6 Operatörler

1001 Ahmet Yılmaz · 1002 Mehmet Kaya · 1003 Ayşe Demir · 1004 Ali Çelik · 1005 Zeynep Şahin.
Vardiya ekibi (bugün, sonra **Kopyala** ile 5 gün): M-02 A Ahmet, B Mehmet, C Ayşe · M-01 A Ali, B Zeynep.

### 6.7 Duruş ve fire nedenleri

**Varsayılanları ekle** (D01–D12 duruş, F01–F10 fire).

### 6.8 Üretim emirleri

| Emir | Varyant | Sağlam adet | Termin | Öncelik | Nasıl planlanır |
|---|---|---|---|---|---|
| E1 | Ürün A · A1 · V1 (ör. Siyah · **PP**) | 20.000 | bugün + 4 gün | Yüksek | Hazırlıkta: Öner → **K-101 · M-02** → Planla (5.103 baskı; Öner'de **Çalışma süresi 34 sa 6 dk** → 3 × 8 düzende 5–6 vardiya lotu) |
| E2 | Ürün A · A2 · V1 | 6.000 | bugün + 7 gün | Normal | Demoda: Öner → **K-102 · M-02** → Planla (E1'in arkasına) |
| E3 | Ürün B · B1 · V1 | 6.000 | bugün + 7 gün | Normal | Demoda: tahtaya sürükleyin |
| E4 | Ürün C · C1 · V1 | 50.000 | bugün + 10 gün | Düşük | Toplantıdan ~2 saat önce: Öner → **K-103 · M-01** → Planla; başlatmayın |

E1'de hammaddesi **PP** (çevrim katsayısı 1,00) olan bir versiyon seçin ve emirde elle çevrim girmeyin: plan çevrimi 20 sn kalır, aşağıdaki beklenen sayılar tutar. Başka hammaddede plan çevrimi katsayıyla değişir (ör. ABS 23 sn).

### 6.9 Geçmiş vardiya raporları (istatistikler bunlarla dolar)

1. **Durum Panosu:** E1 işini **Sahaya verildi**'ye taşıyın (rapor için yeterli; ilk rapor işi kendiliğinden **Üretimde**'ye alır). Lotu önce başlatmak gerekmez.
2. **Lotlar** → E1'in lotları (`kök-1`, `kök-2`, `kök-3`) → **Rapor gir**. Başlangıç / bitişi son iş gününün **geçmiş** vardiyalarına çekin (bitiş gelecekte olamaz; plan saatinden önce olması sorun değil):

| Lot | Başlangıç → bitiş | Baskı | Sağlam / fire | Fire nedenleri | Duruşlar |
|---|---|---|---|---|---|
| kök-1 | dün 08:00 → 16:00 | 1.120 | 4.400 / 80 | F01 Çapak 50 · F02 Eksik baskı 30 | D09 Mola / yemek 30 dk · D01 Kalıp arızası 30 dk |
| kök-2 | dün 16:00 → 24:00 | 1.120 | 4.420 / 60 | F01 Çapak 40 · F09 İlk baskı 20 | D09 30 dk · D04 Malzeme bekleme 30 dk |
| kök-3 | bugün 00:00 → 08:00 | 1.120 | 4.410 / 70 | F02 Eksik baskı 40 · F06 Ölçü dışı 30 | D09 30 dk · D10 Kalite ayarı 30 dk |

**Beklenen sonuçlar** (motorla hesaplandı; "neden bu sayı?" sorusunun cevabı):
- Gerçek çevrim = (480 − 60) dk × 60 ÷ 1.120 baskı = **22,5 sn**; plan 20 sn → **+%12,5**.
- OEE (M-02): kullanılabilirlik 1.260 ÷ (1.440 − 90) = **%93,3** · performans (20 sn × 3.360) ÷ 1.260 dk = **%88,9** · kalite 13.230 ÷ 13.440 = **%98,4** → **OEE %81,7 (Orta)**.
- Kalıp İstatistikleri: K-101 × M-02, 3 vardiya, kart boş → planla karşılaştırılır, %12,5 fark → **Karta uygula: 22,5 sn** (eşik: 3 vardiya + %5).
- K-101 sayaç 95.000 + 3.360 = 98.360 → **Bakım yaklaşıyor**; E1'in kalan 1.743 baskısıyla 100.000'i aşar → **"planlı işlerle aşılacak"** (zilde "Bakım yaklaşıyor · K-101"). Demo sonunda Kalıplar'da **Bakım yapıldı** ile sıfırlanır.
- Ürün Geçmişi (Ürün A · A1): 1 üretim, "Üretimde" rozeti, 13.230 sağlam / 210 fire (%1,6).

## 7. Prod'a çıkış (özet)

1. Kubi'de Faz 1–5 doğrulandıktan sonra.
2. Prod RDS'e **önce 7 migration** (VPC tüneli, README "Database Migrations on a Deployed Stage"):
   `20260925120000_add_production_master_data` · `20260925190000_add_production_machine_max_daylight` ·
   `20260926090000_add_production_orders` · `20260926120000_add_production_jobs_and_lots` ·
   `20260926150000_add_production_shift_assignments_and_lot_notes` · `20260928100000_add_production_shift_reports` ·
   `20260928160000_add_production_alert_notification_type`.
3. `npx sst diff --stage prod` (yalnız gösterir) → deploy. Prod'da uyarı taraması 15 dk'da bir kendiliğinden çalışır.
4. Deploy öncesi IMPROVEMENT_PLAN'daki iki üretim dışı not: PageHero banner'ı kodda yorumda; P2.7 Node 24 geçişi henüz prod'da değilse bu deploy onu da götürür.
