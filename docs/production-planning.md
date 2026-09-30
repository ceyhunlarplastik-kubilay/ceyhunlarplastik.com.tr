# Üretim Planlama (APS + MES-lite) — Tasarım ve Yol Haritası

> **Durum:** Faz 1 — Dilim 1.1 ✅ (rol + panel iskeleti) · 1.2 ✅ (tanım şeması + migration) · 1.3 ✅ (parkur/alan + vardiya düzenleri + makineler) · 1.4 ✅ (kalıplar + göz grupları + makine kartları + hammadde bilgisi) · 1.5 ✅ (operatörler + takvim istisnaları + makine duruşları) · 1.6 ✅ (uyumluluk motoru + matris; Faz 1 tamam) · Faz 2: 2.1 ✅ (üretim emirleri) · 2.2 ✅ (planlama motoru + emir önizlemesi) · 2.3 ✅ (işler ve lotlar, "Planla") · Faz 3: 3.1 ✅ (planlama tahtası, salt okunur) · 3.2 ✅ (tahtada taşıma: sürükle-bırak + Taşı formu) · 3.3 ✅ (bekleyen emirler paneli + Öner + sonrakileri kaydır) · 3.4 ✅ (durum panosu) · 3.5 ✅ (vardiya ekibi + lotlar, notlar, QR etiket; Faz 3 tamam) · Faz 4: 4.2 ✅ (vardiya raporu: sayım, fire / duruş nedenleri, durum geçmişi, kalıp sayacı) · 4.3 ✅ (planlanan ↔ gerçekleşen: tahmin, gecikme uyarısı + "sonrakileri kaydır" önerisi, kalıp bakımı) · 4.4 ✅ (canlı tahta: başka planlayıcının değişikliği açık ekranları anında tazeler + Canlı göstergesi) · 4.5 ✅ (kalıcı bildirimler: gecikme, termin riski, kalıp bakımı — zil + canlı toast; 4.1 ertelendi; Faz 4 tamam) · Faz 5: 5.1 ✅ (ürün geçmişi: üretim başına satır, özet, grafik, Excel) · 5.2 ✅ (makine kullanımı ve OEE: zaman dağılımı, duruş nedenleri, OEE, Excel) · 5.3 ✅ (kalıp istatistikleri: sayaç, bakım öngörüsü, makine ve renk / hammadde başına gerçek çevrim, makine kartına çevrim önerisi, Excel; Faz 5 tamam) · sıradaki: kubi doğrulaması; Faz 6 opsiyonel · **Branch:** `feature/production-planning` · **Plan tarihi:** 2026-09-25
> **Test:** yalnız bu branch + kubi stage (`export AWS_PROFILE=ceyhunlar-prod && npx sst dev --stage kubi`). `prod`/`dev`'e dokunulmaz.
> Bu doküman canlıdır: kararlar netleştikçe güncellenir. Açık iş özeti [IMPROVEMENT_PLAN.md](../IMPROVEMENT_PLAN.md)'de, tamamlanan dilimler [IMPROVEMENT_LOG.md](../IMPROVEMENT_LOG.md)'de.
> **Demo, kullanım kılavuzu ve örnek veriler:** [production-planning-demo.md](production-planning-demo.md).

## 1. Amaç

