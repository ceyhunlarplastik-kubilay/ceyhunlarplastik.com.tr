# Üretim Planlama (APS + MES-lite) — Tasarım ve Yol Haritası

> **Durum:** Faz 0 — plan, onay bekliyor · **Branch:** `feature/production-planning` · **Tarih:** 2026-09-25
> **Test:** yalnız bu branch + kubi stage (`export AWS_PROFILE=ceyhunlar-prod && npx sst dev --stage kubi`). `prod`/`dev`'e dokunulmaz.
> Bu doküman canlıdır: kararlar netleştikçe güncellenir. Açık iş özeti [IMPROVEMENT_PLAN.md](../IMPROVEMENT_PLAN.md)'de, tamamlanan dilimler [IMPROVEMENT_LOG.md](../IMPROVEMENT_LOG.md)'de.

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
| `production_operator` | Üretim Operatörü | `/operator` (mobil öncelikli) | 4 |
| `admin`, `owner` | — | ikisine de erişir | — |

| Yetenek | planner | operator | admin/owner |
|---|---|---|---|
| Makine / kalıp / parkur / vardiya / operatör tanımları | ✓ | – | ✓ |
| Üretim emri, planlama, sahaya verme | ✓ | – | ✓ |
| Vardiya ekibi atama (operatör ↔ makine ↔ vardiya) | ✓ | – | ✓ |
| Lot notu | ✓ | ✓ (yalnız kendi lotları) | ✓ |
| Başlat / duraklat / sayım / fire girişi | ✓ (operatör adına) | ✓ (yalnız kendi makinesi/vardiyası) | ✓ |
| İstatistikler | ✓ | – | ✓ |

**Operatör kimliği (öneri):** `ProductionOperator` personel listesi (roster) + opsiyonel `userId` bağı. Gerekçe: (1) her operatörün e-posta/Cognito hesabı olmayabilir, planlama hesap açılmasını beklememeli; (2) hesap askıya alınsa da geçmiş istatistik kişiye bağlı kalır; (3) kod tabanındaki `CompanyContact` (görüntü kaydı) ↔ `User` (giriş hesabı) ayrımıyla aynı desen. Giriş yapan operatör `production_operator` grubundadır ve roster kaydına bağlanır.

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

İsteğe bağlı (aynı dilimde, onaylanırsa): functions validator'larındaki `z.enum([...])` listelerini core `ALL_USER_GROUPS`'tan türetmek → bir sonraki rolde dokunulacak yer azalır.

## 5. Veri modeli

> Aşağıdaki bloklar **taslaktır (pseudo-Prisma)**; gerçek `schema.prisma` + migration Dilim 1.2 / 2.1'de ayrıca onaya sunulur.

