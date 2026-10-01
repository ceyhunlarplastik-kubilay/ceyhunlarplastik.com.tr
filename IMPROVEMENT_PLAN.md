# Improvement Plan

Bu dosya **yalnızca açık (henüz yapılmamış) işleri** tutar. Tamamlanan dilimlerin
tarihli uygulama notları [IMPROVEMENT_LOG.md](IMPROVEMENT_LOG.md)'de — kronolojik
arşiv, projenin hafızası. Bir dilim bitince: maddesi buradan çıkar, uygulama notu
(ne yapıldı / neden / nasıl doğrulandı / ne kaldı) LOG'a eklenir.

**Son güncelleme:** 2026-08-29 (PLAN/LOG ayrımı). Çıkış noktası 2026-07-07 denetimi;
o günden bugüne **P0 6/6** ve **P1 8/8** kapandı, **P2'nin çoğu** tamam (P2.1/2.6
tamam+deploy; P2.4-A/B deploy edildi; P2.7 kod commit'li, API Lambda deploy'u kaldı).
Aşağıdakiler kalan iştir. Detaylı tarihçe ve kapanmış maddeler için LOG'a bak.

Çalışma düzeni değişmedi: işler dilim dilim yürür, her dilim öncesi kısa plan +
onay; kod değişikliğini ajan yapar, commit/push/deploy kullanıcıda (bkz.
[CLAUDE.md](CLAUDE.md)).

---

## Açık İşler

### Audit logging (denetim kaydı) — yayılım · kapsam: büyük, dilim dilim *(kullanıcı talebiyle, 2026-09-30; "backend API açıkları" işinin ilk adımı)*
- **Yapıldı (LOG, 2026-09-30):** Dilim 1 — `AuditLog` tablosu + çekirdek (`core/helpers/audit`) + `Category`'nin
  tüm API yazma yolları (oluştur / güncelle / sil / tedarikçi kategori talebi onayı). Dilim 2 —
  `GET /audit-logs` + kategori dialogunda "Değişiklik Geçmişi" sekmesi. Kubi doğrulaması kullanıcıda
  (aşağıda "Kullanıcıda Bekleyen Adımlar").
- **Kararlar (kullanıcı, 2026-09-30):** modelden bağımsız tek `AuditLog` tablosu · denetlenen modele
  `createdBy` / `updatedBy` kolonu EKLENMEZ, bilgi log'dan türetilir (gerekçe AGENTS.md'de) · geçmişi
  yalnız admin / owner görür.
- **Sıradaki dilimler (her biri ayrı onayla):**
  1. **Kategori görselleri — `Asset`.** Bugün görsel ekleme / silme / rol değişimi geçmişte GÖRÜNMEZ.
     Kapsam: `POST|PUT|DELETE /assets`, `POST /categories/assets/presign` (PENDING satır),
     `POST|PUT /categories` içindeki satır içi görsel yazımı, `confirmCategoryAssetUpload` (S3 olayı —
     insan aktörü bilmez: yükleyen, presign anında satıra damgalanmalı, onay `SYSTEM` aktörle yazılmalı).
     Tasarım kararı: `Asset` altı farklı sahibe bağlı; kaydın sahibinin geçmişinde nasıl görüneceği
     (`entityType: "Category"` altında `assets` alanı mı, ayrı `Asset` kaydı + üst kayıt bağı mı).
  2. **Operatör CLI'ları (`SYSTEM` aktör).** Çeviriler prod'a ağırlıkla CLI ile yazılıyor ve kayıt üretmiyor.
     Envanter `core/helpers/audit/auditCoverage.test.ts` → `unauditedScripts`
     (`translate-category-translations`, `backfill-category-translations`,
     `backfill-product-industrial-usages`, `fillCategorySlugs`).
  3. **Diğer modeller.** Öneri sırası: `Product` (+ çeviriler, attribute bağları) → `ProductAttribute` /
     `ProductAttributeValue` → `Supplier` → `ProductVariantSupplier` (fiyat alanları) → `Customer`
     (ticari alanlar) → `CustomerVariantSpecialPrice` → kullanıcı rol / erişim değişiklikleri.
     Her model için: snapshot izin listesi (hangi alan kayda girer — ticari / gizli alan kararı),
     repository yazma yolları, arayüz sunucusu (`AuditPresenter`).
  4. **Genel "Denetim Kayıtları" sayfası (admin).** Model / kullanıcı / tarih filtresi. Silinen bir kaydın
     geçmişine arayüzden ulaşmanın TEK yolu bu olacak (bugün silinen kategorinin `DELETE` kaydı yalnız
     veritabanında görülür). `GET /audit-logs` bugün `entityType` + `entityId`'yi zorunlu tutuyor.
- **Sertleştirme (karar gerekir):**
  - **DB seviyesinde değiştirilemezlik:** bugün "yalnız eklenir" kuralı uygulama katmanında
    (tek yazıcı + kapsam testi). `AuditLog` için UPDATE / DELETE'i reddeden bir trigger eklenebilir;
    dikkat: `actorUser` FK'sı `SetNull` — kullanıcı silme bu tabloyu günceller, trigger o kolona izin
    vermeli ya da FK kaldırılmalı.
  - **Saklama süresi + KVKK:** tablo süresiz büyür; IP adresi ve e-posta kişisel veri. Süre ve
    silme / anonimleştirme politikası iş kararı. Budama yapılırsa `CREATE` kayıtları korunmalı
    ("oluşturan" bilgisinin tek kaynağı).
  - **Uygulama dışı ikinci iz:** veritabanına yazma yetkisi olan biri izi de silebilir; CloudWatch yapısal
    logu ya da S3 Object Lock'a dışa aktarım buna karşı.
- **Yan bulgular (2026-09-30, kod okumasından — ölçülmedi, bu işte düzeltilmedi):**
  - `DELETE /categories/{id}` S3 nesnelerini veritabanı silmesinden ÖNCE siliyor
    (`deleteCategoryHandler`). Silme düşerse (kategori silmesi ürünlere kaskad eder; aşağıdaki "Ürün
    modeli silme" maddesindeki `Restrict` zincirine burada da takılabilir) görseller gitmiş, kayıt kalmış
    olur. Doğrusu önce DB (+ denetim kaydı), sonra S3.
  - Aynı uç, kategorinin altındaki TÜM ürünleri uyarısız kaskad siliyor ve `content_editor`'a da açık.
    Karar gerekir: ürünü olan kategori için 409 engeli ve / veya silmeyi admin'e daraltma. (Denetim kaydı
    artık kaç ürünün gittiğini tutuyor: `metadata.cascade`.)
- **Aynı açık ürün ve materyal görsellerinde (2026-10-01, kod okumasından — düzeltilmedi):** kategoride
  kapatılan desen (istemcinin gönderdiği `assetKey`'i doğrulamadan ACTIVE satır yazmak, presign'da izin
  listesiz `contentType`) `CreateProductDialog` / `updateProduct` (`assetKey`), ürün `AssetUploader` /
  `ProductAssetsUploader` ve `MaterialFormDialog` / `updateMaterial` akışlarında duruyor. Kategorideki
  çözüm şablon: görsel yalnız var olan kayda, sunucunun ürettiği anahtar + PENDING satırla eklenir
  (`createCategoryAssetUploadHandler`, `categoryAssetContentTypes.ts`).