Fabrikadaki enjeksiyon makinelerinin üretimini portaldan **planlamak** (APS — Advanced Planning & Scheduling) ve **takip etmek** (MES — Manufacturing Execution System'in hafif bir sürümü):

- Üretilecek ölçünün kalıbını, ona fiziksel/teknik olarak uyan ve işi termine en ekonomik şekilde yetiştiren makineyle buluşturmak.
- Planı vardiya takvimi (12 / 16 / 24 saat) üzerinde Gantt tarzı bir planlama tahtasında sürükle-bırak ile yönetmek.
- Her üretimi vardiya bazlı lotlarla (`1000-1`, `1000-2`, `1000-3`) izlemek; lotlara planlayıcı ve operatör notu düşmek.
- Geriye dönük istatistik: hangi ürün/ölçü kaç vardiyada, kaç adet, ne kadar fireyle üretildi.

**Şimdilik kapsam dışı:** makine PLC/sayaç entegrasyonu, stok/depo, maliyet muhasebesi, tam MRP (malzeme ihtiyaç planlaması), kalite kontrol formları. Bunlar Faz 6 ve sonrasında ayrı kararla ele alınır.

## 2. Terimler

| Saha dili | Kod adı | Açıklama |
|---|---|---|
| Parkur / hol / bölüm | `ProductionArea` | Makinelerin durduğu alan; tahtada satır grubu |
| Enjeksiyon makinesi | `ProductionMachine` | Kapama kuvveti, kolonlar arası mesafe, kalıp kalınlığı aralığı… |
| Kalıp | `Mold` | Bir veya birden çok ölçüyü, göz sayısıyla üretir |
| Kalıp çıktısı | `MoldOutput` | Kalıp → ürün modelinin ÖLÇÜSÜ (`ProductSize`, ör. `10.5.8`) + göz sayısı |
| Göz sayısı | `cavities` | Bir baskıda çıkan parça adedi |
| Çevrim süresi | `cycleTimeSec` | Bir baskının süresi (sn) |
| Kalıp bağlama (setup) | `setupMinutes` | Söküm + bağlama + ısınma |
| Üretim emri | `ProductionOrder` | NE (varyant `10.5.8.V1`), NE KADAR, NE ZAMANA |
| Üretim işi (çalıştırma) | `ProductionJob` | Emrin bir makine + kalıpta kesintisiz planlanan parçası — tahtadaki çubuk |
| Lot | `ProductionLot` | İşin bir vardiyaya düşen dilimi: `1000-1`, `1000-2`… |
| Vardiya düzeni | `ShiftPattern` / `ShiftDefinition` | 3×8, 2×12, 16 saat, 24 saat… |
| Duruş | `MachineDowntime` (Faz 4: `ProductionEvent`) | Bakım, arıza, malzeme bekleme… |
| Fire | `scrapQuantity` | Hatalı parça |
| OEE | — | Kullanılabilirlik × Performans × Kalite |

## 3. Mevcut sistemle bağlantı

- **Ürün → varyant zinciri aynen kullanılır.** `ProductVariant` = ürün modeli (`Product`) + ölçü (`ProductSize`, kodun 3. segmenti) + versiyon (`VariantVersion` = renk + hammadde). Kalıp **ölçüye** bağlanır (`MoldOutput.productSizeId`): aynı kalıp o ölçünün tüm renk/hammadde versiyonlarını basar; renk ve hammadde yalnız hızı (çevrim) etkiler. Kalıbı olmayan ölçüler (tedarikçiden gelenler) planlamada "üretilebilir" listesine hiç girmez.
- **Aile kalıbı (kullanıcı teyidi, 2026-09-25):** bir kalıpta aynı ürün modelinin farklı ölçülerinden de, FARKLI ürün modellerinden de gözler olabilir. Her göz grubu ayrı bir `MoldOutput` satırıdır (ölçü + göz sayısı). Tek baskı tüm gözleri aynı anda ve aynı renk/hammaddeyle doldurduğu için böyle bir kalıpla yapılan iş **birden çok çıktı** üretir → §5.2 `ProductionJobOutput`, §5.3.
- **Material** katalog modeli yalın kalır; üretime özgü bilgiler 1:1 yan tabloya (`MaterialProcessProfile`) — gerekçe §5.3.
- **Color.hex:** renk değişiminde temizleme (purge) maliyetini düşüren "açıktan koyuya" sıralama için parlaklık doğrudan hex'ten hesaplanır; ek veri girişi yok.
- **Order / OrderItem:** müşteri siparişine bağlı üretim emri (opsiyonel bağ); `OrderStatus.IN_PRODUCTION` zaten var.
- **Rol altyapısı:** Cognito grubu + `authMiddleware` bayrakları + `PanelShell` + `features/auth/lib/navigation.ts`.
- **UI:** `PanelShell`, `AdminListPagination`, `AdminListRefreshBar`, `AdminSectionLoadingOverlay`, `DialogFormSection`; shadcn `sheet`, `tooltip`, `popover`, `tabs`, `scroll-area`, `chart`; grafikte mevcut `recharts`, Excel'de mevcut `exceljs`.
- **Saf planlayıcıyı frontend'le paylaşma emsali:** `features/admin/productVariantMatrix/utils/previewVariantCodes.ts`, backend'in kullandığı saf `assignProductVariantCodes`'u `@core/*` alias'ıyla içe alıyor. Planlama motoru aynı desenle yazılır → sürükleme sırasındaki canlı doğrulama ile sunucunun kararı AYNI koddan gelir. (Fiyat zincirinin iki yerde ayrı uygulanması sorunu burada baştan önlenir.)
- **İleride:** `UserAccessRealtime` (SST Realtime + frontend `mqtt`) tahtanın canlı güncellenmesi için; `ActivityLog` plan değişiklik geçmişi için; `UserNotification` gecikme/duruş bildirimleri için.

## 4. Roller ve yetkiler

| Rol (Cognito grubu) | Etiket | Panel | Faz |
|---|---|---|---|
| `production_planner` | Üretim Planlama | `/uretim` | 1 |
| `production_operator` | Üretim Operatörü | `/operator` (mobil öncelikli) | ertelendi — bu aşamada operatör hesabı yok |
| `admin`, `owner` | — | ikisine de erişir | — |

| Yetenek | planner | operator | admin/owner |
|---|---|---|---|
| Makine / kalıp / parkur / vardiya / operatör tanımları | ✓ | – | ✓ |
| Üretim emri, planlama, sahaya verme | ✓ | – | ✓ |
| Vardiya ekibi atama (operatör ↔ makine ↔ vardiya) | ✓ | – | ✓ |
| Lot notu | ✓ | ✓ (yalnız kendi lotları) | ✓ |
| Başlat / duraklat / sayım / fire girişi | ✓ (operatör adına) | ✓ (yalnız kendi makinesi/vardiyası) | ✓ |
| İstatistikler | ✓ | – | ✓ |

**Operatör kimliği (karar, 2026-09-25):** operatörler bu aşamada sisteme GİRMEZ. `ProductionOperator` yalnız personel kaydıdır (giriş hesabı bağı yok); lot notlarını ve sayımları üretim planlayıcısı yazar. Yukarıdaki tablodaki "operator" sütunu ileriki bir karar içindir: operatör hesabı gelirse `production_operator` rolü açılır ve personel kaydına opsiyonel bir `userId` bağı eklenir (`CompanyContact` ↔ `User` ayrımıyla aynı desen).

**Operatör ataması (öneri) — vardiya ekibi modeli:** atama işe değil **makine × vardiya** hücresine yapılır (`MachineShiftAssignment`: "25 Eylül A vardiyası, M-01: Ahmet"). O vardiyada o makinede hangi lot üretiliyorsa operatörünü oradan alır; lot başlarken operatörler lota kopyalanır (istatistik için), gerekirse lot bazında düzeltilir. İş başka makineye taşınınca atama kendiliğinden doğru kalır — sahada da operatör makineye bakar. Bir operatör aynı vardiyada birden çok makineye bakabilir.

### Yeni rol ekleme kontrol listesi (Dilim 1.1)

Rol listesi kodda ~17 yerde tekrarlanıyor (`content_editor` / `sales_director` izleri):

- `infra/cognito.ts` — `UserGroup` (`production_planner`, precedence 10)
- core `middleware/authMiddleware.ts` — `KNOWN_GROUPS` + `isProductionPlanner`
- core `helpers/utils/api/types.ts` — bayrak tipi
- core `helpers/userAccess/types.ts` — `ALL_USER_GROUPS`, `BUSINESS_USER_GROUPS`
- core `helpers/userAccess/messaging.ts` — etiket
- functions `AdminApi/validators/users.ts`, `OwnerApi/validators/users.ts` — `z.enum`
- functions `AdminApi/types/users.ts`, `OwnerApi/types/users.ts`
- frontend `lib/auth/cognito-tokens.ts` — `KNOWN_GROUPS` (**eksik kalırsa grup token'dan sessizce düşer**)
- frontend `features/admin/users/schema/userEditor.ts`, `features/admin/users/api/updateUserRole.ts`, `components/admin/AdminUserMenu.tsx`
- frontend `features/auth/lib/navigation.ts` (`resolveAuthHome`, `canAccessPath`), `proxy.ts` (`AUTH_PROTECTED_PREFIXES`)
- frontend `app/(panels)/uretim/layout.tsx`, `components/panels/navigation/productionNav.ts`, `components/panels/panelNavIcons.ts`
- dokümanlar: AGENTS.md (access lifecycle), ARCHITECTURE.md (role topology + role model), PROJECT_OVERVIEW.md (grup sayısı 9 → 10)

**Dilim 1.1'de yapıldı:** grup adları artık tek kaynaktan okunuyor — `packages/core/src/core/helpers/userAccess/groups.ts` (saf, importsuz). Backend `authMiddleware`, Admin/Owner API rol validator'ları (`z.enum(ALL_USER_GROUPS)`) ve frontend token ayrıştırıcısı (`lib/auth/cognito-tokens.ts`) ondan türüyor. Faz 4'teki `production_operator` için dokunulacak yerler: `groups.ts` + `infra/cognito.ts` + `authMiddleware` bayrağı + `navigation.ts`/`proxy.ts` + panel layout'u + etiketler (`messaging.ts`, `userEditor.ts`, `AdminUserMenu.tsx`).

## 5. Veri modeli

> **§5.1 uygulandı (Dilim 1.2):** tek kaynak `packages/core/prisma/schema.prisma` ("ÜRETİM PLANLAMA — TANIMLAR" bölümü), migration `20260925120000_add_production_master_data`. **§5.2 hâlâ taslaktır (pseudo-Prisma)**; Dilim 2.1'de ayrıca onaya sunulur.

Hepsi additive (yeni tablo/enum); mevcut tablolarda kolon değişikliği YOK, yalnız Prisma'da ters ilişki alanları eklenir. Tipler: mm / ton / dakika / adet `Int`; çevrim süresi, ağırlık gibi mühendislik değerleri `Float` (mevcut `ProductSizeValue.value` gibi — JSON'da düz sayı, `Decimal`'in `{s,e,d}` derdi yok); para (`hourlyCost`) `Decimal`.

### 5.1 Tanımlar (Faz 1) — ✅ uygulandı

| Model | Ne tutar | Önemli alanlar |
|---|---|---|
| `ProductionArea` | parkur / hol | `code`, `name`, `sortOrder`, varsayılan vardiya düzeni |
| `ProductionMachine` | enjeksiyon makinesi | `clampForceTon` (zorunlu), kolonlar arası yatay/dikey, kalıp kalınlığı min/maks, açılma stroku, `maxDaylightMm` (plaka açıklığı — hidrolik kapama, 1.6), `shotCapacityG` (föydeki PS değeri), merkezleme bileziği, sıcak yolluk bölgesi, maça devresi, robot, `plannedEfficiencyPercent` (85), `hourlyCost`, vardiya düzeni, `status` |
| `Mold` | kalıp | `standardCycleTimeSec` (zorunlu), gerekli tonaj, dış ölçüler (genişlik/yükseklik/kalınlık), ağırlık, strok, bilezik, sıcak yolluk, maça, robot, yolluk ağırlığı, beklenen fire, `setupMinutes` (60), baskı sayacı + bakım aralığı, sahiplik (şirket / müşteri), `status` |
| `MoldOutput` | kalıbın göz grubu → ölçü | `productSizeId` (**Restrict**), `cavities`, `partWeightG`; `@@unique([moldId, productSizeId])` — aynı kalıpta farklı ürün modellerinin ölçüleri olabilir |
| `MoldMachineProfile` | kalıp + makine kartı | kanıtlanmış çevrim/setup süresi, `isPreferred`, `isBlocked` |
| `MaterialProcessProfile` | hammaddenin üretim bilgisi (1:1) | `isMoldResin`, `family`, yoğunluk, kurutma, `cycleTimeFactor` (1) |
| `ShiftPattern` + `ShiftDefinition` | vardiya düzeni — makinenin günde kaç saat çalıştığı (12 / 16 / 24) | `isDefault`, `timezone`; vardiya `code`, `startMinute`, `durationMinutes`, `daysOfWeek` |
| `ProductionCalendarException` | bayram / toplu izin / ek mesai günü | `date`, `kind`, kapsam: fabrika / alan / makine |
| `MachineDowntime` | planlı bakım / arıza penceresi | `startAt`, `endAt`, `kind`, `reason` |
| `ProductionOperator` | personel (giriş hesabı DEĞİL) | ad, soyad, sicil no, telefon, `isActive` |

**Vardiya günü (Dilim 1.3'te netleşti):** vardiya günü, düzenin İLK vardiyasının başladığı gündür; saati ilk vardiyadan önce olan vardiya ertesi takvim gününe düşer ama o güne aittir (A 08:00, B 16:00, C 00:00 → C gece devamı) ve `daysOfWeek` vardiya gününe göredir. Bir düzende en fazla 4 vardiya, örtüşme yok, vardiya günü 24 saati aşamaz. Makinenin geçerli düzeni: makinenin seçimi → alanının seçimi → varsayılan düzen (`resolveEffectiveShiftPattern`). Hepsi tek yerde: `core/helpers/production/shiftPatterns.ts` (saf; backend ve form aynı fonksiyonu kullanır).

Plan taslağından farklar (kullanıcı kararları, 2026-09-25):
- **Proses tipi yok:** bakalit makineleri planlamaya dahil değil → `ProductionProcessType` enum'u ve `processType` alanları çıkarıldı. Gerekirse varsayılan değerli bir kolonla eklenir ve uygunluk motoruna "proses" kontrolü girer.
- **Operatör hesabı yok:** `ProductionOperator.userId` ve `processTypes` çıkarıldı.
- **Vardiya ekibi (`MachineShiftAssignment`) Faz 3.5'e taşındı:** o zamana kadar kullanılmayacak tablo açılmadı (§5.2'de).
- Makine ve kalıpta ayrı `isActive` yok — `status` (`INACTIVE` / `RETIRED`) tek kaynak.

### 5.2 Planlama ve takip (Faz 2)

```prisma
model ProductionOrder {                // üretim emri
  id, orderNumber @unique              // "UE-20260925-0001"
  productVariantId → ProductVariant (Restrict)   // 10.5.8.V1
  quantity Int                         // hedef sağlam adet
  dueDate  DateTime?                   // termin
  priority ProductionPriority @default(NORMAL)   // LOW | NORMAL | HIGH | URGENT
  source   ProductionOrderSource                 // CUSTOMER_ORDER | STOCK | MANUAL
  orderItemId String? → OrderItem (SetNull)
  customerId  String? → Customer  (SetNull)
  cycleTimeOverrideSec Decimal?
  status ProductionOrderStatus @default(DRAFT)   // DRAFT | PLANNED | RELEASED | IN_PROGRESS | COMPLETED | CANCELLED | ON_HOLD
  notes, createdByUserId
  jobOutputs ProductionJobOutput[]     // emir, işe ÇIKTI satırı üzerinden bağlanır (aile kalıbı)
  @@index([status, dueDate])
  @@index([productVariantId])
}

model ProductionJob {                  // tahtadaki çubuk: bir makine + bir kalıp + kesintisiz üretim
  id
  machineId → ProductionMachine (Restrict)
  moldId    → Mold (Restrict)
  // Baskının AYARI: tüm gözler aynı renk + hammaddeyle dolar. VariantVersion.signature
  // biçimi ürün modelinden bağımsız ("color:<id>|materials:<id>,<id>") → farklı modellerin
  // çıktıları aynı imzayla eşleşir.
  versionSignature String
  colorId String?                      // tahtadaki renk şeridi + açıktan koyuya sıralama
  lotBaseNumber Int @unique @default(autoincrement())  // id gibi otomatik artan kök: "1000"
  plannedShots      Int                // baskı sayısı; çıktı adetleri = baskı × göz
  setupStartAt      DateTime           // makine bu andan itibaren dolu
  productionStartAt DateTime
  plannedEndAt      DateTime
  // planlama anı kopyaları — sözlük sonradan değişse de plan açıklanabilir kalır
  cycleTimeSec Decimal, efficiencyPercent Int, setupMinutes Int
  status ProductionJobStatus @default(PLANNED)  // PLANNED | RELEASED | SETUP | RUNNING | PAUSED | COMPLETED | CANCELLED
  actualStartAt?, actualEndAt?
  version Int @default(0)              // iyimser eşzamanlılık (iki planlayıcı)
  notes
  outputs ProductionJobOutput[]
  lots    ProductionLot[]
  @@index([machineId, setupStartAt])
  @@index([moldId, setupStartAt])
  @@index([status])
}

model ProductionJobOutput {            // işin bir göz grubundan çıkan çıktısı (tek gözlü kalıpta tek satır)
  id, jobId → ProductionJob (Cascade)
  moldOutputId → MoldOutput (Restrict)            // ölçü + göz sayısının kaynağı
  productSizeId                                   // kopya — istatistik sorguları join'siz
  productVariantId  String? → ProductVariant      // o ölçünün, işin renk+hammaddesindeki varyantı (katalogda varsa)
  productionOrderId String? → ProductionOrder     // karşıladığı emir; boşsa yan ürün (stok)
  cavities        Int                             // plan anındaki aktif göz — kapatılmış göz = 0
  plannedQuantity Int                             // plannedShots × cavities
  goodQuantity    Int @default(0)                 // lot çıktılarından toplanır
  scrapQuantity   Int @default(0)
  @@unique([jobId, moldOutputId])
  @@index([productionOrderId])
  @@index([productSizeId])
}

model ProductionLot {                  // işin vardiyaya düşen dilimi
  id, jobId → ProductionJob (Cascade)
  sequence  Int                        // 1, 2, 3
  lotNumber String @unique             // "1000-2"
  shiftDate @db.Date, shiftCode        // vardiya GÜNÜ (ilk vardiyanın günü; gece vardiyası da ona ait)
  plannedStartAt, plannedEndAt, plannedShots
  actualStartAt?, actualEndAt?
  startShotCounter Int?, endShotCounter Int?
  status ProductionLotStatus @default(PLANNED)  // PLANNED | RUNNING | COMPLETED | CANCELLED
  outputs   ProductionLotOutput[]      // lotun çıktı bazında adetleri
  operators ProductionLotOperator[]    // lot başlarken vardiya ekibinden kopyalanır, düzeltilebilir
  notes     ProductionLotNote[]
  @@unique([jobId, sequence])
  @@index([shiftDate, shiftCode])
}

model ProductionLotOutput {            // "1000-2 lotunda 1.3.2'den 1.180 sağlam, 1.5.4'ten 1.175 sağlam"
  id, lotId → ProductionLot (Cascade), jobOutputId → ProductionJobOutput (Cascade)
  plannedQuantity Int
  goodQuantity    Int @default(0)
  scrapQuantity   Int @default(0)
  @@unique([lotId, jobOutputId])
}

model ProductionLotOperator {          // lotu üreten operatörler (istatistik için kopya)
  id, lotId → ProductionLot (Cascade), operatorId → ProductionOperator (Restrict)
  @@unique([lotId, operatorId])
}

model ProductionLotNote {
  id, lotId → ProductionLot (Cascade), authorUserId → User
  authorRole (PLANNER | OPERATOR | ADMIN)
  category (GENERAL | QUALITY | MAINTENANCE | MATERIAL | HANDOVER)
  body @db.Text, createdAt
  @@index([lotId, createdAt])
}

model MachineShiftAssignment {         // vardiya ekibi (Dilim 3.5) — operatör ↔ makine ↔ vardiya
  id, machineId, shiftDate @db.Date, shiftCode, operatorId
  @@unique([machineId, shiftDate, shiftCode, operatorId])
  @@index([operatorId, shiftDate])
}
```

Faz 4.2'de (2026-09-28) belgedeki genel `ProductionEvent` akışı yerine daha dar bir model seçildi (operatör hesabı yok; girişi planlayıcı vardiya sonunda yapar): tek sözlük `ProductionReason` (tür STOP / SCRAP, duruşta kategori), lottaki fiili duruş `ProductionStop`, lot çıktısı fire kırılımı `ProductionLotScrap`, lot rapor alanları (`actualShots`, `reportedAt`, `reportedByUserId`) ve iş durum geçmişi `ProductionJobStatusChange`. Anlık olay akışı (operatör ekranı) 4.1 ile birlikte yeniden değerlendirilir.

### 5.3 Model kararları

- **Emir ≠ iş.** Bir emir paralel iki makineye bölünebilir ya da acil bir iş araya girdiği için zaman içinde kesilebilir → birden çok iş. Her işin kendi lot kökü olur.
- **Aile kalıbı = tek baskı, çok çıktı.** İş adet değil **baskı** planlar; her göz grubu bir `ProductionJobOutput` satırıdır ve adedi `baskı × göz` ile çıkar. Emirler işe bu çıktı satırları üzerinden bağlanır → bir aile kalıbı işi aynı anda iki emri (ör. `1.3.2` ve `1.5.4`) karşılayabilir; emri olmayan çıktı yan ürün olarak stoğa gider. Aynı baskıdaki çıktılar zorunlu olarak aynı renk + hammaddededir: işe bağlanan emirlerin varyant versiyon imzası işin `versionSignature`'ıyla aynı olmalı (farklı renkli emirler aynı işte birleşemez). Bir çıktının o renk+hammaddede katalog varyantı yoksa çıktı ölçü + imza düzeyinde sayılır ve planlayıcı uyarılır; fiziksel olarak mümkünse o gözler iş bazında kapatılabilir (`cavities = 0`).
- **Lot numarası (karar, 2026-09-25):** belirli bir standart gerekmiyor. Kök, iş oluşturulurken **id gibi otomatik artan** bir sayıdan gelir (`@default(autoincrement())`; başlangıç değeri migration'da ayarlanabilir), ek (`-1`, `-2`, `-3`) vardiya sırasıdır. Aynı kök = aynı üretim; iş başka vardiyada ya da günde devam etse de sıra sürer. Silinen taslak işler numarada boşluk bırakabilir — standart istenmediği için sorun değil. Kök sonradan değişmez; geriye dönük takip bu sayı üzerinden yapılır.
- **Lotlar ne zaman yazılır (2.3'te değişti):** "Planla" anında PLANNED olarak yazılır — kök (`lotBaseNumber`, 1000'den) iş oluşurken alınır, lot numarası saklanmaz: `kök-sıra`. Planlı iş iptal edilirse iş ve lotları silinir (kök numarada boşluk kalabilir — standart istenmedi). Sonradan iş kayarsa başlamamış lotlar yeniden bölünür (Faz 3); başlamış/bitmiş lotlara dokunulmaz.
- **Çakışma koruması uygulama katmanında:** işlem içinde ilgili makine satırları `SELECT … FOR UPDATE` ile kilitlenir, makine/kalıp örtüşmesi motorla kontrol edilir, `version` uyuşmazlığı 409 döner. Postgres `EXCLUDE USING gist` kısıtı **şimdilik yok**: Prisma bu kısıtı şemada temsil edemiyor ve ertelenmiş (deferred) EXCLUDE ihlalinin interaktif transaction'da hata fırlatmadan geri alındığı açık bir Prisma hatası var (#26366). Kubi'de bir spike ile güvenli olduğu kanıtlanırsa sonradan emniyet ağı olarak eklenebilir.
- **Ölçü koruması (Dilim 1.2):** `MoldOutput → ProductSize` `Restrict`. Ölçü silen üç yol buna göre uyarlandı: `removeOrphanSizes` (veri girişinde varyant satırı silinince çalışan temizlik) kalıbı olan ölçüyü ATLAR; `mergeProductSizesByRequiredSignature` (tek seferlik backfill) kopyanın kalıp gözlerini keeper'a taşır — aynı kalıbın iki ölçüdeki gözleri toplanır; ürün modeli silme, ölçüleri kalıba bağlıysa FK hatasına düşmeden **409** döner (`productRepository.countMoldOutputs`). Yeni bir ölçü silme akışı yazan da aynı kuralı uygulamalı (AGENTS.md).
- **Takvim istisnası GÜN başına (Dilim 1.5):** kayıt tek gündür (`date`, `@db.Date`, "YYYY-MM-DD" anahtarıyla taşınır, UTC gece yarısı yazılır). Motor "bu makine bu vardiya gününde çalışıyor mu?" sorusunu gün üzerinden sorar. Kullanıcı aralık girer: istek günlere açılır, liste ardışık günleri (türü + notu + kapsamı aynı) tek satırda birleştirir (`groupCalendarExceptionDays`); düzenleme `replaceIds` ile eski günleri silip yeni aralığı tek transaction'da yazar. Aynı gün + aynı kapsamda tek kayıt — uygulama katmanında (NULL'lı unique index bu çakışmayı yakalamaz). Farklı kapsamlar bir arada olabilir; en dar kapsam geçerlidir: makine > alan > fabrika (fabrika tatilken bir alan ek mesai yapabilir). Yarım gün (arife) desteklenmez. `EXTRA_WORKDAY` o gün düzen `daysOfWeek`'ine bakmadan çalışılır demektir (vardiyalar düzenden).
- **Duruş = yarı açık zaman aralığı (Dilim 1.5):** [başlangıç, bitiş); uç uca değen iki duruş çakışmaz, aynı makinede kesişen iki duruş reddedilir (409). Makinenin `status`'ü (Bakımda / Arızalı) ayrı bir bilgidir ve duruş kaydı onu değiştirmez.
- **Fabrika saati (Dilim 1.5):** zaman damgaları UTC saklanır; ekranda ve formda `Europe/Istanbul` duvar saatiyle girilir ve gösterilir (`core/helpers/production/productionTime.ts`, `PRODUCTION_TIME_ZONE`). Tarayıcının dilimine güvenilmez, +03:00 sabit yazılmaz — `Intl` ile dönüştürülür (dilimin kuralı değişirse doğru kalır). Faz 2 motoru vardiya pencerelerini aynı yardımcılarla kurar.
- **Material'a yan tablo:** katalog `Material` public/portal yanıtlarında dönüyor; üretim kolonları oraya eklenirse ya yanıtlara sızar ya da her select'in ayrıca daraltılması gerekir. 1:1 tablo bu riski sıfırlar.
- **Transaction disiplini (Neon/P2028 dersi):** işlem içinde yalnız kilit + çakışma okuması + yazma; toplu lot yazımı ve "sonrakileri kaydır" tek `$executeRaw` + `UNNEST` ifadesiyle; işlem içinde global `prisma` kullanılmaz; harici çağrı yapılmaz.

## 6. Planlama motoru (core — saf, testli)

Konum: `packages/core/src/core/helpers/production/`. I/O yok, Prisma yok, **yalnız göreli import** (frontend `@core/*` ile içe alabilsin diye — core'daki `@/` alias'ı frontend'de çözülmez; `productVariants/` altındaki paylaşılan saf yardımcılar da böyle yazılmış).

| Modül | Sorumluluk |
|---|---|
| `productionTime.ts` ✅ 1.5 | Europe/Istanbul duvar saati ↔ UTC dönüşümü (tek yer; `Intl` ile, yeni bağımlılık yok) |
| `productionCalendar.ts` ✅ 1.5 | Takvim istisnası günleri: aralık ↔ gün, kapsam anahtarı, birleşik liste |
| `machineDowntimes.ts` ✅ 1.5 | Duruş aralığı kuralları (yarı açık), çakışma, sürüyor / yaklaşan |
| `shiftCalendar.ts` ✅ 2.2 | Vardiya düzeni + takvim istisnası + duruşlardan makine başına **çalışma pencereleri** ve vardiya örnekleri |
| `jobScheduling.ts` ✅ 2.2 | Çevrim zinciri, adet → baskı → süre, çalışma pencerelerinde ileri planlama, vardiya lotlarına bölme (plandaki `jobDuration` + `lotSplit` + `cycleTime` tek modülde) |
| `orderCandidates.ts` ✅ 2.2 | "Öner": emrin ölçüsünü basan kalıp × uygun makine planları (bitiş, termin, maliyet, lotlar) — `candidateRanking`'in ilk hâli |
| `moldMachineCompatibility.ts` ✅ 1.6 | Kalıp ↔ makine uygunluk kontrolleri + önerilen makine (aşağıda) |
| `scheduleConflicts.ts` | Makine/kalıp örtüşmesi, duruşa denk gelme, termin aşımı, bakım sayacı aşımı, operatör çakışması |
| `rippleSchedule.ts` | "Sonrakileri kaydır": başlamamış işleri gereken kadar ileri iter; çalışan işlere dokunmaz |
| `cycleTime.ts` | Çevrim süresi çözüm zinciri (tek kaynak) |
| `candidateRanking.ts` | "Öner": uygun (makine, kalıp, en erken slot) adaylarını açıklamalı sıralar |
| `colorSequencing.ts` | Hex → parlaklık; açıktan koyuya geçiş cezası |
| `jobStateMachine.ts` | Durum geçişleri — kanban sürüklemesi ve operatör aksiyonları aynı kurala uyar |

**Süre formülü**

```
tek çıktı:    baskı = ⌈ adet ÷ (göz × (1 − beklenen fire)) ⌉
aile kalıbı:  baskı = max_i ⌈ adet_i ÷ (göz_i × (1 − beklenen fire)) ⌉   (yalnız emri olan çıktılar)
              diğer çıktılar = baskı × göz_i                            (yan ürün → stok)
üretim_dk  = baskı × çevrim_sn ÷ 60 ÷ verim
toplam_dk  = setup_dk + üretim_dk   → sonra çalışma pencerelerine yayılır
```

Örnek: 10.000 adet, 4 göz, 20 sn çevrim, %85 verim, 45 dk setup → 2.500 baskı → 50.000 sn ≈ 13,9 sa ÷ 0,85 ≈ 16,3 sa + 0,75 sa ≈ **17,1 saat**.
- 3×8 düzeninde 08:00'de başlarsa: **1000-1** 08:00–16:00 (setup + 7,25 sa üretim), **1000-2** 16:00–24:00, **1000-3** 00:00–01:05.
- 2×12 düzeninde: **1000-1** 08:00–20:00, **1000-2** 20:00–01:05.
- Günde 16 saat çalışan (08:00–24:00) makinede: **1000-1** Perşembe 08:00–24:00, gece durur, **1000-2** Cuma 08:00–09:05.

**Çevrim süresi çözüm zinciri** (ilk bulunan kazanır):
1. Üretim emrindeki elle giriş (`cycleTimeOverrideSec`)
2. Kalıp + makine kanıtlanmış ayarı (`MoldMachineProfile.cycleTimeSec`)
3. Kalıp referansı × hammadde katsayısı (`Mold.standardCycleTimeSec × MaterialProcessProfile.cycleTimeFactor`)
4. (✅ 5.3) Geçmiş lotların gerçekleşen ortalaması — **öneri** olarak gösterilir, otomatik yazılmaz: Kalıp İstatistikleri'nde kalıp × makine başına (renk / hammadde kırılımı bilgi amaçlı); planlayıcı "Karta uygula" derse 2. adıma (makine kartı) yazılır ve sonraki planlar onu kullanır.

İşteki göz sayısı plan anında düzeltilebilir (kapatılmış göz).

**Kalıp ↔ makine uygunluk kontrolleri** (✅ 1.6, `moldMachineCompatibility.ts`) — her kontrol `ok | warning | unknown | error` + gerekçe; çiftin hükmü en kötüsüdür (error > warning > unknown > ok):

| Kontrol | Kural | Seviye |
|---|---|---|
| Kapama kuvveti | `machine.clampForceTon ≥ mold.requiredClampForceTon` | error |
| Kolonlar arası | kalıp BİR yönde geçmeli: `widthMm < tieBarHorizontalMm` (yukarıdan iner) ya da `heightMm < tieBarVerticalMm` (yandan girer) | error |
| Kalıp kalınlığı | `minMoldHeightMm ≤ thicknessMm ≤ maxMoldHeightMm`; açıklık biliniyorsa `thicknessMm < maxDaylightMm` (ince kalıp → "ara plaka gerekir") | error |
| Açılma | kullanılabilir = min(`maxOpeningStrokeMm`, `maxDaylightMm − thicknessMm`) ≥ `requiredOpeningStrokeMm` — hidrolik kapamada açılma kalınlıkla azalır | error |
| Baskı kapasitesi | baskı (Σ göz × parça + yolluk) > kapasite → error; kapasitenin %20–80'i dışı → warning. Kapasite PS cinsinden; hammaddeye göre kesin hesap Faz 2'de | error / warning |
| Sıcak yolluk | makinede yeterli bölge yoksa harici kontrol cihazı gerekir | warning |
| Maça / robot | makinede yeterli devre / robot yok | error |
| Merkezleme bileziği | iki taraf da biliniyorsa çaplar eşleşmeli (bilezik/adaptör değişir) | warning |
| Bilinçli engel | `MoldMachineProfile.isBlocked` | error |
| Durum | makine `INACTIVE` / kalıp `RETIRED` → error; bakımda / arızalı → warning | error / warning |
| Eksik veri | kontrolün ihtiyaç duyduğu alan boş | unknown ("eksik bilgi") — planı kilitlemez |

Ayrı bir "aşırı büyük makine" kontrolü yok: öneri sıralaması en küçük uygun presi seçer, baskının kapasitenin %20'sinin altında kalması da uyarı üretir. **Önerilen makine** (`recommendMachineForMold`): ✓/⚠ olanlar arasında kalıp kartında tercih edilen → ✓ olan → en küçük tonaj → kod. Matris ekranı (`/uretim/uyumluluk`) ayrı API ucu olmadan makine + kalıp listelerinden istemcide hesaplar; Faz 2'nin "Öner" sıralaması aynı fonksiyonla aday süzer.

Bakalit makineleri planlamaya dahil edilirse (şu an değil) "proses tipi eşleşmeli" kontrolü eklenir.

**"Öner" sıralaması** (açıklamalı; ağırlıklar ayarlanabilir):
1. Termine yetişiyor mu / kaç saat gecikir
2. Bitiş zamanı
3. Maliyet = `hourlyCost × çalışma saati` + setup maliyeti
4. Tonaj uyumu — yeterli olan en küçük makine tercih edilir (büyük kapasite korunur)
5. Önceki işten geçiş cezası — aynı kalıp / aynı hammadde ailesi / açıktan koyuya renk: ceza yok; koyudan açığa: temizleme cezası
6. Kalıp bakım sayacı
7. Aile kalıbı: yan çıktıların açık emri varsa artı puan ("aynı baskıda UE-…-0043'ü de karşılar"), yoksa gereksiz stok cezası ya da göz kapatma önerisi

Her aday için gerekçe satırları döner, ör. *"M-02 · 250 t · %42 tonaj kullanımı · Cuma 14:20'de biter · termine 2 gün var · önceki iş aynı hammadde"*.

**İleri faz (6):** açgözlü otomatik planlayıcı (termine göre sırala → en iyi adaya yerleştir → makine içinde renkleri açıktan koyuya diz) + "ne olursa" önizlemesi. Gerçekten gerekirse OR-Tools CP-SAT (Python Lambda).

## 7. API — ProtectedApi `/production/*`

İş kullanıcısı çalışma alanı olduğu için **ProtectedApi** (satış/satın almayla aynı sınır). Her route ayrı Lambda (mevcut desen); modülün tamamı ≈ 40 route (ProtectedApi bugün 92 route). Yetki: planlama uçları `["production_planner", "admin", "owner"]`; operatör hesabı ileride açılırsa operatör uçları `["production_operator", "production_planner", "admin", "owner"]` + handler'da "yalnız kendi atamaları" zorlaması.

| Faz | Uçlar |
|---|---|
| 1 | ✅ 1.3: `GET/POST /production/areas`, `PATCH/DELETE /production/areas/{id}` · `GET/POST /production/shift-patterns`, `PUT/DELETE /production/shift-patterns/{id}` (PUT = vardiya listesinin tam değişimi) · `GET/POST /production/machines`, `GET/PATCH/DELETE /production/machines/{id}` · ✅ 1.4: `GET /production/references/products`, `GET /production/references/products/{id}/sizes` (dar sözlük: ürün modeli → ölçüler + etiket) · `GET/POST /production/molds`, `GET/PATCH/DELETE /production/molds/{id}` (göz grupları `outputs` ve makine kartları `machineProfiles` aynı istekte, gönderilirse TAM değişim — ayrı uç yok) · `GET /production/material-profiles`, `PUT /production/material-profiles/{materialId}` (upsert) · ✅ 1.5: `GET/POST /production/operators`, `PATCH/DELETE /production/operators/{id}` · `GET /production/calendar-exceptions?from&to` (günler), `POST /production/calendar-exceptions` (aralığı günlere açar; `replaceIds` → düzenleme), `POST /production/calendar-exceptions/bulk-delete` · `GET /production/machine-downtimes?machineId&from&to` (pencereyle kesişenler), `POST /production/machine-downtimes`, `PATCH/DELETE /production/machine-downtimes/{id}` — yetki listesi tek kaynakta: `functions/shared/production/access.ts` |
| 2 | ✅ 2.3: `POST /production/orders/{id}/jobs` (Planla), `DELETE /production/jobs/{id}` (planlı işi iptal) · ✅ 2.2: `GET /production/orders/{id}/candidates` (plan önizlemesi) · ✅ 2.1: `GET /production/orders?page&limit&q&status` (sunucuda sayfalı; `status` = open / all / tek durum), `POST /production/orders`, `PATCH/DELETE /production/orders/{id}` · `GET /production/references/products?moldable=true`, `GET /production/references/products/{id}/variants` (üretilebilir ölçüler → varyantlar + kalıplar), `GET /production/references/customers?q` (yalnız id + ad) — kalanlar: · `GET /production/orders/{id}/candidates` (Öner) · `POST /production/jobs` (planla) · ✅ 3.3: `POST /production/orders/{id}/jobs` gövdesi genişledi — `moldId` opsiyonel (verilmezse makinede en erken biten kalıp), `startAt` (en erken başlangıç), `placement` (`first-gap` | `push-later`); yanıt `{ order, shifted, shiftedJobs }` · ✅ 3.2: `PATCH /production/jobs/{id}/schedule` (taşı: `{ machineId, startAt, expectedVersion, placement? }`; aynı kalıp, istenen andan sonraki ilk uygun boşluk; sürüm tutmazsa 409) · `POST /production/jobs/{id}/split` · `POST /production/jobs/{id}/release` (sahaya ver: kök numara + lotlar) · `DELETE /production/jobs/{id}` |
| 3 | ✅ 3.1: `GET /production/board?from&to` (dar DTO; 3.3'ten beri Taslak emirler de `pendingOrders` + makine uygunluğuyla, en çok 50; en fazla 31 gün, verilmezse bugün + 6 gün; alan süzgeci istemcide — satır sayısı küçük) — ✅ 3.5: `GET /production/lots?from&to&machineId&q&page&limit` (sayfalı; arama tüm tarihlerde), `GET /production/lots/{lotNumber}` ("1000-2"), `PUT /production/lots/{lotNumber}/operators` (lota özel ekip; boş = vardiya ekibine dön), `POST /production/lots/{lotNumber}/notes`, `DELETE /production/lot-notes/{id}` (yazan ya da admin/owner), `GET /production/shift-assignments?date`, `PUT /production/shift-assignments` (hücre tam değişim; boşaltmak serbest), `POST /production/shift-assignments/copy` · ✅ 4.2: `GET/POST /production/reasons`, `PATCH/DELETE /production/reasons/{id}`, `POST /production/reasons/defaults`, `POST /production/lots/{lotNumber}/start`, `PUT /production/lots/{lotNumber}/report` · ✅ 4.3: `POST /production/jobs/{id}/push-followers` (gövdesiz; yanıt `{ projectedEndAt, delayMinutes, shiftedJobs }`; planlı / kapanmış / plana uygun / arkasında planlı iş olmayan işte 409), `POST /production/molds/{id}/maintenance` (`{ performedAt? }`, gelecekte olamaz); `GET /production/board` işlerine `forecast`, `moldMaintenance` ve lot gerçekleşenleri eklendi, planlı bitişi pencereden önce kalmış sahadaki iş de listelenir · ✅ 3.4: `GET /production/kanban` (aktif işler + son 7 günde tamamlananlar — 4.2'den beri durum geçmişinden), `PATCH /production/jobs/{id}/status` (`{ status, expectedVersion, outputs? }` — geçiş kuralı `jobStateMachine.ts`, tamamlamada her çıktı için sağlam + fire; emrin durumu işlerinden türetilip aynı transaction'da yazılır) |
| 4 | `GET /production/operator/assignments` · `POST /production/lots/{id}/events` (setup / başla / duraklat / devam / sayım / fire / bitir) |
| 5 | ✅ 5.1: `GET /production/stats/products?productId&sizeId&version&from&to` (ürün geçmişi: satırlar + özet + süzgeç seçenekleri — ürün modelinin ölçüleri ve versiyonları; pencere verilmezse son 12 ay, en fazla 3 yıl, en yeni 500 iş) · ✅ 5.2: `GET /production/stats/machines?from&to&areaId` (makine başına zaman dağılımı + OEE + en çok süre kaybettiren 10 duruş nedeni + toplam; süzgeç seçenekleri: makinesi olan alanlar; pencere verilmezse son 30 gün, en fazla 1 yıl, ŞİMDİ'de biter) · ✅ 5.3: `GET /production/stats/molds?from&to` (kalıp başına sayaç, bakım + açık işlerin kalanıyla öngörü, pencerede başlayan raporlu vardiyalardan gerçek çevrim; kalıp × makine kart ↔ gerçek ↔ plan ve öneri, kalıp × renk / hammadde; verilmezse son 90 gün, en fazla 3 yıl), `PATCH /production/molds/{id}/machine-profiles/{machineId}` (`{ cycleTimeSec }` — öneriyi makine kartına yazar; kart yoksa oluşur, tercih / engel işaretine dokunmaz) |

Uyumluluk matrisi için ayrı uç gerekmez: makine ve kalıp listeleri (dar DTO) çekilip matris istemcide aynı motorla hesaplanır.

**Canlı güncelleme (✅ 4.4):** her üretim YAZMA ucu, başarılı yazmadan sonra `${app}/${stage}/production/changes` konusuna yalnız bir ipucu yayınlar — `{ type: "production.changed", scopes, occurredAt, actorUserId }`, alanlar `plan` / `roster` / `lots` / `reasons` / `definitions` (sözleşme `core/helpers/production/productionRealtime.ts`). Mesaj veri taşımaz; `/uretim` paneli ilgili sorguları geçersiz kılar ve veriyi her zamanki uçlardan yetkiyle yeniden çeker. Abone olma yetkisi Realtime yetkilendiricisinde: yalnız erişimi ACTIVE ve üretim yetkili gruplar (5 dk'da bir veritabanından yeniden); tarayıcı yayın yapamaz. Uçlar `withProductionChange` ile sarılır ve route'lar dar izinli `productionMutationRouteOptions` kullanır (koruma testi `realtimeCoverage.test.ts`). Yayın hatası yazma isteğini bozmaz.

**Kalıcı bildirimler (✅ 4.5):** API ucu yok — zamanlanmış tarama (`infra/productionAlerts.ts`, `functions/src/ProductionAlerts/`) prod'da 15 dk'da bir; diğer stage'lerde yalnız `.env`'de `PRODUCTION_ALERTS_ENABLED="true"` iken 5 dk'da bir (Neon boşuna uyanmasın). Sahadaki ve planlı üretim başı geçmiş işlerin tahminini tahtayla AYNI fonksiyonla (`forecastJobsOnMachines`) ve kullanımdaki kalıpların bakım durumunu (`moldMaintenanceStatus`, gelecekteki planlı baskılar dahil) hesaplar; kurallar `core/helpers/production/productionAlerts.ts`. Bildirim türü tek (`UserNotificationType.PRODUCTION_ALERT`); alt tür `data.kind` (`JOB_LATE` / `JOB_DUE_RISK` / `MOLD_MAINTENANCE_SOON` / `MOLD_MAINTENANCE_DUE`), tekrar önleme `data.alertKey`, tıklanınca `data.href`. Alıcı: yalnız Üretim Planlama rolü (ACTIVE). Her (kullanıcı × anahtar) bir kez; canlı toast kullanıcı başına tek (çoksa özet).

Validator kuralları (CLAUDE.md dersleri): query parametresi alan her route kendi validator'ını beyan eder; `.refine()` yok; union içinde `.default()` yok; `z.record(z.enum)` yerine `z.partialRecord`; yanıt şemaları `.loose()` + `apiResponseDTO`; her yeni response validator için handler dönüş tipinden fixture'lı şekil testi (`productVariantMatrix/responseShape.test.ts` deseni, `validators/` DIŞINDA).

## 8. Frontend

### 8.1 Rotalar ve menü

`/uretim` paneli (`PanelShell` + `productionNav.ts`):
- **Planlama:** Üretim Emirleri (`/uretim/emirler` ✅; `?q=&durum=&sayfa=&adet=`) · Planlama Tahtası (`/uretim/tahta` ✅; `?bas=&gun=&alan=&yenile=&cakisma=&is=` — `is` = seçili iş kökü, ayrıntı açık gelir (4.5: bildirimler buraya bağlanır); genel bakış `/uretim`'de kaldı, tahta ayrı yol) · Durum Panosu (`/uretim/pano` ✅; `?alan=&makine=&q=&yenile=`) · Lotlar (`/uretim/lotlar` ✅; `?bas=&bit=&makine=&q=&sayfa=&adet=`) + lot ayrıntısı (`/uretim/lotlar/1000-2` ✅; ekip, notlar, QR'lı etiket) · Vardiya Ekibi (`/uretim/ekip` ✅; `?gun=&alan=`) · Vardiya Raporu (`/uretim/saha` ✅; `?gun=`) · Duruş ve Fire Nedenleri (`/uretim/nedenler` ✅; `?tur=`) — menü: Planlama (Tahta, Emirler), Saha (Pano, Vardiya Raporu, Lotlar, Ekip), Tanımlar
- **Analiz** (Faz 5): Ürün Geçmişi (`/uretim/istatistikler/urunler` ✅; `?urun=&olcu=&versiyon=&bas=&bit=`) · Makine Kullanımı ve OEE (`/uretim/istatistikler/makineler` ✅; `?alan=&bas=&bit=`) · Kalıp İstatistikleri (`/uretim/istatistikler/kaliplar` ✅; `?q=&oneri=&bakim=&bas=&bit=&kalip=` — `kalip` açık ayrıntı)
- **Tanımlar:** Makineler (`/uretim/makineler` ✅; altında Duruşlar bölümü `#duruslar` ✅) · Kalıplar (`/uretim/kaliplar` ✅) · Uyumluluk Matrisi (`/uretim/uyumluluk` ✅; filtreler `?q=&alan=&tumu=`) · Parkur ve Alanlar (`/uretim/alanlar` ✅) · Vardiya ve Takvim (`/uretim/vardiyalar` ✅; altında Takvim İstisnaları `#takvim`, yıl `?yil=`) · Operatörler (`/uretim/operatorler` ✅) · Hammadde Bilgisi (`/uretim/hammaddeler` ✅)

Operatör paneli (`/operator`, mobil öncelikli) ertelendi — bu aşamada operatör hesabı yok.

Kod yerleşimi: `features/production/{machines,molds,compatibility,shifts,operators,orders,board,kanban,lots,stats}/`, her biri `api/ components/ hooks/ schema/`. Sayfalar ince kalır. Panel metinleri diğer paneller gibi TR (panel i18n'i i18n Faz 2'ye kadar ertelenmiş durumda).

### 8.2 Planlama Tahtası — UX şartnamesi

```
┌ Planlama Tahtası ─ [◀ Bugün ▶] 25 Eyl – 1 Eki ─ Görünüm: [Vardiya|Gün|Hafta] ─ Alan: [Tümü ▾] ─ [⟳ 60 sn] ─────┐
├───────────────┬─────────── Per 25 Eyl ────────────┬─────────── Cum 26 Eyl ────────────┬─ Bekleyen emirler ─┤
│ Makine        │ A 08–20           │ B 20–08        │ A 08–20           │ B 20–08        │ UE-…-0042          │
├───────────────┼───────────────────┴────────────────┴───────────────────┴────────────────┤ 1.3.2.V1 · Siyah   │
│ ▾ Parkur 1    │                        │ şimdi                                        │ 5.000 ad · ⚑ 30 Eyl│
│ M-01 · 120 t  │ ▨▨[1000-1 ▮▮▮▮▮▮│1000-2 ▮▮▮▮│1000-3 ▮]   [#1 #2  taslak]              │ [Öner]  ⠿ sürükle  │
│  Ahmet · Ali  │                        │                                              │ UE-…-0043          │
│ M-02 · 250 t  │      [1002-1 ▮▮▮▮▮▮│1002-2 ▮▮]   ░░ Planlı bakım ░░                   │ …                  │
│ ▾ Bakalit     │                        │                                              │                    │
│ B-01 · 150 t  │ [1003-1 ▮▮▮│1003-2 …]  │                                              │                    │
└───────────────┴────────────────────────┴──────────────────────────────────────────────┴────────────────────┘
 ▨ kalıp bağlama · ░ duruş/bakım · │ şimdi çizgisi · çubuk rengi = durum · sol şerit = ürün rengi (Color.hex) · ⚑ termin
```

- **Satırlar:** makineler, parkur/alan gruplarıyla katlanabilir; satır başında tonaj ve o vardiyanın operatörleri (tıkla → roster'dan ata).
- **Zaman ekseni:** gün + vardiya bantları, çalışılmayan saatler taranmış; zoom: Vardiya / Gün / Hafta. `from`, `zoom`, `area` ve seçili iş URL'de (nuqs).
- **Çubuk:** iş = tek çubuk; içinde vardiya sınırlarında lot bölmeleri (`1000-1 | 1000-2 | 1000-3`), başta setup bölümü. ✅ 4.3: etikette raporlu baskı yüzdesi; alt kenarda gerçekleşen üretim hattı (raporlu lotlar; üretimdeki lot şimdiye kadar); planlı bitişten tahmini bitişe taralı gecikme uzantısı (eşiği aşan gecikmede; arkadaki işin üstüne biner — çakışma görünür); gecikme / termin riski ⚠ ve kalıp bakımı 🔧 ikonları; tahtanın üstünde uyarı şeridi. Aile kalıbında çubukta çıktılar da görünür (ör. `1.3.2 ×2 · 1.5.4 ×2`) ve emri olmayan çıktı "yan ürün" olarak işaretlenir.
- **Sürükle-bırak:** yatay = zaman (15 dakikaya, Shift basılıyken vardiya başına yapışır), dikey = makine. Sürüklerken hayalet çubuk + hedef satır rengi: yeşil (uygun) / amber (uyarı) / kırmızı (engelli) ve gerekçe ipucu — **motorun aynı fonksiyonuyla**. Bırakınca iyimser güncelleme; sunucu reddederse geri alınır ve gerekçe Sonner ile gösterilir.
- **Bekleyen emirler paneli:** planlanmamış emirler tahtaya sürüklenir (ölçünün birden çok kalıbı varsa o makineye en uygun olanı seçilir) ya da **Öner** ile ilk 3 aday gösterilip tek tıkla yerleştirilir. Çakışmada seçenek: "sonrakileri kaydır" / "ilk boşluğa koy".
- **Detay paneli (Sheet):** emir, ürün/ölçü/versiyon, adetler, çevrim ve göz, lotlar + operatörler + notlar, aksiyonlar (Sahaya ver, Böl, Kalıp değiştir, İptal). Sağ tık menüsünde aynı aksiyonlar.
- **Erişilebilirlik:** çubuk klavyeyle odaklanır; ok tuşları bir adım / bir satır taşır, Enter onaylar, Esc iptal eder (dnd-kit klavye sensörü); ayrıca "Taşı…" diyaloğu. Renk tek başına bilgi taşımaz (ikon + metin).
- **Yenileme:** `AdminListRefreshBar` (otomatik aralık) + bölüm-yerel katman (AGENTS.md refetch deseni). ✅ 4.4: canlı güncelleme — başka bir planlayıcının değişikliği açık ekranları ~1 sn içinde kendiliğinden tazeler (toast yok), başlıkta "Canlı" göstergesi; bağlantı yokken otomatik yenileme yedek.
- **Dar ekran:** tahta masaüstü önceliklidir; telefonda makine başına salt-okunur ajanda listesi gösterilir.

### 8.3 Durum Panosu (Bitbucket benzeri Kanban)

Sütunlar: Planlandı → Sahaya Verildi → Kalıp Bağlanıyor → Üretimde ⇄ Duraklatıldı → Tamamlandı (son 7 gün). Kart: lot/iş no, ürün kodu + ölçü + renk, makine, adet ilerlemesi, termin, operatörler. Sürükleme = durum geçişi; yalnız `jobStateMachine`'in izin verdiği geçişler (ör. "Tamamlandı" adet/fire diyaloğunu açar). İsteğe bağlı kulvar (swimlane): makine ya da alan. Bitbucket panosundan farkı: kartta zaman bilgisi (planlanan bitiş, gecikme) de var.

### 8.4 Operatör ekranı (Faz 4, mobil)

"M-01 · A vardiyası 08–20" → aktif lot kartı: ürün, hedef / üretilen, büyük düğmeler: Kalıp bağlamaya başla · Üretimi başlat · Duraklat (neden seç) · Devam · Sayım gir · Fire gir (neden) · Not ekle · Vardiyayı kapat (devir notu). Vardiya bitince sıradaki lot (`1000-n+1`) kendiliğinden açılır.

### 8.5 İstatistik (Faz 5)

- **Ürün geçmişi** (✅ 5.1): ürün modeli → ölçü → versiyon filtresi (ör. *1.3 · Elcik çapı 10 mm*): her üretimin kök lotu, tarihleri, kaç vardiya sürdüğü, makine, kalıp, sağlam / fire, ortalama çevrim, planlanan ↔ gerçekleşen süre + grafikler. Sayımlar çıktı (`ProductionLotOutput`) düzeyinde tutulduğu için aile kalıbında her ölçü kendi satırında görünür. Kurallar (`core/helpers/production/productionStats.ts`): **adet** — tamamlanan işte kapanıştaki kesin sayım, sürende raporlu vardiyaların toplamı (kullanıcı kararı); **gerçek çevrim** — raporlu vardiyalarda (lot süresi − kayıtlı duruş) ÷ baskı, plandaki çevrimle oranı performans; **pencere** — işin üretim dönemi (gerçekleşen varsa ilk başlangıç → son rapor / şimdi, yoksa plan) pencereyle kesişmeli; planlı / sahaya verilmiş (başlamamış) iş sayılmaz.
- **Makine kullanımı ve OEE** (✅ 5.2): kurallar `core/helpers/production/machineStats.ts`. **Zaman** saat bazlı ve pencereye kırpılmış: vardiya süresi (makinenin geçerli vardiya düzeni, takvim istisnaları düşülmüş) = vardiya içi üretim (raporlu lotların gerçek aralıkları) + makine duruşu (Makineler sayfasındaki kayıtların vardiyaya düşen, ÜRETİMLE ÇAKIŞMAYAN kısmı; türler çakışırsa planlı bakım → arıza → diğer sırasıyla bir kez) + boş. Vardiya dışı üretim ayrıca gösterilir; kullanım = vardiya içi üretim ÷ vardiya süresi. Üretim süresi grafikte lotun kendi raporundaki oranla net çalışma / planlı / plansız duruşa bölünür. **OEE** yalnız pencerede BAŞLAYAN raporlu vardiyalardan (vardiya başladığı pencereye bütün yazılır): kullanılabilirlik = net çalışma ÷ (lot süresi − planlı duruş), performans = plandaki çevrim × baskı ÷ net çalışma, kalite = sağlam ÷ (sağlam + fire); seviye ≥ %85 iyi, %60–85 orta. Makine duruşu kayıtları OEE'ye girmez (aynı arıza raporda da duruş olarak girilirse iki kez sayılmasın). Pencere şimdide biter (bugünün gelmemiş vardiyası boş sayılmaz). **Raporsuz vardiya** (veri kalitesi): iş tamamlanırken raporu girilmeden kapanan lot; erken biten işin tamamlanmadan sonraya planlanmış, hiç başlamamış lotu sayılmaz (tamamlanma anı durum geçmişinden). Pasif makine yalnız pencerede üretimi ya da raporsuz vardiyası varsa listelenir.
- **Kalıp istatistikleri** (✅ 5.3): kurallar `core/helpers/production/moldStats.ts`. Gerçek çevrim 5.1 / 5.2 ile aynı kuralla (pencerede başlayan raporlu vardiyalarda (süre − duruş) ÷ baskı; duruşlar planda verimle karşılandığı için çevrime girmez); plan çevrimi işlerin planlama anındaki çevriminin baskı ağırlıklı ortalaması. **Öneri** (kullanıcı onayı, 2026-09-28): kalıp × makinede en az 3 raporlu vardiya ve gerçek çevrim karttakinden (kart ya da değeri yoksa planların varsaydığından) en az %5 farklı; değer 0,1 sn'ye yuvarlanır, karttakiyle aynıysa öneri yok. "Karta uygula" onaylı; yalnız sonraki planları etkiler. Renk / hammadde kırılımı bilgi amaçlı (kart makine başına tek çevrim). **Bakım:** güncel seviye + açık işlerin henüz basılmamış baskısıyla öngörü (`remainingJobShots`, uyarı taramasıyla aynı sayı); bakım uyarısı yalnız kullanımdaki kalıpta. Kullanım dışı kalıp yalnız pencerede üretimi varsa listelenir.
- Excel'e aktarma (mevcut `exceljs`).

## 9. Kütüphane araştırması ve karar

İhtiyaç: satır = makine olan **kaynak zaman çizelgesi**, **saat/vardiya** çözünürlüğü, tahta dışından sürükleme (bekleyen emirler), sürükleme sırasında **canlı doğrulama** (satırlar arası kural: aynı kalıp aynı anda iki makinede olamaz), lot bölmeli özel çubuk, şimdi çizgisi, shadcn görünümü, React 19, ticari lisans yükü olmaması.

| Seçenek | Lisans / durum | Artı | Eksi |
|---|---|---|---|
| **Kendi tahtamız:** `@dnd-kit/core` + date-fns + shadcn | MIT | Tam kontrol; lot/setup/vardiya görseli; motorla tek kaynak doğrulama; shadcn + dark mode; küçük bağımlılık | Tahtayı biz yazıyoruz (Faz 3'ün ana işi) |
| ReUI Gantt (21st.dev'de de var; shadcn registry, kopyala-sahiplen) | MIT | En iyi API tasarımı: tek "öneri hunisi" (`onEventUpdate`), canlı `canDropEvent`, kaynak ağacı, satır başına çok çubuk, baseline | Ölçek yalnız gün/hafta/ay/çeyrek/yıl — **saat yok**, özel ölçek mekanizması yok |
| Kibo UI Gantt / Kanban (21st.dev) | MIT | shadcn + dnd-kit; kanban için iyi başlangıç şablonu | Gantt gün/ay odaklı, saat yok |
| EventCalendar (vkurko, `@event-calendar/core` 5.15) | MIT, çok aktif | `resourceTimeline`, özel slot süresi, arka plan olayları (vardiya/bakım), sürükleme kısıtları | Svelte çalışma zamanı taşır, React sarmalayıcısı yok, shadcn'e stil uydurmak gerekir |
| vis-timeline 8.5 | MIT / Apache-2.0 | Olgun: gruplar, gruplar arası sürükleme, `onMoving` ile canlı doğrulama, dışarıdan bırakma | İmperatif DOM; `moment`, hammerjs bağımlılıkları; stil uydurma zahmetli |
| DayPilot Lite (React) 5.10 | Apache-2.0 | Makine satırlı scheduler, saat ölçeği | Lite'ta **yok:** dışarıdan sürükleme, çakışma algılama, şimdi çizgisi, devre dışı hücre, ilerleme çubuğu, kaynak ağacı (hepsi Pro) |
| SVAR React Gantt / DHTMLX Gantt | MIT çekirdek | Görev Gantt'ı | Kaynak (makine) planlama PRO, ücretli |
| MUI X Scheduler | MIT çekirdek | — | Kaynak zaman çizelgesi Premium; beta; MUI bağımlılığı |
| Bryntum Scheduler Pro, DHTMLX Scheduler PRO, DayPilot Pro, FullCalendar Premium | Ticari | APS'e en yakın hazır özellikler (kısıtlar, takvimler, kaynak histogramı) | Geliştirici başı lisans ücreti; görünüm shadcn'den ayrışır |
| 21st.dev "schedule" araması | — | Takvim / randevu / rezervasyon bileşenleri | Makine satırlı zaman çizelgesi yok (ReUI ve Kibo dışında) |

**Karar önerisi**
- **Tahta:** kendi bileşenimiz — `@dnd-kit/core` 6.x (+ `@dnd-kit/modifiers`) + mevcut `date-fns` v4 + yeni `@date-fns/tz` + mevcut shadcn; eksik shadcn parçaları CLI ile eklenir: `context-menu`, `toggle-group`, `resizable`, `hover-card`. Mimari ReUI'nin "tek öneri hunisi + canlı canDrop" desenini örnek alır; kural mantığı core motorundadır. Satır ~10–50, pencere 1–14 gün → sanallaştırma/canvas gerekmez.
- **Kanban:** aynı dnd-kit (+ `@dnd-kit/sortable`); Kibo UI Kanban başlangıç şablonu olabilir. (Atlassian panoları kendi `pragmatic-drag-and-drop`'unu kullanıyor; ikinci bir DnD kütüphanesi eklememek için dnd-kit'te kalınır.)
- **Grafik / Excel / canlı güncelleme:** mevcut `recharts` (shadcn `chart`), `exceljs`, SST Realtime + `mqtt`.
- **Yedek plan:** tahta beklenenden pahalı çıkarsa EventCalendar (MIT) `resourceTimeline`'a geçilir; bütçe ayrılırsa Bryntum Scheduler Pro değerlendirilir.
- `@dnd-kit/react` 0.x (yeni API) henüz 1.0 değil → kararlı `@dnd-kit/core` 6.x kullanılır.

## 10. Yol haritası

Her dilim: kısa plan → onay → uygulama → Definition of Done (typecheck / lint / test) → kubi doğrulama talimatı → LOG notu. Şema değiştiren dilimde migration planı ayrıca onaylanır; `infra/` değişikliğinde `npx sst diff --stage prod` ile etki gösterilir. Kapsam etiketleri görecelidir.

**Faz 1 — Rol, panel, tanımlar**
- **1.1 Rol + panel iskeleti** ✅ 2026-09-25 (kod hazır; kubi doğrulaması kullanıcıda — IMPROVEMENT_LOG): `production_planner` ("Üretim Planlama") uçtan uca (§4 kontrol listesi), `/uretim` layout + menü + karşılama sayfası, dokümanlar. *Infra:* yeni Cognito grubu (additive; prod'a ancak kullanıcı deploy ederse gider). *Kubi testi:* admin panelinden bir kullanıcıya rol ver → çıkış/giriş → `/uretim`'e yönlenir; diğer panellere giremez; yetkisiz kullanıcı `/uretim`'e giremez.
- **1.2 Şema — tanımlar** ✅ 2026-09-25: §5.1 modelleri + migration `20260925120000_add_production_master_data` + ölçü koruması (§5.3). Kubi için örnek veri script'i 1.3'e kaydırıldı (API ile birlikte denenecek).
Tanım dilimleri 2026-09-25'te **dikey** yeniden bölündü (her dilim API + ekran birlikte) — yatay "önce tüm API, sonra tüm ekran" düzeninde API dilimi kubi'de tıklanarak denenemiyordu.
- **1.3 Parkur/Alan + Vardiya düzenleri + Makineler** ✅ 2026-09-25 (LOG): 13 route; `/uretim/alanlar`, `/uretim/vardiyalar` (12/16/24 saat şablonları, canlı 24 saat önizlemesi), `/uretim/makineler` (URL'de filtre, geçerli vardiya düzeni ve kaynağı).
- **1.4 Kalıplar** ✅ 2026-09-25 (LOG): 9 route; `/uretim/kaliplar` (göz grupları: ürün modeli → ölçü seçici, aile kalıbı rozeti, canlı baskı ağırlığı; makine kartları; bakım sayacı %85 uyarısı) + `/uretim/hammaddeler` (hammaddenin üretim bilgisi). Müşteri kalıbında SAHİP müşteri seçimi sonraya bırakıldı (dar müşteri sözlüğü gerekir) — şimdilik yalnız "Müşteri kalıbı" işareti.
- **1.5 Operatörler + Takvim ve Duruşlar** ✅ 2026-09-25 (LOG): 11 route (migration yok — tablolar 1.2'den); `/uretim/operatorler`; vardiya sayfasına Takvim İstisnaları (aralık girişi, gün başına kayıt, birleşik liste); makine sayfasına Duruşlar + tabloda "duruşta / yaklaşan duruş" uyarısı; fabrika saati yardımcıları (§5.3).
- **1.6 Uyumluluk motoru + matris ekranı** ✅ 2026-09-25 (LOG): saf `moldMachineCompatibility` (kurallar §6) + `/uretim/uyumluluk` (kalıp × makine, ✓/⚠/?/✗, hücrede tonaj kullanımı, ★ önerilen makine, ayrıntı dialog'u) + makineye `maxDaylightMm` (migration `20260925190000_add_production_machine_max_daylight`, yalnız ekleme). Yeni API ucu yok.
  - *Tasarım girdileri (Arburg ALLROUNDER 320 C resmi föyü) nasıl karşılandı:* (a) hidrolik kapama → `maxDaylightMm` + açılma = min(strok, açıklık − kalınlık); makine formu kalınlıkların ve strokun açıklıktan küçük olmasını da denetler; (b) baskı kapasitesi PS cinsinden kaldı, sınırda doluluk uyarısında hafif hammadde notu — hammaddeye göre kesin hesap Faz 2'de işin hammaddesiyle; (c) kolon kuralı "bir yönde geçmesi yeter" (bağlama plakası ölçüsü alanı eklenmedi — nadiren bağlayıcı); (d) bilezik farkı uyarı.
- **Excel'den toplu makine/kalıp aktarımı:** şirketin listesi gelince, formatına göre ayrı dilim.

**Faz 2 — Emirler ve planlama motoru**
Faz 2 de **dikey** yeniden bölündü (2026-09-25, kullanıcı onayı): her dilim kubi'de tıklanarak denenebilsin.
- **2.1 Üretim emirleri** ✅ 2026-09-25 (LOG): `ProductionOrder` + 3 enum, migration `20260926090000_add_production_orders` (yalnız ekleme; emir no sayacı 1001'den), 6 route, `/uretim/emirler`. Kararlar: varyant bağı `SetNull` + `variantCode` kopyası (müşteri siparişi kalemi deseni — varyant silen 5 akışa koruma gerekmez; varyantsız emir planlanmaz); emir yalnız kullanılabilir (RETIRED olmayan) kalıbı olan ölçüye açılır; elle durum yalnız Taslak ⇄ Beklemede ⇄ İptal (diğerleri planlamadan); yalnız taslak silinir; termin gün (`@db.Date`); müşteri siparişi kalemi (`OrderItem`) bağı sonraya.
- **İç üretim filtresi** ✅ 2026-09-30 (LOG): `Supplier.isInHouseProduction` (migration `20260930100000_add_supplier_in_house_production`; en çok BİR tedarikçi — admin uçlarında 409). Emir yalnız bu tedarikçiye bağlı varyanta açılır (bağlantının aktifliği aranmaz); kalıba yalnız iç üretim ölçüsü ya da zaten kalıbı olan ölçü bağlanır. Tek kaynak: `productionReferences/repository.ts` (`inHouseVariantWhere`, `moldAssignableSizeWhere`).
- **Varyanta özel çevrim** ✅ 2026-09-30 (LOG): `ProductionVariantProfile` (migration `20260930140000_add_production_variant_profile`), `GET /production/variants?page&limit&q` (yalnız iç üretim varyantları), `PUT /production/variants/{variantId}/profile` (`{ cycleTimeSec | null }`), `/uretim/varyantlar`. Zincir: emir > makine kartı > **varyant** > kalıp × hammadde katsayısı (katsayı yalnız son adımda).
- **2.2 Motor** (büyük): vardiya takvimi (TZ), süre, ileri planlama, lot bölme, çevrim zinciri, çakışmalar, kaydırma, durum makinesi — saf + kapsamlı testler (gece yarısını geçen vardiya, hafta sonu, bayram, 16 saatlik düzen, bakım penceresi).
  Dikey karşılığı: emir ekranında "hangi makinede ne zaman biter" önizlemesi (uygunluk + vardiya takvimi + süre).
  ✅ 2026-09-25 (LOG): `shiftCalendar` + `jobScheduling` + `orderCandidates` (saf, 21 test; doküman örneği birebir: 3×8'de 08:00 başlayan 17,1 saatlik iş → A/B/C lotları, ertesi gün 01:05) + `GET /production/orders/{id}/candidates` (yazmaz; 45 günlük ufuk) + emir satırında "Öner" dialog'u (en erken / en ekonomik, termin, lotlar). Diğer işler henüz hesaba katılmıyor (2.3).
- **2.3 İşler ve lotlar** ✅ 2026-09-25 (LOG): `ProductionJob` / `ProductionJobOutput` / `ProductionLot` / `ProductionLotOutput` (lot operatörü ve notları Faz 3), migration `20260926120000_add_production_jobs_and_lots` (yalnız ekleme; lot kökü 1000'den). `POST /production/orders/{id}/jobs` ("Planla": plan sunucuda yeniden hesaplanır, tek dizi transaction'ında iş + çıktılar + lotlar + emir Planlandı), `DELETE /production/jobs/{id}` (yalnız planlı iş; emir Taslağa döner). Motor mevcut işleri (makine + aynı kalıp) dolu sayar. Kalıp göz güncellemesi fark tabanlı; işe bağlı göz çıkarılamaz, işi olan makine/kalıp silinemez (409). Bu dilimde emir tek işle planlanır (bölme Faz 3).
- **2.4 İş planlama API'si** (büyük): planla / taşı / böl / sahaya ver / sil — sunucuda aynı motorla doğrulama, satır kilidi + `version`, toplu yazım.
- **2.5 Öner** (orta): aday sıralama API'si + gerekçeler.

**Faz 3 — Tahta ve pano**
- **3.1** ✅ 2026-09-26 (LOG): salt-okunur tahta `/uretim/tahta` — makine satırları alan gruplarıyla, gün ekseni (pencere 3 / 7 / 14 / 28 gün = zoom), vardiya dışı gri, takvim istisnası etiketi, taralı duruş, kesikli bağlama + lot parçalı çubuk (ürün rengi şeridi), şimdi çizgisi, iş ayrıntı dialog'u (emirler, lotlar, planlı işi iptal). Pencere/vardiya hesabı core `productionBoard.ts`'te, çizim geometrisi saf ve testli (`features/production/board/utils/boardGeometry.ts`). Yeni bağımlılık yok (`@dnd-kit` 3.2 ile gelir).
- **3.2** ✅ 2026-09-26 (LOG): tahtada taşıma — planlı iş sürüklenir (`@dnd-kit/core`; yatay = zaman, 15 dk adım; dikey = makine), hedef satır işin `machineFit`'iyle canlı boyanır (uygun değilse gerekçe), klavye alternatifi iş dialog'undaki "Taşı" formu. Plan sunucuda aynı motorla yeniden hesaplanır (`evaluateOrderCandidates` + `earliestStart`; iş kendi aralığını meşgul saymaz), yazım `buildJobRescheduleWrite` + tek dizi transaction; iyimser kilit `version` (yarışan yazımda P2025 → 409). Bekleyen emirler paneli 3.3'e alındı.
- **3.3** ✅ 2026-09-26 (LOG): bekleyen (Taslak) emirler paneli — kart makine satırına sürüklenir, iş imlecin bırakıldığı andan planlanır (kalıp verilmezse o makinede en erken biten); kartta "Öner" (aday dialog'u). Çakışma kipi (araç çubuğu, `?cakisma=kaydir`): "İlk boşluğa koy" / "Sonrakileri kaydır" — ikincisinde yerleşen iş o ana oturur, makinede o andan sonra başlayan PLANLI işler sırayla arkasına kayar (boşluklar korunur, değmeyen iş yerinde kalır; kural `core/helpers/production/jobRipple.ts`). Yeni iş + tüm kaydırmalar TEK dizi transaction'ında (`commitPlacement`), herhangi birinin sürümü tutmazsa hiçbiri yazılmaz. Planlama bağlamı bir kez okunur (`functions/.../productionOrders/handlers/placement.ts`).
- **3.4** ✅ 2026-09-26 (LOG): durum panosu `/uretim/pano` — sütunlar Planlandı ⇄ Sahaya verildi → Kalıp bağlanıyor → Üretimde ⇄ Duraklatıldı → Tamamlandı (son 7 gün); kart sürüklenir (izinsiz sütunlar soluk), klavye alternatifi karttaki "Durumu değiştir" menüsü; Tamamlandı'ya bırakınca sağlam / fire dialog'u. Kural tek kaynak `core/helpers/production/jobStateMachine.ts` (geçişler, tamamlama adetleri, emir durumu türetme: Serbest / Üretimde / Tamamlandı). Migration yok; gerçekleşen başlama / bitiş saatleri Faz 4'e (MES) kaldı — "son 7 gün" şimdilik `updatedAt` ile. Kulvar (swimlane) yerine alan + makine süzgeci.
- **3.5** ✅ 2026-09-28 (LOG): migration `20260926150000_add_production_shift_assignments_and_lot_notes` (MachineShiftAssignment, ProductionLotOperator, ProductionLotNote + kategori enum'u; yalnız ekleme). Vardiya ekibi `/uretim/ekip` (makine × vardiya günü × kod; hücre gerçekten çalışan vardiya olmalı, boşaltmak serbest, günden günlere kopyalama); lotlar `/uretim/lotlar` + ayrıntı (ekip: lota özel > vardiya ekibi; notlar: kategori + opsiyonel "operatör adına"; QR'lı 100×70 mm etiket, `qrcode.react`). Taşımada lotlar SIRAYA göre yerinde güncellenir (not / ekip korunur; kayıtlı lot kalkacaksa 409); iş tamamlanırken ekip lota dondurulur; kullanılan operatör silinmez (409). Kurallar `core/helpers/production/productionLots.ts` ve `shiftAssignments.ts`.

**Faz 4 — Saha (MES-lite)**
- **4.1** (ertelendi — kullanıcı: "sonra düşünürüz") `production_operator` rolü + `/operator` mobil paneli + personel ↔ hesap bağlama. O zamana kadar sayım/fire/not girişini planlayıcı yapar.
- **4.2** ✅ 2026-09-28 (LOG): vardiya raporu — migration `20260928100000_add_production_shift_reports` (yalnız ekleme). `/uretim/saha` (günün lotları makine başına; Başlat / Rapor gir / Düzelt), lot ayrıntısında rapor bölümü, `/uretim/nedenler` (duruş / fire sözlüğü, "Varsayılanları ekle"). Rapor: başlangıç / bitiş, çıktı başına sağlam + fire + fire nedeni kırılımı, duruşlar (neden + dk), opsiyonel baskı ve devir notu ("Vardiya devri" notu olur); lotu kapatır, sıradaki lot kendiliğinden başlar, kalıp sayacı artar (düzeltmede fark kadar; raporsuz lotların baskısı iş tamamlanırken). İş durum geçmişi planlama / pano / lot başlatmadan yazılır; panonun "son 7 gün"ü oradan. Tamamlama dialog'u raporların toplamıyla dolar; iş toplamı ile lot toplamı ayrı kalır. Kurallar `core/helpers/production/lotReports.ts` ve `productionReasons.ts`.
- **4.3** ✅ 2026-09-28 (LOG): planlanan ↔ gerçekleşen — migration yok. Tahmin tek kaynak `core/helpers/production/jobForecast.ts` (saf): ilerleme = raporlu baskı / planlanan; kalan baskı PLANDAKİ çevrim + verimle makinenin çalışma pencerelerine (vardiya, istisna, duruş) yerleştirilir; başlangıç üretimdeki lotun gerçek başı, yoksa son raporun bitişi, hiç başlamadıysa şimdi (+ bağlama); durumlar Plana uygun / Başlamadı / Geride / Süresi geçti / Üretim bitti (eşik 30 dk); termin riski en yakın termin gününün sonuna göre. Tahta her işe `forecast` + `moldMaintenance` döner ve planlı bitişi pencereden önce kalmış ama sahada açık (Sahaya verildi … Duraklatıldı) işi de listeler — geciken iş makineyi tutmaya devam eder (bayat PLANLI iş listelenmez: motor onu meşgul saymaz). Tahta görünümü §8.2 "Çubuk"; iş dialog'unda "Gerçekleşen ve tahmin" ve sahaya verilmiş / üretimdeki geciken işte **"Sonraki işleri tahmini bitişe kaydır"**: uç tahmini sunucuda aynı fonksiyonla yeniden hesaplar, 3.3 zincirini (`planRippleFollowers` + `commitPlacement`, sürüm filtreli tek dizi transaction) geciken işin [bağlama başı, tahmini bitiş] aralığıyla çalıştırır; planlı işte 409 (kendisi taşınır). Kalıp bakımı tek kaynak `core/helpers/production/moldMaintenance.ts` (1.4'teki `describeMaintenanceProgress` buraya taşındı, eşik %85 korundu): şimdiki seviye + tahtadaki planlı baskılarla öngörülen seviye; kalıplar sayfasında "Bakım yapıldı" (son bakım sayacı = güncel sayaç; bakım GÜNÜ kalıp formuyla aynı sözleşmede).
- **4.4** ✅ 2026-09-28 (LOG): canlı tahta — migration yok, infra değişikliği onaylı. 41 üretim yazma ucu başarıdan sonra `production/changes` konusuna ipucu yayınlar (§7); yetkilendirici konuyu yalnız ACTIVE + üretim yetkili kullanıcıya açar ve bağlantıyı jeton dolunca keser. Panel (`ProductionRealtimeProvider`) gelen alanları 400 ms'de birleştirip ilgili sorguları tazeler; kendi değişikliği de işlenir (aynı kullanıcının diğer sekmesi), bağlantı geri gelince bir kez tümü tazelenir; başlıkta Canlı / Bağlanıyor / Canlı değil. Tarayıcı bağlantısı ortak `features/realtime` (bildirim zili de geçti): her bağlantıda taze jeton, bitişten önce yenileme, yetki reddinde yeniden deneme — saatlerce açık pano susmaz. Yan bulgu düzeltildi: Lambda'daki mevcut IoT yayıncıları şemasız uç noktayla SDK'da `Invalid URL` veriyordu.
- **4.5** ✅ 2026-09-28 (LOG): kalıcı bildirimler — migration `20260928160000_add_production_alert_notification_type` (yalnız enum değeri). Zamanlanmış tarama (§7) Üretim Planlama rolüne zil bildirimi yazar ve canlı toast yollar: gecikme (Başlamadı / Geride / Süresi geçti — iş + planlı bitiş başına bir kez; plan taşınınca yeniden), termin riski (iş + en yakın termin başına), kalıp bakımı ("yaklaşıyor" %85 ya da planlı işlerle aşılacak; "geldi" — bakım döngüsü başına birer). Gelecekteki planlı işin gecikmesi / termin riski bildirim üretmez (planlama anında "Öner"de görünür). Tahtadaki tahmin hesabı ortak fonksiyonlara çıkarıldı (`forecastJobsOnMachines`, `forecastCalendarRange`, `remainingShotsByMold`, metinler `describeForecast` / `describeMaintenance`). Zil üretim paneline eklendi; üretim bildirimine tıklayınca tahtada iş ayrıntısı (`?is=`) ya da kalıplar sayfası açılır. Tekrar önleme için yeni tablo yok: teslim edilmiş anahtarlar mevcut bildirim kayıtlarından okunur (60 gün).

**Faz 5 — İstatistik**
Faz 5 de **dikey** dilimlere bölündü (2026-09-28, kullanıcı onayı): her dilim uç + ekran + Excel.
- **5.1 Ürün geçmişi** ✅ 2026-09-28 (LOG): `GET /production/stats/products`, `/uretim/istatistikler/urunler` (süzgeç: ürün modeli → ölçü → versiyon + tarih, hızlı aralıklar; özet kartları; sağlam / fire ve plan ↔ gerçek çevrim grafikleri; üretim başına tablo — iş no tahtada ayrıntıyı açar; Excel). Menüye "Analiz" grubu. Migration yok.
- **5.2 Makine kullanımı ve OEE** ✅ 2026-09-28 (LOG): `GET /production/stats/machines`, `/uretim/istatistikler/makineler` (süzgeç: alan + tarih, hızlı aralıklar 7 gün / 30 gün / 3 ay; özet kartları: OEE ve bileşenleri, kullanım, rapor duruşları, makine duruşu, raporlu / raporsuz vardiya; makine başına zaman dağılımı grafiği; en çok süre kaybettiren duruş nedenleri; makine tablosu + toplam; Excel: makineler + duruş nedenleri sayfaları). Kurallar §8.5. Migration yok.
- **5.3 Kalıp istatistikleri + gerçekleşen çevrim önerisi** ✅ 2026-09-28 (LOG): `GET /production/stats/molds`, `PATCH /production/molds/{id}/machine-profiles/{machineId}`, `/uretim/istatistikler/kaliplar` (süzgeç: arama, tarih + hızlı aralıklar, "çevrim önerisi olanlar", "bakım uyarısı olanlar"; özet kartları; kalıp tablosu; kalıp ayrıntısı: makine kartları ve "Karta uygula", renk / hammadde; Excel: kalıplar, makine kartları, renk ve hammadde). Kurallar §8.5. Migration yok. **Faz 5 tamam.**

**Faz 6 — İleri (opsiyonel)**
Otomatik planlayıcı + "ne olursa" önizlemesi · sipariş durumunun otomatik `IN_PRODUCTION`'a geçmesi · hammadde ihtiyacı (kg) → satın alma · metal insert (burç/civata) reçetesi (BOM) · makine sayaç entegrasyonu.

## 11. Test ve doğrulama

- **Birim:** motor modülleri (core vitest) — süre, lot bölme, uyumluluk, çakışma, sıralama, saat dilimi kenar durumları. `validatorCompilation.test.ts` yeni validator'ları zaten tarar; yeni response validator'ları için şekil testleri.
- **Kubi:** her dilim sonunda adım adım talimat; Neon üzerinde örnek veriyle tahta senaryoları (3 vardiyaya yayılan iş, bakım penceresine düşen iş, uyumsuz makineye sürükleme, iki sekmeden aynı işi taşıma → 409).
- **Performans:** tahta ucunun yanıt boyutu (dar DTO), Lambda sayısındaki artış (~40) ve deploy süresi izlenir.

## 12. Riskler

- **Veri kalitesi:** makine/kalıp teknik değerleri eksikse kontroller "doğrulanamadı" uyarısı verir, planı kilitlemez — ama öneri kalitesi düşer. İlk iş gerçek makine/kalıp listesinin girilmesi.
- **Saha benimsemesi:** operatör ekranı çok basit ve büyük düğmeli olmalı; yoksa gerçekleşen veri (ve istatistik) eksik kalır.
- **Eşzamanlı planlayıcılar:** `version` + satır kilidi; kullanıcıya "plan başka biri tarafından değişti, yenilendi" mesajı.
- **Zaman:** tüm zamanlar UTC saklanır; vardiya hesabı Europe/Istanbul duvar saatiyle tek modülde yapılır.
- **Kapsam kayması:** MRP / stok / kalite ayrı kararlar; Faz 6'ya kadar dışarıda.

## 13. Açık sorular (varsayılan önerilerle)

1. ~~Vardiya 12 / 16 / 24 saat ne demek?~~ → **Cevaplandı:** makinenin günde kaç saat çalıştığı; vardiyalar bildiğimiz vardiyalar. Düzen günlük süreyi vardiyalarının toplamı olarak tanımlar; 1.4'te 12 / 16 / 24 saatlik hazır şablonlar gelir.
2. ~~Lot kökü~~ → **Cevaplandı:** standart gerekmiyor; bir yerden başlayıp id gibi otomatik artar, ek `-1 -2 -3`. Geriye dönük takip için kalıcı (§5.3).
3. ~~Operatör hesapları~~ → **Cevaplandı:** bu aşamada hesap yok; notları planlayıcı yazar. Sonra değerlendirilecek.
4. ~~Bakalit~~ → **Cevaplandı:** dahil değil; ihtiyaç olursa eklenir.
5. ~~**Kalıplar:** aile kalıbı var mı?~~ → **Cevaplandı (2026-09-25):** evet — aynı ürün modelinin farklı ölçüleri ve farklı ürün modelleri aynı kalıpta olabilir (§5.3). Açık kalan: bir ölçünün birden çok kalıbı (ör. 2 ve 4 gözlü) olabilir mi, müşteriye ait kalıp var mı? → *Model ikisini de destekliyor; teyit.*
6. **"En ekonomik"** önceliği: termine yetişmek > maliyet > süre sıralaması uygun mu? Makine saat maliyetleri bilinecek mi?
7. **Üretim emri kaynağı:** müşteri siparişinden mi, stok için mi, ikisi de mi? Sipariş durumu otomatik "Üretimde"ye geçsin mi (Faz 6)?
8. **Makine/kalıp listesi:** şirkette var ama henüz gelmedi → gelince formatına göre toplu aktarım dilimi.
9. **Kendi üretimimiz** katalogda bir tedarikçi (harf) olarak mı duruyor? Ölçü kodu tedarikçiye göre ayrıştığı için kalıbın hangi ölçü koduna bağlanacağını etkiler.
10. Aynı anda birden fazla planlayıcı çalışacak mı? (Koruma zaten planlı; önceliği belirler.)

## 14. Kaynaklar

- ReUI Gantt: [reui.io/docs/components/radix/gantt](https://reui.io/docs/components/radix/gantt) · 21st.dev kaydı: [21st.dev/@sean0205/components/reui-gantt](https://21st.dev/@sean0205/components/reui-gantt)
- 21st.dev "schedule" araması: [21st.dev/community/components/s/schedule](https://21st.dev/community/components/s/schedule) · Kibo UI Gantt: [kibo-ui.com/components/gantt](https://www.kibo-ui.com/components/gantt)
- DayPilot Lite ve özellik matrisi: [javascript.daypilot.org/open-source](https://javascript.daypilot.org/open-source/) · [javascript.daypilot.org/feature-matrix](https://javascript.daypilot.org/feature-matrix/)
- EventCalendar: [github.com/vkurko/calendar](https://github.com/vkurko/calendar) · vis-timeline: [visjs.github.io/vis-timeline](https://visjs.github.io/vis-timeline/docs/timeline/)
- SVAR React Gantt: [svar.dev/react/gantt](https://svar.dev/react/gantt/) · MUI X Scheduler: [mui.com/x/react-scheduler](https://mui.com/x/react-scheduler/)
- Enjeksiyon planlama kuralları (kalıp-makine eşleştirme, renk sıralaması, baskı sayacına göre bakım): [usersolutions.com — Injection Molding Production Scheduling](https://usersolutions.com/blog/injection-molding-production-scheduling)
- Makine boyutlandırma (kolonlar arası, kalıp yüksekliği, tonaj): [A guide to sizing injection molding machines](https://www.plasticsmachinerymanufacturing.com/injection-molding/article/21151087/a-guide-to-sizing-injection-molding-machines)
- Prisma EXCLUDE kısıtı sorunları: [prisma#17515](https://github.com/prisma/prisma/issues/17515) · [prisma#26366](https://github.com/prisma/prisma/issues/26366)