Hepsi additive (yeni tablo/enum); mevcut tablolarda kolon değişikliği YOK, yalnız ters ilişki alanları eklenir. Ölçü, kuvvet ve süre alanları `Int` (mm, ton, dakika); çevrim süresi ve ağırlıklar `Decimal` (DTO'da number'a çevrilir — Prisma `Decimal` JSON'da `{s,e,d}` olur).

### 5.1 Tanımlar (Faz 1)

```prisma
enum ProductionProcessType {
  THERMOPLASTIC_INJECTION // plastik enjeksiyon
  THERMOSET_INJECTION     // bakalit enjeksiyon
}

model ProductionArea {                 // parkur / hol
  id, code @unique, name, sortOrder, isActive
  shiftPatternId String?               // alanın varsayılan vardiya düzeni
  machines ProductionMachine[]
}

model ProductionMachine {
  id, code @unique ("M-01"), name, brand?, model?, serialNumber?, manufactureYear?
  areaId → ProductionArea
  processType ProductionProcessType
  status ProductionMachineStatus @default(ACTIVE) // ACTIVE | MAINTENANCE | BREAKDOWN | INACTIVE
  clampForceTon            Int              // kapama kuvveti
  tieBarHorizontalMm       Int?             // kolonlar arası (yatay)
  tieBarVerticalMm         Int?             // kolonlar arası (dikey)
  minMoldHeightMm          Int?             // plakalar arası min kalıp kalınlığı
  maxMoldHeightMm          Int?             // plakalar arası maks kalıp kalınlığı
  maxOpeningStrokeMm       Int?             // açılma stroku
  shotCapacityG            Decimal?         // maks baskı ağırlığı
  screwDiameterMm          Int?
  locatingRingDiameterMm   Int?             // merkezleme bileziği
  hotRunnerZones           Int @default(0)
  coreCircuits             Int @default(0)  // maça çekme devresi
  hasRobot                 Boolean @default(false)
  plannedEfficiencyPercent Int @default(85) // planlama verimi (işe kopyalanır)
  hourlyCost               Decimal?         // TL/saat — "en ekonomik" hesabı
  shiftPatternId           String?          // yoksa alanınki, o da yoksa varsayılan
  sortOrder, notes, isActive
}

model Mold {
  id, code @unique ("K-1045"), name
  processType ProductionProcessType
  status    MoldStatus    @default(ACTIVE)   // ACTIVE | IN_MAINTENANCE | BROKEN | RETIRED
  ownership MoldOwnership @default(COMPANY)  // COMPANY | CUSTOMER (müşteri kalıbı)
  ownerCustomerId String? → Customer
  requiredClampForceTon    Int?
  widthMm Int?  heightMm Int?  thicknessMm Int?   // dış ölçüler
  weightKg                 Decimal?
  requiredOpeningStrokeMm  Int?
  locatingRingDiameterMm   Int?
  hotRunnerZones           Int @default(0)
  coreCircuitsRequired     Int @default(0)
  requiresRobot            Boolean @default(false)
  standardCycleTimeSec     Decimal             // referans çevrim
  runnerWeightG            Decimal?            // yolluk ağırlığı
  expectedScrapPercent     Decimal @default(0)
  setupMinutes             Int @default(60)    // söküm + bağlama + ısınma
  totalShots               Int @default(0)     // baskı sayacı
  maintenanceIntervalShots Int?                // her N baskıda bakım
  shotsAtLastMaintenance   Int @default(0)
  storageLocation, notes, isActive
  outputs MoldOutput[]
}

model MoldOutput {                     // kalıp → ölçü; aile kalıbında birden çok satır
  id, moldId → Mold (Cascade), productSizeId → ProductSize (Restrict)
  cavities    Int                      // bu ölçüden aktif göz sayısı
  partWeightG Decimal?
  @@unique([moldId, productSizeId])
  @@index([productSizeId])
}

model MoldMachineProfile {             // kanıtlanmış ayar kartı / bilinçli engel (opsiyonel)
  moldId, machineId, cycleTimeSec Decimal?, setupMinutes Int?, isPreferred, isBlocked, notes
  @@unique([moldId, machineId])
}

model MaterialProcessProfile {         // Material'a 1:1 üretim bilgisi
  materialId @unique → Material (Cascade)
  isMoldResin     Boolean @default(true)   // metal burç/civata gibi insert'ler false
  processType     ProductionProcessType?
  family          String?                  // PP, PA6, POM, PF (bakalit)…
  densityGCm3     Decimal?
  requiresDrying  Boolean @default(false)
  dryingTempC     Int?
  dryingHours     Decimal?
  cycleTimeFactor Decimal @default(1.00)   // hammaddenin hıza etkisi
  purgeNote       String?
}

model ShiftPattern {                   // "3×8", "2×12", "16 saat", "24 saat"
  id, name @unique, isDefault, timezone @default("Europe/Istanbul")
  shifts ShiftDefinition[]
}

model ShiftDefinition {
  id, patternId, code ("A"), name ("Gündüz")
  startMinute     Int                  // 480 = 08:00
  durationMinutes Int                  // 480 / 720 / 960 / 1440 — gece yarısını geçebilir
  daysOfWeek      Int[]                // 1 = Pzt … 7 = Paz (hafta sonu farklı olabilir)
  sortOrder
  @@unique([patternId, code])
}

model ProductionCalendarException {    // bayram, toplu izin, ek mesai günü
  id, date @db.Date, kind (HOLIDAY | SHUTDOWN | EXTRA_WORKDAY), areaId?, machineId?, note
}

model MachineDowntime {                // planlı bakım / arıza penceresi
  id, machineId, startAt, endAt, kind (PLANNED_MAINTENANCE | BREAKDOWN | OTHER), reason?, createdByUserId
  @@index([machineId, startAt])
}

model ProductionOperator {             // personel listesi — giriş hesabı opsiyonel
  id, firstName, lastName, employeeNo String? @unique, phone?
  userId String? @unique → User (SetNull)
  processTypes ProductionProcessType[] // yetkin olduğu prosesler
  isActive, notes
}

model MachineShiftAssignment {         // vardiya ekibi
  id, machineId, shiftDate @db.Date, shiftCode, operatorId
  @@unique([machineId, shiftDate, shiftCode, operatorId])
  @@index([operatorId, shiftDate])
}
```

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
  jobs ProductionJob[]
  @@index([status, dueDate])
  @@index([productVariantId])
}