### Üretim Planlama (APS + MES-lite) — Faz 1-6 · kapsam: büyük *(kullanıcı talebiyle, branch `feature/production-planning`)*
- **Tasarım + yol haritası:** [docs/production-planning.md](docs/production-planning.md) —
  veri modeli (makine / kalıp → `ProductSize` / vardiya düzeni / üretim emri → iş → vardiya
  lotu `1000-1`…), saf planlama motoru (core, frontend'le `@core/*` üzerinden paylaşılır),
  ProtectedApi `/production/*`, planlama tahtası + kanban UX'i, kütüphane kararı (kendi
  tahtamız: `@dnd-kit/core` + date-fns + shadcn), açık sorular (§13).
- **Durum:** Faz 0 (plan) ✅ · **Dilim 1.1** (rol + `/uretim` iskeleti) ✅ · **Dilim 1.2**
  (tanım şeması + migration + ölçü koruması) ✅ — ikisi kubi'de kullanıcı tarafından
  doğrulandı (migration uygulandı, giriş/çıkış sorunsuz). **Dilim 1.3** (parkur/alan +
  vardiya düzenleri + makineler) ✅ kubi'de doğrulandı. **Dilim 1.4** (kalıplar + göz grupları
  + makine kartları + hammadde bilgisi: 9 route + 2 ekran) ✅ kubi'de doğrulandı (örnek kalıplar
  girildi). **Dilim 1.5** (operatörler + takvim istisnaları + makine duruşları: 11 route,
  `/uretim/operatorler`, vardiya sayfasına takvim, makine sayfasına duruşlar; migration yok) ✅
  kubi'de doğrulandı. **Dilim 1.6** (uyumluluk motoru + `/uretim/uyumluluk` matrisi + makineye
  `maxDaylightMm`; yeni migration) ✅ kubi'de doğrulandı (migration uygulandı, matris açıldı).
  **Faz 1 (tanımlar) tamam.** **Dilim 2.1** (üretim emirleri: şema + migration + 6 route +
  `/uretim/emirler`) ✅ kod hazır, 2026-09-25 LOG — kubi migration'ı + doğrulama kullanıcıda.
  **Dilim 2.2** (planlama motoru + emir "Öner" önizlemesi; 1 route, migration yok) ✅ kod hazır.
  **Dilim 2.3** (işler ve vardiya lotları + "Planla"; 2 route, yeni migration) ✅ kod hazır,
  2026-09-25 LOG — 2.1–2.3 kubi doğrulaması kullanıcıda (2.1 migration'ı uygulandı).
- Tanım dilimleri **dikey** (API + ekran birlikte, her dilim kubi'de tıklanarak denenebilsin)
  — doküman §10.
  **Dilim 3.1** (salt-okunur planlama tahtası `/uretim/tahta`; 1 route, migration yok) ✅ kod
  hazır, 2026-09-26 LOG — kubi doğrulaması kullanıcıda.
  **Dilim 3.2** (tahtada taşıma: sürükle-bırak + "Taşı" formu, `version` kilidi; 1 route,
  migration yok, yeni bağımlılık `@dnd-kit/core`) ✅ kod hazır, 2026-09-26 LOG — kubi
  doğrulaması kullanıcıda.
  **Dilim 3.3** (bekleyen emirler paneli + "Öner" + "sonrakileri kaydır"; route yok, migration
  yok) ✅ kod hazır, 2026-09-26 LOG — kubi doğrulaması kullanıcıda.
  **Dilim 3.4** (durum panosu `/uretim/pano`; 2 route, migration yok) ✅ kod hazır, 2026-09-26
  LOG — kubi doğrulaması kullanıcıda.
  **Dilim 3.5** (vardiya ekibi + lotlar + notlar + QR etiket; migration
  `20260926150000_add_production_shift_assignments_and_lot_notes`, 8 route, yeni bağımlılık
  `qrcode.react`) ✅ kod hazır, 2026-09-28 LOG — migration + kubi doğrulaması kullanıcıda.
  **Faz 3 tamam.**
  **Dilim 4.2** (vardiya raporu; migration `20260928100000_add_production_shift_reports`, 7 route)
  ✅ kod hazır, 2026-09-28 LOG — migration + kubi doğrulaması kullanıcıda.
  **Dilim 4.3** (planlanan ↔ gerçekleşen: tahmin, gecikme uyarısı + "sonrakileri kaydır" önerisi,
  kalıp bakımı; 2 route, migration yok) ✅ kod hazır, 2026-09-28 LOG — kubi doğrulaması kullanıcıda.
  **Dilim 4.4** (canlı tahta — Realtime; migration yok, infra değişikliği: 41 üretim yazma route'una
  dar `iot:Publish` + yetkilendiriciye rol kontrolü) ✅ kod hazır, 2026-09-28 LOG — kubi doğrulaması
  kullanıcıda.
  **Dilim 4.5** (kalıcı üretim bildirimleri: gecikme, termin riski, kalıp bakımı — zil + canlı toast;
  migration `20260928160000_add_production_alert_notification_type`, infra: zamanlanmış tarama) ✅
  kod hazır, 2026-09-28 LOG — migration + kubi doğrulaması kullanıcıda. **Faz 4 tamam** (4.1
  operatör hesapları ertelendi).
  **Faz 5 (dikey dilimler, 2026-09-28 onayı):** **Dilim 5.1** (ürün geçmişi: 1 route, ekran + Excel;
  migration yok) ✅ kod hazır, 2026-09-28 LOG — kubi doğrulaması kullanıcıda. **Dilim 5.2** (makine
  kullanımı ve OEE: 1 route, ekran + Excel; migration yok) ✅ kod hazır, 2026-09-28 LOG — kubi
  doğrulaması kullanıcıda. **Dilim 5.3** (kalıp istatistikleri + makine kartına çevrim önerisi: 2
  route, ekran + Excel; migration yok) ✅ kod hazır, 2026-09-28 LOG — kubi doğrulaması kullanıcıda.
  **Faz 5 tamam.**
- **Sıradaki:** Faz 1–5 kubi doğrulaması (kullanıcıda; migration'lar LOG'da; demo akışı ve örnek veriler
  [docs/production-planning-demo.md](docs/production-planning-demo.md)) ve prod'a çıkış planı.
  **Faz 6** (doküman §10, opsiyonel: otomatik planlayıcı, sipariş durumunun otomatik "Üretimde"ye
  geçmesi, hammadde ihtiyacı, insert reçetesi, sayaç entegrasyonu) ayrı karar + kısa planla.
- **5.3'ten açık uçlar (talep gelirse):** tahta / uyarı tahmini hâlâ plan çevrimiyle — gerçek hız
  yalnız karta uygulanınca sonraki planlara girer; kalıp bağlama süresi önerisi yok (kanban tıklama
  anına bağlı veri güvenilir değil); kart makine başına tek çevrim (kart varken hammadde katsayısı
  devre dışı) — renk / hammadde ayrımı gerekirse kart × hammadde ailesi; Kalıplar (Tanımlar)
  sayfasında öneri rozeti yok; makine verimi (%85) için gerçekleşen kullanılabilirliğe dayalı öneri
  yok.
- **5.2'den açık uçlar (talep gelirse):** süre ve OEE yalnız raporlu vardiyalardan — süren vardiya
  rapor girilene kadar "boş" görünür (anlık veri 4.1 / sayaç entegrasyonuyla); "raporsuz vardiya" yalnız
  iş kapanırken raporsuz kalanları sayar, sahadaki işin geciken raporu ayrıca sayılmaz (4.5'in "lot
  raporu bekliyor" uyarısıyla birlikte düşünülebilir); makine durum geçmişi yok — pasif makine
  listelenirse pencerenin tamamı vardiya süresine girer; `ProductionLot.actualStartAt` üzerinde indeks
  yok (lot sayısı çok büyürse indeks migration'ı); günlük / haftalık eğilim grafiği yok (pencere
  toplamı).
- **5.1'den açık uçlar (talep gelirse):** raporu hiç girilmemiş vardiyalar gerçek çevrime katılmaz
  (yalnız raporlu vardiyalar); ürün listesi yalnız kullanılabilir kalıbı olan ürün modellerini
  gösteriyor — kalıbı emekliye ayrılmış ürünün geçmişi için "üretilmiş ürünler" sözlüğü gerekebilir;
  tek sorguda en yeni 500 iş (aralık daraltılır).
- **4.5'ten açık uçlar (talep gelirse):** e-posta ile bildirim (bugün yalnız zil + canlı toast);
  kullanıcı başına bildirim tercihleri (tür kapatma); "lot raporu bekliyor" uyarısı (vardiya bitti,
  rapor yok); tarama aralığı sabit (prod 15 dk).
- **4.4'ten açık uçlar (talep gelirse):** başka planlayıcının değişikliğinde toast (bilinçli olarak
  yok — kullanıcı sessiz tazeleme seçti); bildirim zili ile üretim panelinin tek MQTT bağlantısını
  paylaşması (bugün aynı sayfada ikisi birden yok, gerek olmadı).
- **4.3'ten açık uçlar (talep gelirse):** tahmin kalan baskıyı PLANDAKİ çevrimle yürütüyor (5.3
  gerçek çevrimi yalnız makine kartına öneri olarak getirdi; süren işin tahmini gerçek hızla
  yapılmıyor); bayat PLANLI işler (planlı bitişi geçmiş, hiç
  başlamamış) tahtada yalnız kendi aralığında görünür — "başlamamış işler" listesi / toplu yeniden
  planlama; bakım geçmişi tutulmuyor (yalnız son bakım günü + sayaç) — bakım kaydı tablosu
  gerekirse migration; "Bakım yapıldı" bugün yalnız "şimdi" ile (uç `performedAt` alıyor, arayüzde
  tarih seçimi yok).
- **4.2'den açık uçlar (talep gelirse):** raporda lot ekibini de düzenleme (bugün lot
  ayrıntısında); iş tamamlandıktan sonra rapor düzeltme (bugün kilitli); anlık olay akışı / operatör
  ekranı 4.1 ile.
