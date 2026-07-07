---
paths:
  - "infra/**"
  - "sst.config.ts"
---

# Infra dosya envanteri: README listesi eksik

**Doküman ne diyor:** README.md infra tablosunda yalnızca `db.ts`, `cognito.ts`, `AdminApi.ts`, `PublicApi.ts`, `ProtectedApi.ts`, `OwnerApi.ts` listeleniyor.

**Kodda gerçek durum:** `infra/` altında bunlara ek olarak `frontend.ts`, `storage.ts`, `router.ts`, `businessWorkflow.ts`, `userAccessLifecycle.ts` ve `observability.ts` var (toplam 12 dosya). Hepsi `sst.config.ts` tarafından yükleniyor.

**Dikkat:**
- Yeni infra kaynağı eklerken veya mevcut wiring'i ararken README tablosuna değil, gerçek `infra/` dizin içeriğine ve `sst.config.ts` importlarına bak.
- Workflow, realtime, storage veya routing ile ilgili bir kaynak "listede yok" diye yeni dosya açma; büyük ihtimalle `businessWorkflow.ts`, `userAccessLifecycle.ts`, `storage.ts` veya `router.ts` içinde zaten vardır.
- Hatırlatma (CLAUDE.md): `prod` stage `protect: true` + `removal: "retain"` ile korunuyor; prod'u etkileyebilecek infra değişikliğinde önce plan göster.