model ProductionJob {                  // tahtadaki çubuk: bir makine + bir kalıp + kesintisiz üretim
  id, productionOrderId → ProductionOrder
  machineId → ProductionMachine (Restrict)
  moldId    → Mold (Restrict)
  lotBaseNumber Int? @unique           // "1000" — SAHAYA VERİLİNCE atanır
  plannedQuantity   Int
  setupStartAt      DateTime           // makine bu andan itibaren dolu
  productionStartAt DateTime
  plannedEndAt      DateTime
  // planlama anı kopyaları — sözlük sonradan değişse de plan açıklanabilir kalır
  cycleTimeSec Decimal, cavities Int, efficiencyPercent Int, setupMinutes Int
  status ProductionJobStatus @default(PLANNED)  // PLANNED | RELEASED | SETUP | RUNNING | PAUSED | COMPLETED | CANCELLED
  actualStartAt?, actualEndAt?
  goodQuantity  Int @default(0)        // lotlardan toplanır
  scrapQuantity Int @default(0)
  version Int @default(0)              // iyimser eşzamanlılık (iki planlayıcı)
  notes
  lots ProductionLot[]
  @@index([machineId, setupStartAt])
  @@index([moldId, setupStartAt])
  @@index([status])
}

model ProductionLot {                  // işin vardiyaya düşen dilimi
  id, jobId → ProductionJob (Cascade)
  sequence  Int                        // 1, 2, 3
  lotNumber String @unique             // "1000-2"
  shiftDate @db.Date, shiftCode        // vardiya tarihi = vardiyanın başladığı gün
  plannedStartAt, plannedEndAt, plannedQuantity
  actualStartAt?, actualEndAt?
  goodQuantity  Int @default(0)
  scrapQuantity Int @default(0)
  startShotCounter Int?, endShotCounter Int?
  status ProductionLotStatus @default(PLANNED)  // PLANNED | RUNNING | COMPLETED | CANCELLED
  operators ProductionLotOperator[]    // lot başlarken vardiya ekibinden kopyalanır, düzeltilebilir
  notes     ProductionLotNote[]
  @@unique([jobId, sequence])
  @@index([shiftDate, shiftCode])
}

model ProductionLotNote {
  id, lotId → ProductionLot (Cascade), authorUserId → User
  authorRole (PLANNER | OPERATOR | ADMIN)
  category (GENERAL | QUALITY | MAINTENANCE | MATERIAL | HANDOVER)
  body @db.Text, createdAt
  @@index([lotId, createdAt])
}