- **3.5'ten küçük açık uçlar (talep gelirse):** tahta satırında ve pano kartında o vardiyanın
  ekibi; not düzenleme (bugün yalnız ekle / sil); ekip için "haftalık şablon".
- **3.4'ten kalan:** tamamlanan işi yeniden açma / iş toplamını düzeltme (4.2 durum geçmişi ve lot
  saatlerini getirdi).
- **Küçük açık uç:** üretim emrini müşteri siparişi kalemine (`OrderItem`) bağlama — talep gelirse.
- **Küçük açık uçlar (talep gelirse):** müşteri kalıbında sahip müşteri seçimi (şema hazır:
  `Mold.ownerCustomerId`) — dar bir müşteri sözlüğü ucu gerekir; resmî tatilleri yıla göre tek
  tıkla ekleme (dinî bayramlar yıllık tablo ister); yarım gün (arife) takvim istisnası.
- **Kararlar (kullanıcı, 2026-09-25):** günde 12 / 16 / 24 saat = vardiya düzeni; lot kökü id
  gibi otomatik artan (standart yok) + `-1 -2 -3`; operatör hesabı yok (notları planlayıcı
  yazar); bakalit dahil değil; aile kalıbında farklı ürün modelleri olabilir (Faz 2 şeması
  buna göre: iş BASKI planlar, `ProductionJobOutput`/`ProductionLotOutput`).
- **Bekleyen girdi:** şirketin makine/kalıp listesi (gelince formatına göre toplu aktarım dilimi).
- **Test disiplini:** yalnız bu branch + kubi stage.
- Etki: **infra** (Cognito grubu ✅; ileride opsiyonel Realtime topic), **core** (şema +
  `helpers/production/` motoru), **functions** (ProtectedApi `/production/*`, ~40 route),
  **frontend** (`/uretim`, `features/production/**`).

### Varyant maliyeti (kendi üretim) — plan hazır, kullanıcı kararı bekliyor · kapsam: orta *(kullanıcı talebiyle, 2026-09-29; "not olarak düş, düşünmem gereken bir şey var" — onaysız başlanmaz)*
- **Hedef:** kendi ürettiğimiz her varyant (ürün + ölçü + renk/hammadde) için SAĞLAM parça başı üretim
  maliyeti ve kırılımı. İlk sürüm yalnız HESAPLAR ve gösterir; katalogdaki hiçbir fiyatı değiştirmez.
- **Hesap (sağlam parça başı):**
  - parça ağırlığı = kalıptaki parça ağırlığı × (varyant hammaddesinin yoğunluğu ÷ ağırlığın tartıldığı
    hammaddenin yoğunluğu);
  - yolluk payı = kalıbın baskı başı yolluk ağırlığı ÷ toplam göz — **yolluk tamamı maliyete girer**
    (kullanıcı kararı, 2026-09-29; sıcak yolluklu kalıpta yolluk ağırlığı 0);
  - hammadde = (parça + yolluk payı) ÷ (1 − fire oranı) × kg fiyatı — `÷ (1 − fire)` planlama motorundaki
    baskı hesabıyla aynı (`computeShotCount`); ilk taslaktaki `× (1 + fire)` yaklaşımı düzeltildi;
  - makine = çevrim ÷ verim ÷ göz ÷ (1 − fire) × saat maliyeti (çevrim planlamayla aynı zincirden:
    `resolveCycleTimeSec`, kart > standart × hammadde katsayısı);
  - kalıp bağlama parti başına ayrı (bağlama süresi × saat maliyeti; "1.000'lik partide parça başına" payı);
  - makine: kalıbın tercih edilen makinesi, yoksa uyumluluk motorunun önerdiği; ayrıntıda diğer uygun
    makineler; eksik veri uydurulmaz ("eksik: parça ağırlığı / yoğunluk / kg fiyatı / saat maliyeti").
- **Yeni veri (migration, yalnız ekleme):** `MaterialProcessProfile` kg fiyatı + para birimi + fiyat tarihi
  (katalogdaki `Material`'a DEĞİL — public yanıtlara sızmasın); `Mold` "parça ağırlıkları şu hammaddeyle
  tartıldı" (referans hammadde, `SetNull`; aile kalıbında tüm gözler aynı baskıda aynı hammaddeyle dolduğu
  için kalıp düzeyinde tek alan yeter).
- **Dilimler:** M1 veri (migration + hammadde formuna kg fiyatı + kalıp formuna referans hammadde) · M2 hesap +
  ekran (saf `variantCost.ts` + testler, `GET` uç, Analiz → Varyant Maliyeti, Excel; yetki: üretim planlama +
  admin/owner).
- **Plan dışı (sonra, ayrı kararla):** hesaplanan maliyeti katalogdaki "kendi üretim" tedarikçi fiyatına
  (`ProductVariantSupplier.price`) yazmak — kendi üretimin katalogda nasıl temsil edildiği kararı gerekir
  (tasarım dokümanı §13 soru 9); versiyonda birden çok hammadde / masterbatch oranı (bugün oran yok: ana
  hammadde, birden çoksa en pahalısı); gerçekleşen maliyet (raporlardaki gerçek çevrim ve fireyle); enerji /
  işçilik ayrı kalem değil (makine saat maliyetine dahil); para birimi TL varsayılır.

