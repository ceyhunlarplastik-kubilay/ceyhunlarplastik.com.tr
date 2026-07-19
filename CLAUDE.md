@AGENTS.md
@PROJECT_OVERVIEW.md

## Bu dosyanın amacı
AGENTS.md ve PROJECT_OVERVIEW.md yukarıda import edildi — asıl mühendislik kuralları
ve indeks oralarda. Buradaki notlar sadece Claude Code'a özel, tekrar etmeyen
operasyon talimatlarıdır. Bu dosya tek başına yeterli olmalı: buradaki kuralları
izleyen bir ajan, önceki konuşmaları bilmeden aynı kalitede iş çıkarabilmeli.

## Dil
- Kullanıcıyla iletişim Türkçe. Kod, commit mesajı ve teknik terimler İngilizce
  kalabilir.

## Çalışma düzeni — kim ne yapar
- İş listesi [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md). İşler dilim dilim (slice)
  yürür: her dilim öncesi kısa plan sun, onay al, sonra uygula. Onaysız dilime başlama.
- Kod değişikliğini sen yaparsın; **commit, push ve deploy'u KULLANICI yapar.**
  Sen dilim sonunda hazır `git add` (dosya listesiyle) + `git commit` komutu verirsin.
- Commit mesajı sonuna trailer: `Co-Authored-By: Claude <model adı> <noreply@anthropic.com>`
- Tamamlanan her dilimden sonra IMPROVEMENT_PLAN.md'deki ilgili maddeye tarihli
  uygulama notu ekle: ne yapıldı, neden, nasıl doğrulandı, ne kaldı (kullanıcıda
  bekleyen kubi/deploy adımları dahil). Plan, projenin hafızasıdır.

## Stage ve test disiplini (KESİN KURAL)
- Deneme/test/doğrulama YALNIZCA kişisel stage'de:
  `export AWS_PROFILE=ceyhunlar-prod && npx sst dev --stage kubi`
  (Profil adı yanıltıcı: tek AWS hesabı var; `ceyhunlar-prod` profili kubi stage için
  de kullanılır.)
- `prod` ve `dev` stage'lerine deploy/test YAPMA. `prod` zaten `protect: true` +
  `removal: "retain"` ile korunuyor.
- DB: kubi ve diğer non-prod stage'ler **Neon** kullanır (SST Secret:
  `NeonDatabaseUrl`/`NeonDirectUrl`); prod **RDS** kullanır (RDS Proxy yalnız prod).