model ProductionNumberSequence {       // lot kök numarası sayacı: 1000, 1001, …
  key       String @id                 // "lot-base"
  nextValue Int                        // başlangıç = mevcut defterdeki son numara + 1
}
```

Faz 4'te eklenecekler: `ProductionEvent` (setup / başla / duraklat / devam / sayım / fire / bitir olay akışı), `DowntimeReason` ve `ScrapReason` sözlükleri.

### 5.3 Model kararları

- **Emir ≠ iş.** Bir emir paralel iki makineye bölünebilir ya da acil bir iş araya girdiği için zaman içinde kesilebilir → birden çok iş. Her işin kendi lot kökü olur.
- **Lot numarası:** kök numara **iş** başına, ek (`-1`, `-2`) vardiya sırası. Aynı kök = aynı üretim; iş başka vardiyada ya da günde devam etse de sıra sürer. Kök, sayaç tablosundan tek `UPDATE … RETURNING` ile atomik alınır (Postgres sequence yerine tablo: Prisma şemasında görünür, drift riski yok). Kök **sahaya verme** anında atanır → taslak planlar numara harcamaz; o zamana kadar tahtada `#1 #2 #3` önizlemesi görünür.
- **Lotlar ne zaman yazılır:** sahaya vermede kalıcılaşır. Sonradan iş kayarsa başlamamış lotlar yeniden bölünür (numara sırası korunur); başlamış/bitmiş lotlara dokunulmaz.
- **Çakışma koruması uygulama katmanında:** işlem içinde ilgili makine satırları `SELECT … FOR UPDATE` ile kilitlenir, makine/kalıp örtüşmesi motorla kontrol edilir, `version` uyuşmazlığı 409 döner. Postgres `EXCLUDE USING gist` kısıtı **şimdilik yok**: Prisma bu kısıtı şemada temsil edemiyor ve ertelenmiş (deferred) EXCLUDE ihlalinin interaktif transaction'da hata fırlatmadan geri alındığı açık bir Prisma hatası var (#26366). Kubi'de bir spike ile güvenli olduğu kanıtlanırsa sonradan emniyet ağı olarak eklenebilir.
- **Material'a yan tablo:** katalog `Material` public/portal yanıtlarında dönüyor; üretim kolonları oraya eklenirse ya yanıtlara sızar ya da her select'in ayrıca daraltılması gerekir. 1:1 tablo bu riski sıfırlar.
- **Transaction disiplini (Neon/P2028 dersi):** işlem içinde yalnız kilit + çakışma okuması + yazma; toplu lot yazımı ve "sonrakileri kaydır" tek `$executeRaw` + `UNNEST` ifadesiyle; işlem içinde global `prisma` kullanılmaz; harici çağrı yapılmaz.

## 6. Planlama motoru (core — saf, testli)