### Ürün modeli silme — ölçü değeri olan ürün FK ile 500 veriyor · kapsam: küçük-orta *(yan bulgu, 2026-09-25, denetlenmedi)*
- **Gözlem:** üretim planlama Dilim 1.2'nin yerel Postgres doğrulamasında, ölçü şablonu +
  ölçü değeri olan bir ürün `prisma.product.delete` ile silinirken
  `ProductSizeValue_requirementId_fkey` (ProductSizeValue → ProductMeasurementRequirement
  `Restrict`) ile düştü: Postgres zincirleme silmede şablonu, değerlerden önce silmeye
  çalışıyor. `deleteProductHandler` P2025 dışındaki her hatayı "Failed to delete product"
  (500) yapıyor → kullanıcı sebebini göremiyor. Muhtemelen varyantı olan ürünlerde de
  benzer bir `Restrict` zinciri (`ProductVariant → ProductSize`) var — ÖLÇÜLMEDİ.
- **Karar gerekir:** ürün modeli silme gerçekten kullanılıyor mu? Kullanılıyorsa silme
  transaction'ında sıralı temizlik (değerler → ölçüler/varyantlar → ürün) + referans
  engelleri (`variantDeletionBlockers` deseni); kullanılmıyorsa arayüzden kaldırma.
- Etki: **core** (product repository), **functions** (`deleteProductHandler`).

### Google ile giriş — G2b + G3 (kubi testinden sonra) · kapsam: orta *(kullanıcı talebiyle, branch `feat/google-identity-provider`)*
- **Durum:** G1 (altyapı + PreSignUp bağlama) ve G2a (NextAuth sağlayıcısı + buton) ✅ kod
  hazır, 2026-09-19 LOG'da; **kubi'de gerçek Google girişi kullanıcıda bekliyor**
  (kubi `.env`'ine `GOOGLE_LOGIN_ENABLED="true"` + `sst dev --stage kubi`).
- **G2b — OAuth hata eşleme + otomatik yeniden deneme:** Cognito hata metnini
  (`error_description`) kullanıcıya anlamlı mesaja çevir: `FED_DENY_*` kodları
  (`core/.../cognito/federation/errors.ts`) için ayrı i18n mesajları (davet bekliyor,
  e-posta doğrulanmamış, ...) + PreSignUp bağlaması sonrası ilk denemenin
  "Already found an entry for username" ile düşmesine karşı TEK seferlik otomatik
  yeniden deneme. NextAuth v4 `error_description`'ı tarayıcıya iletmiyor (yalnız
  sunucu logunda) → `[...nextauth]/route.ts` sarmalayıcısıyla yakalanmalı. **Gerçek
  mesaj metinleri kubi'de gözlenmeden yazılmaz** (topluluk kaynaklı varsayım).
- **G3 — prod'a açma (kullanıcı sürüyor, ben dokunmuyorum):** kubi'de doğrulandı
  (Düzeltme 1-5, LOG 2026-09-19 – 2026-09-22). Gizlilik politikası (`/gizlilik-politikasi`)
  ve kullanım koşulları (`/kullanim-kosullari`) sayfaları eklendi (2026-09-23 LOG) —
  Google'ın "In production" yayın şartı için gereken Branding alanları artık dolduruluyor.
  Kalan adımlar kullanıcıda: prod için AYRI Google OAuth client'ı
  (redirect `https://auth.<DOMAIN>/oauth2/idpresponse`, Audience: Production), `.env`'i
  prod bloğuna çevirip `GOOGLE_LOGIN_ENABLED="true"` ekleme, iki secret'ı
  `npx sst secret set --stage prod` ile girme, `npx sst diff --stage prod` ile yalnız
  beklenen değişikliğin çıktığını görme, sonra deploy. Prod discovery
  `authorization_endpoint`'i (özel domain, `auth.<DOMAIN>`) deploy sonrası doğrulanmalı.
  Opsiyonel: Cognito `/logout` ile tam çıkış (Hosted UI oturum çerezi 1 saat kalıyor).