- Runtime doğrulaması gerektiren adımları (kubi'de sayfa/uç test etme, deploy)
  kullanıcıya bırak; ne test edeceğini madde madde net yaz.
- `npx sst diff --stage prod` READ-ONLY'dir, hiçbir şey uygulamaz — prod'a gidecek
  değişikliği önceden göstermek için kullanılabilir.

## Genel operasyon kuralları
- Migration gerektiren bir şema değişikliği öneriyorsan, migration dosyasını kendin
  oluşturmadan önce planı göster ve onay iste.
- `infra/` altında `prod` stage `protect: true` ve `removal: "retain"` ile korunuyor.
  Bu stage'i etkileyebilecek bir infra değişikliği yapmadan önce mutlaka planı göster.
- PROJECT_OVERVIEW.md'nin "Bilinen Doküman/Kod Sapmaları" bölümündeki noktalarda
  AGENTS.md/ARCHITECTURE.md'ye değil, gerçek koda güven.
- Büyük refactor (birden fazla feature/package'ı etkileyen) önerilerinde önce kısa bir
  plan sun, onay almadan uygulamaya başlama.
- Secret'lar `sst.Secret` ile taşınır; secret adları PascalCase'dir (`NeonDatabaseUrl`
  gibi). `.env` değişken adlarını (`RDS_PASSWORD` gibi) secret adı olarak kullanma.

## Domain ve env
- Canlı test domaini `ceyhunlarplastik.xyz`; ileride `ceyhunlarplastik.com.tr`'ye
  geçilecek. Domain'i ASLA hardcode etme — `DOMAIN` env'inden türet (infra ve
  next.config bunu zaten yapıyor).
- `.env` stage-özel config taşır ve SİLİNEMEZ: `AWS_REGION` zorunlu
  ([config.ts](config.ts) yoksa exception atar), `DOMAIN` infra genelinde kullanılır
  (API domain adları, cognito, cors, frontend). kubi `.env`'indeki `DOMAIN` bir
  placeholder'dır; gerçek değer prod deploy ortamında verilir.

## Definition of Done — bir dilim "bitti" demeden önce
Sırayla çalıştır (CI'daki bloklayıcı adımların lokal karşılığı):
1. Backend'e dokunduysan: `npm run typecheck:backend`
2. Frontend'e dokunduysan: `npm run typecheck -w frontend`
3. `npm run lint -w frontend` → **0 error şart**; mevcut warning'ler (~116,
   çoğu `no-explicit-any`) tolere edilir, yeni error ekleme.
4. Testler: `npm run test:ci -w @ceyhunlarweb/core` ·
   `npm run test -w @ceyhunlarweb/functions` · `npm run test -w frontend`
5. i18n kataloglarına dokunduysan: `messages/tr.json` ve `en.json` anahtar sayısı
   eşit olmalı.
6. Kullanıcıya teslim: değişen dosya listesi + hazır commit komutu + kubi'de
   adım adım doğrulama talimatı + (gerekiyorsa) deploy sonrası notlar.

## Bilinen tuzaklar (pahalıya öğrenilmiş dersler — tekrar etme)
- `next build`'i sst olmadan çalıştırırsan "Collecting page data" aşamasında
  "SST links are not active" hatasıyla düşer — bu BEKLENEN bir durumdur ve senin
  değişikliğinle ilgisizdir. "Compiled successfully" satırı modül çözümleme/derleme
  doğrulaması için yeterli sinyaldir. Tam build yalnız `sst shell` içinde çalışır.
- Root `npx tsc -p tsconfig.json` ~12k hata üretir — tamamı `.sst/platform`
  @types/node kaskadıdır. Infra dosyası değişikliğinde çıktıyı dokunduğun dosyalara
  grep'le filtrele; infra `typecheck:backend` kapsamında DEĞİLDİR.
- Frontend'den core'a `@ceyhunlarweb/core/...` paket importu ÇALIŞMAZ (core ham TS
  yayınlar, Turbopack exports map'ini çözemez). Frontend'den core'a erişim için
  tsconfig alias'ları kullan: `@core/*` → `packages/core/src/core/*`,
  `@core-prisma/*` → `packages/core/prisma/*`. Relative `../../../core/...` yazma.
- `validatorWrapper` `additionalProperties: true`'yu YALNIZ kök şemaya uygular; iç
  `queryStringParameters` / `body` objeleri KATI kalır (`z.toJSONSchema` →
  `additionalProperties: false`). Query parametresi gönderen bir route'a genel
  `idValidator`'ı verme — gönderilen her ekstra param 400 üretir. Route'un kabul
  ettiği query alanlarını açıkça beyan eden kendi validator'ını yaz.
- Bir handler'a response validator eklerken handler `apiResponseDTO` kullanmalı —
  `apiResponse` Date'leri ISO'ya normalize etmez, validator "must be string" ile
  patlar. Response şemaları `.loose()` olmalı (relation'lar tolere edilir).
  Prisma `Decimal` alanları JSON'da `{s,e,d}` objesi olarak serialize olur.
- Lambda 6MB senkron yanıt limiti yalnız BUFFERED API Gateway Lambda'ları için
  geçerlidir; frontend server `aws-lambda-streaming` kullanır, ona uygulanmaz.
- Client component'e ham API objesi / büyük DTO'yu prop olarak geçme — RSC flight
  payload'una serialize olup tarayıcıya iner (6MB/performans sınıfının kök nedeni).
  Server'da daralt/grupla, client'a görüntülenecek kadarını ver.