Konum: `packages/core/src/core/helpers/production/`. I/O yok, Prisma yok, **yalnız göreli import** (frontend `@core/*` ile içe alabilsin diye — core'daki `@/` alias'ı frontend'de çözülmez; `productVariants/` altındaki paylaşılan saf yardımcılar da böyle yazılmış).

| Modül | Sorumluluk |
|---|---|
| `productionTime.ts` | Europe/Istanbul duvar saati ↔ UTC dönüşümü (tek yer, `@date-fns/tz`) |
| `shiftCalendar.ts` | Vardiya düzeni + takvim istisnası + duruşlardan makine başına **çalışma pencereleri** ve vardiya örnekleri |
| `jobDuration.ts` | Adet → baskı → süre; çalışma pencerelerinde ileri planlama (çalışılmayan saatleri atlar) |
| `lotSplit.ts` | İşi vardiya sınırlarından lotlara böler, adetleri paylaştırır, `1000-n` üretir |
| `moldMachineCompatibility.ts` | Kalıp ↔ makine uygunluk kontrolleri (aşağıda) |
| `scheduleConflicts.ts` | Makine/kalıp örtüşmesi, duruşa denk gelme, termin aşımı, bakım sayacı aşımı, operatör çakışması |
| `rippleSchedule.ts` | "Sonrakileri kaydır": başlamamış işleri gereken kadar ileri iter; çalışan işlere dokunmaz |
| `cycleTime.ts` | Çevrim süresi çözüm zinciri (tek kaynak) |
| `candidateRanking.ts` | "Öner": uygun (makine, kalıp, en erken slot) adaylarını açıklamalı sıralar |
| `colorSequencing.ts` | Hex → parlaklık; açıktan koyuya geçiş cezası |
| `jobStateMachine.ts` | Durum geçişleri — kanban sürüklemesi ve operatör aksiyonları aynı kurala uyar |

**Süre formülü**

```
baskı      = ⌈ adet ÷ (göz × (1 − beklenen fire)) ⌉
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
4. (Faz 5) Geçmiş lotların gerçekleşen ortalaması (kalıp × versiyon) — renk etkisi de buradan öğrenilir; **öneri** olarak gösterilir, otomatik yazılmaz.

İşteki göz sayısı plan anında düzeltilebilir (kapatılmış göz).

**Kalıp ↔ makine uygunluk kontrolleri** — sonuç `ok | warning | blocked` + gerekçe kodu:

| Kontrol | Kural | Seviye |
|---|---|---|
| Proses | `mold.processType = machine.processType` (bakalit kalıbı plastik makinesine girmez) | blocked |
| Kapama kuvveti | `machine.clampForceTon ≥ mold.requiredClampForceTon` | blocked |
| Aşırı büyük makine | makine tonajı gerekenin çok üstünde (ör. 3 kat) — büyük kapasiteyi boşa harcar | warning |
| Kolonlar arası | `mold.widthMm ≤ tieBarHorizontalMm` ve `mold.heightMm ≤ tieBarVerticalMm` | blocked |
| Kalıp kalınlığı | `minMoldHeightMm ≤ mold.thicknessMm ≤ maxMoldHeightMm` | blocked |
| Açılma stroku | `maxOpeningStrokeMm ≥ requiredOpeningStrokeMm` | blocked |
| Baskı kapasitesi | baskı ağırlığı (göz × parça + yolluk) ≤ kapasite; kapasitenin %20–80'i dışında | blocked / warning |
| Merkezleme bileziği | çaplar eşleşiyor | warning |
| Sıcak yolluk / maça / robot | makinede yeterli bölge, devre, robot var | blocked |
| Bilinçli engel | `MoldMachineProfile.isBlocked` | blocked |
| Durum | kalıp `ACTIVE` değil / makine `INACTIVE` | blocked |
| Eksik veri | ilgili alan boş | warning ("doğrulanamadı") — eksik veri planı kilitlemez |

**"Öner" sıralaması** (açıklamalı; ağırlıklar ayarlanabilir):
1. Termine yetişiyor mu / kaç saat gecikir
2. Bitiş zamanı
3. Maliyet = `hourlyCost × çalışma saati` + setup maliyeti
4. Tonaj uyumu — yeterli olan en küçük makine tercih edilir (büyük kapasite korunur)
5. Önceki işten geçiş cezası — aynı kalıp / aynı hammadde ailesi / açıktan koyuya renk: ceza yok; koyudan açığa: temizleme cezası
6. Kalıp bakım sayacı

Her aday için gerekçe satırları döner, ör. *"M-02 · 250 t · %42 tonaj kullanımı · Cuma 14:20'de biter · termine 2 gün var · önceki iş aynı hammadde"*.

**İleri faz (6):** açgözlü otomatik planlayıcı (termine göre sırala → en iyi adaya yerleştir → makine içinde renkleri açıktan koyuya diz) + "ne olursa" önizlemesi. Gerçekten gerekirse OR-Tools CP-SAT (Python Lambda).

## 7. API — ProtectedApi `/production/*`

İş kullanıcısı çalışma alanı olduğu için **ProtectedApi** (satış/satın almayla aynı sınır). Her route ayrı Lambda (mevcut desen); modülün tamamı ≈ 40 route (ProtectedApi bugün 92 route). Yetki: planlama uçları `["production_planner", "admin", "owner"]`; operatör uçları (Faz 4) `["production_operator", "production_planner", "admin", "owner"]` + handler'da "yalnız kendi atamaları" zorlaması.

| Faz | Uçlar |
|---|---|
| 1 | CRUD: `/production/areas`, `/production/machines`, `/production/molds` (+ `PUT /production/molds/{id}/outputs`), `/production/shift-patterns`, `/production/calendar-exceptions`, `/production/machine-downtimes`, `/production/operators`, `/production/material-profiles` · `GET /production/references` (dar sözlük: ürün modeli → ölçüler → versiyonlar) |
| 2 | `/production/orders` (liste / oluştur / güncelle / iptal) · `GET /production/orders/{id}/candidates` (Öner) · `POST /production/jobs` (planla) · `PATCH /production/jobs/{id}/schedule` (taşı, `expectedVersion` zorunlu) · `POST /production/jobs/{id}/split` · `POST /production/jobs/{id}/release` (sahaya ver: kök numara + lotlar) · `DELETE /production/jobs/{id}` |
| 3 | `GET /production/board?from&to&areaId` (dar DTO) · `PUT /production/shift-assignments` · `GET /production/lots` · `GET /production/lots/{id}` · `POST /production/lots/{id}/notes` · `PATCH /production/jobs/{id}/status` (kanban geçişi) |
| 4 | `GET /production/operator/assignments` · `POST /production/lots/{id}/events` (setup / başla / duraklat / devam / sayım / fire / bitir) |
| 5 | `GET /production/stats/products` · `/production/stats/machines` · `/production/stats/molds` |

Uyumluluk matrisi için ayrı uç gerekmez: makine ve kalıp listeleri (dar DTO) çekilip matris istemcide aynı motorla hesaplanır.

Validator kuralları (CLAUDE.md dersleri): query parametresi alan her route kendi validator'ını beyan eder; `.refine()` yok; union içinde `.default()` yok; `z.record(z.enum)` yerine `z.partialRecord`; yanıt şemaları `.loose()` + `apiResponseDTO`; her yeni response validator için handler dönüş tipinden fixture'lı şekil testi (`productVariantMatrix/responseShape.test.ts` deseni, `validators/` DIŞINDA).

## 8. Frontend

### 8.1 Rotalar ve menü

`/uretim` paneli (`PanelShell` + `productionNav.ts`):
- **Planlama:** Planlama Tahtası (`/uretim`, varsayılan) · Durum Panosu (`/uretim/pano`) · Üretim Emirleri (`/uretim/emirler`)
- **Takip:** Lotlar (`/uretim/lotlar`) · İstatistikler (`/uretim/istatistikler`, Faz 5)
- **Tanımlar:** Makineler · Kalıplar · Uyumluluk Matrisi · Parkur/Alanlar · Vardiyalar ve Takvim · Operatörler · Hammadde Profilleri

Operatör paneli ayrı ve mobil öncelikli: `/operator` (Faz 4).

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
- **Çubuk:** iş = tek çubuk; içinde vardiya sınırlarında lot bölmeleri (`1000-1 | 1000-2 | 1000-3`), başta setup bölümü, ilerleme dolgusu (Faz 4'te gerçekleşenle), termin bayrağı; gecikiyorsa kırmızı kenar.
- **Sürükle-bırak:** yatay = zaman (15 dakikaya, Shift basılıyken vardiya başına yapışır), dikey = makine. Sürüklerken hayalet çubuk + hedef satır rengi: yeşil (uygun) / amber (uyarı) / kırmızı (engelli) ve gerekçe ipucu — **motorun aynı fonksiyonuyla**. Bırakınca iyimser güncelleme; sunucu reddederse geri alınır ve gerekçe Sonner ile gösterilir.
- **Bekleyen emirler paneli:** planlanmamış emirler tahtaya sürüklenir (ölçünün birden çok kalıbı varsa o makineye en uygun olanı seçilir) ya da **Öner** ile ilk 3 aday gösterilip tek tıkla yerleştirilir. Çakışmada seçenek: "sonrakileri kaydır" / "ilk boşluğa koy".
- **Detay paneli (Sheet):** emir, ürün/ölçü/versiyon, adetler, çevrim ve göz, lotlar + operatörler + notlar, aksiyonlar (Sahaya ver, Böl, Kalıp değiştir, İptal). Sağ tık menüsünde aynı aksiyonlar.
- **Erişilebilirlik:** çubuk klavyeyle odaklanır; ok tuşları bir adım / bir satır taşır, Enter onaylar, Esc iptal eder (dnd-kit klavye sensörü); ayrıca "Taşı…" diyaloğu. Renk tek başına bilgi taşımaz (ikon + metin).
- **Yenileme:** `AdminListRefreshBar` (otomatik aralık) + bölüm-yerel katman (AGENTS.md refetch deseni); Faz 4'te Realtime.
- **Dar ekran:** tahta masaüstü önceliklidir; telefonda makine başına salt-okunur ajanda listesi gösterilir.

### 8.3 Durum Panosu (Bitbucket benzeri Kanban)

Sütunlar: Planlandı → Sahaya Verildi → Kalıp Bağlanıyor → Üretimde ⇄ Duraklatıldı → Tamamlandı (son 7 gün). Kart: lot/iş no, ürün kodu + ölçü + renk, makine, adet ilerlemesi, termin, operatörler. Sürükleme = durum geçişi; yalnız `jobStateMachine`'in izin verdiği geçişler (ör. "Tamamlandı" adet/fire diyaloğunu açar). İsteğe bağlı kulvar (swimlane): makine ya da alan. Bitbucket panosundan farkı: kartta zaman bilgisi (planlanan bitiş, gecikme) de var.

### 8.4 Operatör ekranı (Faz 4, mobil)

"M-01 · A vardiyası 08–20" → aktif lot kartı: ürün, hedef / üretilen, büyük düğmeler: Kalıp bağlamaya başla · Üretimi başlat · Duraklat (neden seç) · Devam · Sayım gir · Fire gir (neden) · Not ekle · Vardiyayı kapat (devir notu). Vardiya bitince sıradaki lot (`1000-n+1`) kendiliğinden açılır.

### 8.5 İstatistik (Faz 5)

- **Ürün geçmişi:** ürün modeli → ölçü → versiyon filtresi (ör. *1.3 · Elcik çapı 10 mm*): her üretimin kök lotu, tarihleri, kaç vardiya sürdüğü, makine, kalıp, sağlam / fire, ortalama çevrim, planlanan ↔ gerçekleşen süre + grafikler.
- **Makine:** kullanım (planlı / gerçek / boş / duruş nedenleri), OEE. **Kalıp:** baskı sayacı, çevrim sapması, bakımı yaklaşanlar.
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
- **1.1 Rol + panel iskeleti** (küçük-orta): `production_planner` ("Üretim Planlama") uçtan uca (§4 kontrol listesi), `/uretim` layout + menü + karşılama sayfası, dokümanlar. *Infra:* yeni Cognito grubu (additive; prod'a ancak kullanıcı deploy ederse gider). *Kubi testi:* admin panelinden bir kullanıcıya rol ver → çıkış/giriş → `/uretim`'e yönlenir; diğer panellere giremez; yetkisiz kullanıcı `/uretim`'e giremez.
- **1.2 Şema — tanımlar** (orta): §5.1 modelleri + migration (önce plan/onay) + kubi için örnek veri script'i (birkaç parkur/makine/kalıp/vardiya düzeni; yalnız non-prod).
- **1.3 Tanım API'leri** (orta): core repository'ler + ProtectedApi `production/*` CRUD + request/response validator + testler.
- **1.4 Tanım ekranları** (büyük): Makineler, Kalıplar (ürün modeli → ölçü seçici + göz sayısı), Parkur, Vardiyalar (12/16/24 saat hazır şablonları + takvim istisnaları), Operatörler, Hammadde profilleri. Opsiyonel: Excel'den toplu makine/kalıp aktarımı.
- **1.5 Uyumluluk motoru + matris ekranı** (orta): `moldMachineCompatibility` + testler; Kalıp × Makine matrisi (✓ / ⚠ / ✗ + gerekçe). Planlama gelmeden bile "bu kalıp hangi makinede çalışır?" sorusunu cevaplar.

**Faz 2 — Emirler ve planlama motoru**
- **2.1 Şema** (orta): §5.2 modelleri + sayaç + migration (plan/onay).
- **2.2 Motor** (büyük): vardiya takvimi (TZ), süre, ileri planlama, lot bölme, çevrim zinciri, çakışmalar, kaydırma, durum makinesi — saf + kapsamlı testler (gece yarısını geçen vardiya, hafta sonu, bayram, 16 saatlik düzen, bakım penceresi).
- **2.3 Üretim emirleri** (orta): API + liste/oluşturma ekranı (yalnız kalıbı olan ölçülerin varyantları seçilebilir; müşteri sipariş kalemine opsiyonel bağ).
- **2.4 İş planlama API'si** (büyük): planla / taşı / böl / sahaya ver / sil — sunucuda aynı motorla doğrulama, satır kilidi + `version`, toplu yazım.
- **2.5 Öner** (orta): aday sıralama API'si + gerekçeler.

**Faz 3 — Tahta ve pano**
- **3.1** Salt-okunur tahta: satırlar, eksen, zoom, şimdi çizgisi, lot bölmeli çubuklar, setup/duruş blokları, detay paneli.
- **3.2** Sürükle-bırak + canlı doğrulama + bekleyen emirler paneli + klavye alternatifi.
- **3.3** Öner entegrasyonu + "sonrakileri kaydır".
- **3.4** Durum panosu (kanban).
- **3.5** Vardiya ekibi ataması + lot listesi/detayı + lot notları (planlayıcı) + (opsiyonel) yazdırılabilir lot etiketi / QR.

**Faz 4 — Saha (MES-lite)**
- **4.1** `production_operator` rolü + `/operator` mobil paneli + roster ↔ hesap bağlama.
- **4.2** Olay akışı (`ProductionEvent`), duruş ve fire nedenleri, sayım, vardiya devri (sıradaki lot otomatik).
- **4.3** Planlanan ↔ gerçekleşen tahtada (ilerleme, baseline), gecikme uyarısı + "sonrakileri kaydır" önerisi, kalıp baskı sayacı + bakım uyarısı.
- **4.4** (Opsiyonel) Realtime tahta güncellemesi (topic `${app}/${stage}/production/...`, abonelik yetkisi role göre, tarayıcı publish'e kapalı) + bildirimler.

**Faz 5 — İstatistik**
- **5.1** Toplama sorguları (ürün/ölçü/versiyon, makine, kalıp; OEE). **5.2** Ekranlar + Excel. **5.3** Gerçekleşen çevrimlerin planlamaya öneri olarak dönmesi.

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

1. **"Vardiya 12 / 16 / 24 saat"** ne anlama geliyor? (a) tek vardiya o kadar sürüyor (ör. 08:00–24:00 tek 16 saatlik vardiya), (b) günlük çalışma süresi (2×8 = 16 saat, 3×8 = 24 saat)? Makineye/parkura göre değişir mi? Hafta sonu çalışılıyor mu? → *Model ikisini de destekliyor; hazır şablonlar cevaba göre gelir.*
2. **Lot kökü** makine çalıştırması (iş) başına mı, üretim emri başına mı? Numaralar nereden başlasın? → *Öneri: iş başına; başlangıç mevcut defterdeki son numara + 1.*
3. **Operatörler:** herkesin giriş hesabı olacak mı, yoksa bazıları için planlayıcı mı girecek? Makine başında ortak tablet mi, kişisel telefon mu? → *Öneri: roster + opsiyonel hesap; Faz 4'e kadar veriyi planlayıcı girer.*
4. **Proses tipleri:** bakalit (termoset) enjeksiyon makineleri de planlamaya girecek mi? Kauçuk / sac metal? → *Öneri: plastik + bakalit; diğerleri sonra.*
5. **Kalıplar:** aile kalıbı (tek kalıpta farklı ölçüler) var mı? Bir ölçünün birden çok kalıbı (ör. 2 ve 4 gözlü) olabilir mi? Müşteriye ait kalıp var mı? → *Model hepsini destekliyor; teyit.*
6. **"En ekonomik"** önceliği: termine yetişmek > maliyet > süre sıralaması uygun mu? Makine saat maliyetleri bilinecek mi?
7. **Üretim emri kaynağı:** müşteri siparişinden mi, stok için mi, ikisi de mi? Sipariş durumu otomatik "Üretimde"ye geçsin mi (Faz 6)?
8. **Mevcut makine/kalıp listesi** (Excel) var mı? Varsa Dilim 1.4'e toplu aktarım eklenir.
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