- **Sonradan iyileştirme:** AWS "inbound federation" trigger'ına geçiş (ilk-deneme
  hatasını kaldırır) — SST/Pulumi AWS güncellemesi gerekir (7.20.0'da yok).
- **E-posta OTP (2. fikir, ayrı araştırma):** kubi havuzu ESSENTIALS'ta
  (`AllowedFirstAuthFactors` şu an yalnız `PASSWORD`); e-posta gönderimi
  `COGNITO_DEFAULT` — OTP için SES gerekip gerekmediği araştırılmadı. Google için
  kurulan "yerel profil çapası" tasarımı bunun zeminini de hazırlıyor.
- **Yan bulgu:** `infra/cognito.ts`'te `postConfirmation` hâlâ `runtime: 'nodejs20.x'`
  (Lambda: deprecated 2026-04-30, güncelleme engeli **2027-03-03**) → `nodejs24.x`'e
  taşınmalı; VPC + Prisma bağımlılığı yüzünden ayrı, kısa bir dilim.

### Çoklu telefon — kapsam dışı kalan yüzeyler · kapsam: küçük, opsiyonel *(talep gelirse; özellik Dilim 1-3 ✅ 2026-09-23 LOG)*
- Ek telefonlar admin/temsilci/veri girişi formlarında ve 6 CRM liste/kart yüzeyinde
  var. Bilinçli olarak YALNIZ birincil numarayla kalanlar: müşteri portalı (profil
  görünümü + `CUSTOMER_PROFILE_CHANGE` talebi — onay akışı ve snapshot'ı etkiler),
  public web formu, harita popup'ı/akordeonu (`listCustomersForMap` yalnız `phone`
  seçiyor), ürün→müşteri tablosu (`getProductMatchedCustomers`), kampanya duyuruları.
- Genişletirken: gösterim `features/customerPhones/components/CustomerPhoneList`, veri
  için ilgili select'e `customerPhoneSelect` ekle; select KATI bir yanıt şemasına
  gidiyorsa şemayı da güncelle (bkz. AGENTS.md "When touching customer phone numbers").

### Dialog'larda mobil kenar boşluğu — öneksiz `max-w-*` · kapsam: küçük-orta, opsiyonel *(2026-09-23 gözlemi, denetlenmedi)*
- `DialogContent`'e öneksiz `max-w-*` verilince primitive'in
  `max-w-[calc(100%-2rem)]`'si tailwind-merge ile SİLİNİYOR (twMerge ile
  doğrulandı) → dialog telefonda ekran kenarına yapışıyor. `EditCustomerProfileDialog`
  düzeltildi (`sm:max-w-*`); aynı desen tek satırlık `className`'lerde **en az 36
  dialogda** daha var (`grep -rn '<DialogContent className="[^"]*"' packages/frontend
  | grep -v 'sm:max-w'`; çok satırlı `DialogContent`'ler bu sayıma girmiyor).
  Bir kısmında (`CompanyContactsPageClient`, `SupplierFormDialog`,
  `EditVariantSupplierDialog`…) yükseklik sınırı da yok. Mekanik düzeltme:
  `max-w-X` → `sm:max-w-X`; uzun formlarda `EditCustomerProfileDialog` /
  `LeadCustomerProfileDialog` deseni (sabit başlık/footer + kayan gövde + ortak
  `features/admin/shared/components/DialogFormSection`). Görsel QA gerektirir.

### Veri girişi ürünler sayfasına sektör/üretim grubu/kullanım alanı filtresi *(kullanıcı talebiyle ertelendi, 2026-09-17 LOG)*
- **Ne:** `/veri-girisi/products` (`ProductsPageClient`/`useProductListFilters`)
  şu an yalnız kategoriye göre filtrelenebiliyor; sektör/üretim grubu/kullanım
  alanı filtresi HİÇ yok. Müşteri temsilcisi tarafındaki `/musteri-temsilcisi/urunler`
  bunu zaten destekliyor (`SalesProductCatalogSection` + `useFilterStore`,
  `?sector=&production_group=&usage_area=` slug şeması).
- **Neden açık:** Potansiyel müşteri detay panelindeki "Bu profille eşleşen
  ürünler" önizlemesine EKLENEN "Ürünlerin tamamını gör" linki
  (`CustomerProfileMatchedProducts`'ın yeni `viewAllHref` prop'u, bkz. LOG)
  şu an yalnız müşteri temsilcisi tarafında bağlı — veri girişi panelinin
  `LeadCustomerDetailPanel`'ine bağlanabilmesi için önce bu filtre
  kapasitesinin eklenmesi gerekiyor. Kullanıcı bunu "tek buton ekleme"
  ölçeğinde olmadığı için ayrı bir dilime erteledi.
- **Etki:** **functions** (`GET /products` admin/veri-girişi ucuna
  sector/production_group/usage_area query param'ı), **frontend**
  (`useProductListFilters` genişletme + filtre UI, muhtemelen
  `ProductFilterSidebar`/`ProductCategoryFilterRail` deseninin reuse'u).

### Müşteri ziyaretleri (saha CRM) — Dilim 4 (opsiyonel) *(kullanıcı talebiyle, Dilim 0-3 ✅ 2026-09-16 LOG)*
- **Yapıldı (LOG):** Şema (Dilim 0) + backend rapor altyapısı (Dilim 1) +
  müşteri temsilcisi paneli "Ziyaretlerim" (Dilim 2) + çapraz-temsilci rapor
  sayfası (Dilim 3). Rapor sayfası önce hem admin hem müşteri temsilcisi
  panelinde açılmıştı; kullanıcı o panel sürümünü geri istedi — sıradan
  temsilciyle paylaşılan `/musteri-temsilcisi`'te olmamalı, "admin ve
  ileride satış müdürü sayfalarında olmalı" dedi. Şu an yalnız
  `/admin/musteri-ziyaretleri` (admin/owner) var;
  `/musteri-temsilcisi/musteri-ziyaretleri` ve nav öğesi kaldırıldı.
  (Not: panel URL'i `/satis` idi, 2026-09-17'de `/musteri-temsilcisi`'ye
  taşındı — bkz. LOG "Satış rolü... Müşteri Temsilcisi".)
  Detaylar LOG'daki "Müşteri ziyaretleri... Dilim 0/1/2/3" ve "Dilim 3
  GÜNCELLEME" notlarında.
- **Gelecekte istenirse:** Satış müdürüne özel ayrı bir alan/panel bölümü
  açıldığında bu rapor oraya taşınabilir — paylaşılan sunum bileşeni
  (`CustomerVisitsReportView`, `features/sales/visits/components/
  CustomerVisitsReportPageClient.tsx` içinde, export edilmiyor) ve
  `useProtectedUsers`/`GET /sales/customer-visits` (backend zaten hazır,
  Dilim 1) hızlıca yeniden bağlanabilir. Bugün için AYRI bir madde/onay
  gerekmeden başlanmamalı.
- **Dilim 4 (opsiyonel, henüz istenmedi):** satış haritasındaki müşteri
  accordion'una "Ziyaret Planla" hızlı aksiyonu; ziyaret hatırlatma bildirimi
  (`UserNotification`).
- **Küçük, isteğe bağlı takip maddeleri (LOG'da not edildi, PLAN'a madde
  açılmadı):** `createManagedCustomerVisitHandler`'ın `ownerUserId`
  sabitlemesi için davranış testi; `updateManagedCustomerVisitHandler`'a aynı
  sabitlemenin eklenmesi (bugün hiçbir UI reassignment göndermiyor, riski
  düşük ama savunma amaçlı tutarlılık için değerlendirilebilir); rapor
  sayfasına "Sonuçlandır" aksiyonu eklenmesi istenirse ayrı bir dilim.
- Etki: **core** (`customers/repository.ts`), **functions** (AdminApi +
  ProtectedApi crm), **frontend** (yeni satış sayfası + yeni admin/satış
  müdürü rapor sayfası + mevcut `CustomerVisitsPageClient.tsx` genişletme).

### `MeasurementCode` R3/H3 — prod migration planı *(kullanıcı talebiyle, kubi ✅ 2026-09-09 LOG)*
- Kubi'de tamamlandı ve kullanıcı doğruladı (veri girişi panelinde R3/H3
  seçilebiliyor). Kalan: aynı migration'ı (`20260908232145_add_r3_h3_measurement_codes`
  — `ALTER TYPE "MeasurementCode" ADD VALUE 'R3'/'H3'`) PROD RDS'e uygulamak
  için ayrı bir plan+onay — kullanıcı "kubi'de test edelim, prod'u sonra
  planlarız" dedi. Prod migration'ı VPC tünel gerektirir (bkz. README
  "Database Migrations on a Deployed Stage" → Production RDS bölümü) ve
  `migrate deploy` (mevcut migration dosyasını uygular, yeni dosya oluşturmaz)
  ile yapılmalı.
- Etki: **prod deploy** (migration + sonrasında kod deploy'u — kod zaten
  geriye dönük uyumlu, yeni enum değerlerini opsiyonel olarak kabul ediyor).

### Panel/auth için özel 404/hata sayfaları · kapsam: küçük *(kullanıcı talebiyle, opsiyonel devam)*
- Public'e (`app/[locale]/(public)/not-found.tsx` + `error.tsx`, 2026-09-08 LOG)
  eklenen özel 404/runtime-hata ekranları yalnız public route grubunu kapsıyor.
  Panel route grupları (`app/(panels)/...` — admin/satış/satınalma/müşteri/veri
  girişi) ve `(auth)` grubu hâlâ Next.js'in çıplak varsayılan 404'ünü/hata
  ekranını gösteriyor. Kullanıcı bilinçli olarak "public'ten başlamak üzere"
  dedi — panel tarafı istenirse ayrı bir dilim (panel şablonuna uygun,
  `PanelShell` chrome'unu koruyan bir `not-found.tsx`/`error.tsx`).
- Etki: **frontend**, `app/(panels)/**`.

### P2.2 — next-auth v4 → Auth.js v5 kararı · kapsam: büyük, riskli · ⛔ hiç başlanmadı
- Ne: v5 migration'ını ayrı bir proje olarak planla; o zamana dek v4 + `overrides` ile yaşa (P0.3'te yapıldı).
- Neden: v4 bakım modunda ve eski bağımlılık çekiyor (`uuid` moderate açığı — sömürü yolu yok, kalıcı çözüm bu madde). Custom Cognito credentials + refresh akışı ([lib/auth/auth.ts](packages/frontend/lib/auth/auth.ts)) migration'da en kırılgan parça. Acele edilmemeli.
- Etki: **frontend** (session akışı) + dolaylı olarak tüm panel yüzeyleri.

### P2.3 — X-Ray tracing + custom metrics (Powertools Tracer/Metrics) · kapsam: orta, infra onaylı · ⛔ hiç başlanmadı
- Ne: P1.6'daki Logger yerleştikten sonra `@aws-lambda-powertools/tracer` (X-Ray) ve `@aws-lambda-powertools/metrics` (EMF) eklenmesi.
- Neden: Logger "ne oldu"yu, tracer "nerede yavaşladı"yı (Prisma sorgusu mu, Cognito çağrısı mı, cold start mı) gösterir; metrics iş-seviyesi sayaçlar (ör. onay/red oranı) sağlar.
- Etki: **infra** (tüm Lambda'larda X-Ray active tracing — prod korumalı, plan + onay şart; CloudWatch/X-Ray maliyeti değerlendirilmeli) + **core** (middy zinciri) + **functions**.
- **Küçük açık uç (P2.5'ten devir):** Gateway seviyesinde reddedilen 429'lar (Lambda hiç tetiklenmeden) hiçbir metriğe düşmüyor — HTTP API'de adanmış metrik yok, access log kurulumu gerekir. Opsiyonel, gözlenmiş sorun değil.

### P2.4 kalanı — RDS dayanıklılığı doğrulaması · A+B deploy edildi, C + drill açık
- A (restore runbook) + B (`deletionProtection: true`, `skipFinalSnapshot: false`) **deploy edildi ve canlıdan doğrulandı** (2026-08-07). Detay LOG'da.
- **Kalan:**
  - **RPO/RTO iş onayı** — README "Disaster Recovery" bölümünde önerilen RPO ~5dk / RTO ~4sa değerleri hâlâ iş onayı bekliyor.
  - **İlk restore drill'i** — hiç koşulmadı. Gerçek RTO'yu öğren; ayrıca SST stack'inin restore edilmiş yeni instance'ı benimsemesi (RDS Proxy target + `DIRECT_RDS_HOST` yeniden bağlama) kanıtlanmış prosedür değil — drill netleştirecek.
  - **C — Multi-AZ** (iş/maliyet kararı): instance ücretini ~ikiye katlar (t4g.micro+20GB için kabaca **~+15-25 USD/ay tahmini, doğrulanmadı**). Yalnız altyapı arızasında otomatik failover verir; kötü migration/DELETE/bozulmaya karşı KORUMAZ. İhtiyaç doğarsa geri-dönülebilir açılır.

### P2.7 — Node 22 → 24 LTS · kapsam: orta · ✅ kod commit'li (75e1b82, 2026-08-26), ⚠️ API Lambda'ları henüz prod'a DEPLOY EDİLMEDİ
- Commit'lenen: `.nvmrc` → `24.19.0`, `engines` → `>=24 <25`, 7 infra dosyasında 15 runtime pin → `nodejs24.x`. Node 24.19.0 + gerçek Postgres 17 + Prisma 7.8 altında lokalde doğrulandı (detay LOG). CI zaten `.nvmrc`'yi okuduğu için Node 24'te koşuyor.
- Frontend Lambda'ları **prod'da zaten `nodejs24.x`** (P2.6 ile, 2026-08-07). Kalan iş: `sst deploy --stage prod` ile **API Lambda'larının** (Admin/Public/Protected/Owner + `businessWorkflow`/`userAccessLifecycle`/`googleMaps`) `nodejs22.x` → `nodejs24.x` geçişini canlıya almak — tek başına, başka değişiklikle birleştirmeden; deploy sonrası duman testi (özellikle Prisma native binding'leri).
- Kalan loose end: [cognito.ts](infra/cognito.ts) `postConfirmation` trigger'ı hâlâ `nodejs20.x` (75e1b82 buna dokunmadı; Node 20 EOL geçti) → `nodejs24.x`'e normalize edilmeli. Auth-kritik (VPC+RDS linkli, kayıt sonrası DB kullanıcısı oluşturur) → kubi'de uçtan uca signup testi şart.

### P2.8 opsiyonel kalanı — frontend'i VPC'den çıkarma · ana iş ✅ (2026-08-25)
- Frontend'de `prisma` importu HİÇ kalmadı (yalnız `@core/*` alias ile saf helper/type importları — CLAUDE.md'ye uygun), `link: [rds]` kaldırıldı, session hot-path'i I/O'suz. `user-access.ts` HTTP client'a geçti; `geocodingService.ts` (Nominatim proxy) tamamen silinip Google Places'e taşındı (b8230f3). Detay LOG'da.
- **Kalan (opsiyonel, ölçüm gerekir):** [frontend.ts](infra/frontend.ts) hâlâ `vpc` geçiriyor (satır 28) — RDS bağı koptuğu için frontend server artık VPC'de olmak zorunda değil. VPC'den çıkarmak cold start + NAT egress kazandırır ama **ölçülerek** yapılmalı (VPC'siz Lambda'nın internet erişimi, SES/S3 erişimi, güvenlik grubu etkileri). Ayrı dilim.

### Asenkron asset yükleme (S3 event-driven) — pilot: kategori · Dilim 1–3 ✅ (2026-09-04, LOG) *(kullanıcı talebiyle)*
- **Yapıldı (LOG):** şema `AssetUploadStatus`; presign `PENDING_UPLOAD` satırı yazıyor (id'li key, 900s); `infra/assetLifecycle.ts` `publicBucket.notify` → `confirmCategoryAssetUpload` Lambda `ACTIVE`'e çeviriyor (idempotent, PRIMARY demote-on-confirm); `AssetUploader` bloklamıyor + `usePendingAssetReconciler` poll + `AssetGrid`/`AssetPreviewPanel` "İşleniyor" rozeti; `categoryRepository` public/liste okumaları `uploadStatus=ACTIVE`, yalnız yönetim dialog'u (`getCategory`/`updateCategory` `includeAllAssets`) PENDING görür. Kubi testi + `sst diff --stage prod` kullanıcıda.
- **Dilim 4 (opsiyonel, kalan tek iş):** günlük `sst.aws.Cron` zombi-sweep — `PENDING_UPLOAD` + `createdAt < now()-24h` olan Asset satırlarını sil (`infra/googleMaps.ts` cron deseni, prod-only ya da tüm stage'ler). İstenirse ürün/materyal/attribute-value asset yükleme akışlarına aynı `createPendingAsset` + notify deseni; 2. tüketici (thumbnail/tarama) gerekirse `bucket.notify` → EventBridge Bus refactor (handler taşıma-bağımsız yazıldı).
- **Karar (2026-09-04, tekrar tartışma):** `s3:ObjectRemoved` **eklenmeyecek** — silme/güncelleme akışları DB-first ve senkron (`deleteAssetHandler` `deleteS3Object` + satır sil; "değiştir" = yeni presign + eski asset DELETE; metadata `PUT /assets/{id}` S3'e dokunmaz). `ObjectRemoved` yalnız app-dışı silme (Lifecycle expiration / elle konsol) eklenirse anlamlı → o zaman zombi-sweep'in yanına dangling-row reconciler'ı olarak. Filtre ekseni **prefix** (`categories/`), suffix DEĞİL (uzantısız key üretilebiliyor + tüm tipler onaylanmalı). `events: ["s3:ObjectCreated:*"]` zaten "all events"i daraltıyor. Genelleştirmede: çakışmayan kardeş prefix'ler VEYA filtresiz tek notification + Lambda içi `startsWith` yönlendirme (handler hazır).
- Etki: **infra** (`assetLifecycle.ts` cron) · gerekirse **core/functions** (diğer asset akışları).

### Müşteri haritası — liste (accordion) + harita opsiyonel · Dilim 1-2e ✅ (2026-09-07, LOG) *(kullanıcı talebiyle)*
- **Yapıldı (LOG):** `groupCustomerMapPoints` + tipler (Dilim 1); `CustomerMapPageClient`'a `view: "list" | "map"` (nuqs) + `CustomerMapCustomerAccordion.tsx` (shadcn `Accordion`, `useBulkSelection`) — filtre uygulanınca ("Listele") önce müşteri listesi gösterilir, `ManagedCustomerMap` (Google Maps JS) yalnız "Haritada Göster" (tümü/seçilenler/tekil) deyince mount edilir (Dilim 2); backend `MAP_CUSTOMER_LIMIT=500` nedeniyle liste `AdminListPagination` ile client-side sayfalandı (Dilim 2b); segment ilk açıldığında yalnız ilk 3 müşteri (peek) + "Tümünü Göster" bandı, açılınca sayfalanmış tam liste (Dilim 2c); genişletilmiş listeyi tekrar peek'e döndüren "Gizle" düğmesi (Dilim 2d); Gizle/Haritada Göster aksiyon çubuğu panel üst çubuğunun altında `sticky` (yüksekliği `ResizeObserver` ile DOM'dan ölçülüyor, sabit piksel yazılmadı) — liste boyunca ekranda kalıyor, panel notlarına gelince normal akışa dönüyor (Dilim 2e). Kubi doğrulaması kullanıcıda.
- **Dilim 3 (opsiyonel, ayrı onay):** aynı Accordion'u `LeadCustomersPageClient`'ın kendi aç/kapa kartı yerine de kullanmak — riskli çünkü o sayfada silme/toplu seçim/profil düzenleme/detay-paneli akışı var.
- **Dilim 4 ✅ (2026-09-10, LOG) *(kullanıcı talebiyle)*:** satış paneli haritası accordion'una, satır açılınca tembel çekilen "Profille Eşleşen Ürünler" listesi. Reusable `CustomerProfileMatchedProducts` (`features/crm/`) — veri girişi paneli (`LeadCustomerDetailPanel`) de aynı bileşene geçirildi. Backend: yeni `GET /sales/customers/{id}/matched-products` (ProtectedApi, `assertCustomerManagementAccess`), core `getCustomerProfileMatchedProducts` (statü-agnostik, `getMatchedProductPreview`'dan çıkarıldı).
- **Dilim 5 (sonraki, planlanacak):** aynı `CustomerProfileMatchedProducts` + `useManagedCustomerMatchedProducts`'ı satış müdürü ve admin müşteri yüzeylerine de bağlamak.
- Etki: **frontend**, `features/customerLocations/**`, `features/crm/**`; **functions/core** (Dilim 4).

### shadcn `DialogTitle`'a geçiş (opsiyonel gözlem, acil değil)
- `CustomerLeadDialog.tsx` ve `ProductAssistantModal.tsx` (ayrıca büyük
  ihtimalle başka dialog'lar da) kendi `<h2>` başlıklarını basıyor, shadcn'in
  `DialogTitle` primitive'ini kullanmıyor. Renk/tipografi turunda (LOG'da)
  fark edildi ama kapsamı ayrı — Radix a11y bağlantısı (`aria-labelledby`)
  şu an muhtemelen eksik. İstenirse ayrı, küçük bir dilim.

### `AboutContent.tsx` gövde metni rengi (opsiyonel, görsel QA gerektirir)
- `intro`/`mission` paragrafları sarmalayıcının (`text-neutral-700`,
  hardcoded) üzerine bilinçli bir vurgu farkı taşıyor (`text-neutral-900`).
  Sarmalayıcıyı `text-muted-foreground`'a çevirmek (diğer dosyalarda yapıldığı
  gibi) gövde metnini gözle görülür şekilde açar — kubi'de görsel onay
  olmadan yapılmadı.

### Panel tipografisi — sıradaki: admin, veri-girişi, satış, satınalma · kapsam: denetlenmedi *(kullanıcı talebiyle)*
- **Yapıldı (müşteri paneli, LOG'da):** `PanelShell.tsx`'in TÜM panellerde
  paylaşılan topbar/mobil-çubuk başlığı artık `usePathname` + aktif nav
  etiketiyle dinamik (eskiden her sayfada aynı sabit panel adını basıyordu) —
  bu düzeltme admin/veri-girişi/satış/satınalma/tedarikçi panellerine de
  otomatik yayıldı. Müşteri panelinin kendi sayfa başlıkları
  (`CustomerPortalPageHeader` — 9+ sayfa) denetlendi, gerçek bir duplicate-h1
  bulundu ve düzeltildi (`ProductHero`/varyant sayfası inline başlığı artık
  h2 — bkz. LOG).
- **Kalan:** Admin/veri-girişi/satış/satınalma panellerinin KENDİ sayfa
  içeriklerinde (liste sayfaları, dialog'lar, form başlıkları) aynı denetim
  henüz yapılmadı — hem h1/h2 hiyerarşisi hem hardcoded renk (`OrdersPageClient`
  `scope!=="portal"` dalında zaten `text-neutral-900`/`500` hardcode olduğu
  görüldü) muhtemelen public'teki gibi dağınık. `CustomerPortalOrdersPageClient`
  bunun canlı örneği: portal'da `CustomerPortalPageHeader` kullanıyor, admin/satış
  tarafı kendi `<h1>`'ini basıyor — aynı `OrdersPageClient` içinde iki farklı
  yol var.
- Etki: **frontend**, kapsam admin panellerine bakılınca netleşecek.

### i18n — kalan fazlar (P1.1 devamı)

**Yapıldı:** Faz 1a (altyapı) + Faz 1b (public/auth/home) + Category Translation pilotu +
varyant sözlükleri (Color/Material/MeasurementType) + 14 dile kadar dalgalar (de/fr/es/it/pt/pl/ru/ar/ko/ja/zh/hi).
Detaylı ilerleme LOG'da. Per-sayfa reçete: [.claude/skills/i18n-migrate](.claude/skills/i18n-migrate/SKILL.md).

**Değişmeyen strateji (yeni i18n işinde bağlayıcı):**
- **Kütüphane `next-intl`**, **URL modeli `localePrefix: "as-needed"`** — mevcut TR URL'ler hiç değişmez, EN `/en/...` altında. `localeDetection: false`.
- **Paneller `[locale]` DIŞINDA** (`app/(panels)/` route group) — proxy.ts `withAuth` matcher'ı yüzünden; panel çevrilecekse taşıma + matcher değişikliği AYNI işte.
- **Zod şemaları factory deseni** — modül-seviyesi şema hook'a erişemez: `buildXSchema(t)` + `useMemo`. Client+server ortak şemalar (server route da kullanıyorsa) TR bırakılır, Faz 3'e.
- **DB içeriği Translation Table ile, model bazında** — additive `XTranslation` tablosu, legacy `name`/`slug` kolonları geçiş tamamlanana kadar korunur. Legacy kolon silme her zaman ayrı migration + drift=0 + onay.
- **Eksik çeviri:** public API TR kaynağa fallback + `translationMissing: true`; eksik EN sayfa `noindex` + sitemap dışı.

**Faz 2 — panel yüzeyleri** (admin/satış/satın alma/portal, ~280 dosya) · ⏸️ ERTELENDİ
- İç kullanıcılar TR çalıştığı için iş kararı bekliyor (bkz. Doğrulanamayan Noktalar). Gerekirse `AccountStatusPageClient` (`/hesabim`) ve panel-içi paylaşılan bileşenler bu kapsamda.

**Faz 3 — backend mesajları + bildirim/e-posta mimarisi** · ⏸️ ERTELENDİ
- [messaging.ts](packages/core/src/core/helpers/userAccess/messaging.ts) ve [businessRequests/messaging.ts](packages/core/src/core/helpers/businessRequests/messaging.ts) bildirimleri **üretim anında TR metin** olarak `UserNotification`'a yazıyor. Doğru hedef: `templateKey + params` persist edip render anında çevirmek → migration + tüm subscriber ve frontend notification okuma zincirinin senkron değişimi.
- Backend hata mesajları: response'lara makine-okur `code` alanı ekle (backward compatible, TR `message` korunur), frontend `code`'u kendi locale'inde çevirir.
- E-postalar için `User.preferredLocale` alanı (şema değişikliği — onaylı migration).

### B3 — ölçü şablonu `isRequired` toggle sonrası ölçü birleştirme · düşük öncelik
- `ProductSize` artık ZORUNLU ölçü imzasıyla tekilleşiyor (2026-09-03 LOG). Bir ölçü
  şablonda zorunlu→opsiyonel çevrilirse, o ölçüyle ayrışmış mevcut `ProductSize`
  kayıtları aynı imzaya düşer ama `recalculateProductVariantCodes` onları BİLEREK
  otomatik birleştirmez (sipariş/talep referanslı varyantı yok etmemek için).
  Gerekirse: tek seferlik `backfill:recode-product-sizes` yeniden çalıştırılır
  (referanslı olanları zaten atlıyor) ya da admin'e açık "ölçüleri birleştir"
  eylemi eklenir. Bugün gerek yok — kayıtlar bozulmuyor, yalnız fazladan kod kalıyor.

### B2 — latent migration: varyant ölçü parmak izi · onay gerekir, bugün gerek yok
- DB-side ölçü gruplaması için materialize `measurementFingerprint` kolonu (`ALTER ADD COLUMN` + backfill; ölçüler güvende, veri kaybettirmez). Bugün gerek yok: gruplama saf server helper'a taşındı (`groupVariantMeasurements`, sorgu zaten hızlı+cache'li). Varyant verisi çok büyürse ve DB-side `string_agg` gruplaması istenirse bu migration + onay gerekir.

---

## Kullanıcıda Bekleyen Adımlar

- **Audit log** — Dilim 1-2 kubi'de doğrulandı ve commit'lendi (2026-10-01). Kalan: kategori görseli
  dilimi (LOG, 2026-10-01) kubi testi + commit, sonra prod. **Prod sırası: ÖNCE `migrate deploy`, SONRA `sst deploy`** — tersi
  olursa kategori yazma uçları tablo bulunamadığı için 500 verir (denetim kaydı yazılamayan değişiklik
  bilinçli olarak geri alınır).
- **Üretim bildirimleri (4.5) kubi testi:** önce migration
  (`npx sst shell --stage kubi --target Prisma -- bash -lc "cd packages/core && npx prisma migrate deploy"`),
  sonra `.env`'e `PRODUCTION_ALERTS_ENABLED="true"` ekleyip `sst dev --stage kubi` (tarama 5 dk'da
  bir). Deneme bitince satırı SİL — açık kalırsa kubi Neon'u gün boyu uyanır.
- **Realtime yan bulgusu (2026-09-28, 4.4):** Lambda'daki IoT yayıncıları (`publishUserAccessRealtime`,
  `publishBusinessRequestRealtime`) SST'nin şemasız uç noktasını SDK'ya veriyordu → `Invalid URL`;
  düzeltildi (`iotDataEndpointUrl`). Deploy sonrası iş talebi / erişim toast'larının canlı geldiğini
  doğrula; gerekirse prod CloudWatch'ta bu iki abonenin eski hatalarına bak (incelenmedi).
- **Üretim planlama (branch `feature/production-planning`):** kubi migration'ı
  (`20260925120000_add_production_master_data`) UYGULANDI, Dilim 1.1/1.2 doğrulandı
  (kullanıcı, 2026-09-25); Dilim 1.3–1.6 de doğrulandı (1.6 migration'ı kubi'de uygulandı).
  **Kalan: Dilim 2.1 — önce kubi migration'ı** (`20260926090000_add_production_orders`; komut
  LOG'da) UYGULANDI (kullanıcı). **Kalan: 2.3 migration'ı**
  (`20260926120000_add_production_jobs_and_lots`), sonra `/uretim/emirler` + "Öner" + "Planla" testi.
  Prod'a giderken sıra: önce migration'lar (VPC tüneli, README), sonra deploy — yeni kod
  `MoldOutput` tablosunu ve `maxDaylightMm` sütununu sorguluyor.
- **⚠️ PageHero banner'ı yorumda (2026-09-08, LOG)** — `components/sections/PageHero.tsx`'teki `<PageHeroBanner .../>` çağrısı kullanıcının isteğiyle geçici olarak yorumda; 13 public sayfada görsel/başlık banner'ı şu an görünmüyor, yalnız breadcrumb var. **Bu haliyle prod'a deploy EDİLMEMELİ.** Banner geri istenince tek satırlık yorum kaldırma.
- **Tedarikçi sözlüğü teknik resmi CDN 404 düzeltmesi deploy edilmeli** (2026-09-08, LOG) — `infra/router.ts`'e `/product-supplier-codes` bucket route'u eklendi (kod hazır, commit edilmedi). `sst deploy --stage prod` sonrası `https://cdn.ceyhunlarplastik.xyz/product-supplier-codes/...` URL'lerinin açıldığını doğrula.
- **SNS e-posta aboneliği onayı** — `kubilayuysal.ceyhunlarplastik@gmail.com` adresine gelen AWS "Subscription Confirmation" linkine tıklanmalı. Tıklanana kadar 6MB payload alarmı + concurrency/throttle alarmları tetiklense de **bildirim gönderilmez** (istek 3 günde düşer). Teyit: `aws sns list-subscriptions-by-topic` → `SubscriptionArn` "PendingConfirmation" değil.
- **`.env` temizliği** — `RDS_PASSWORD`, `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `DEEPL_API_KEY` satırları silinebilir; kod artık SST Secret'tan okuyor (P1.3). `.env`'de KALMASI gerekenler: `AWS_REGION`, `HOSTED_ZONE_ID`, `DOMAIN`, `DOMAIN_CERTIFICATE_ARN`, `DEEPL_GLOSSARY_ID`, `DIRECT_RDS_HOST`.
- **Müşteri haritası rota optimizasyonu** (2026-08-28) — kubi doğrulaması bekliyor. Adımlar LOG'daki "Müşteri haritası: rota optimizasyonu" notunun "Kullanıcıda kalan" bölümünde.
- **P2.7 deploy** (yukarıda) — API Lambda'larının `nodejs24.x` geçişi commit'li ama prod'a deploy edilmedi; `sst deploy --stage prod` + duman testi. `postConfirmation` node20→24 normalizasyonu ayrı küçük iş.

---

## Doğrulanamayan / Onay Bekleyen Noktalar

- **Panel yüzeylerinin (admin/satış/portal) EN çevirisine ihtiyaç var mı?** — iş kararı; i18n Faz 2'nin ön şartı.
- **`npm audit` kalıntı high'ları** (`hono`/`js-yaml` — artık `prisma`/`@prisma/dev` + `shadcn`/`eslint` zincirlerinden, dev-only, deploy artefaktına girmez): CI audit job'unu bloklayıcı yapmaya değer mi, yoksa `--audit-level=critical` bloklayıcı + high advisory yeterli mi?
- **Multi-AZ + storage büyütme maliyet onayı** (P2.4-C).
- **next-auth v4 kalıntı `uuid` moderate açığı** — v5 migration'a (P2.2) kadar kabul mü? (Sömürü yolu yok: next-auth yalnız rastgele v4 üretir.)
- **`autoMinorVersionUpgrade: true`** (P2.6'da bilinçli geri alındı) — Postgres minor yamaları Pazartesi 00:33-01:03 UTC bakım penceresinde birkaç dakika kesintiyle uygulanır; tek AZ olduğumuz için bu kabul edildi, teyit.
