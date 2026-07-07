---
paths:
  - "README.md"
  - "package.json"
  - "packages/frontend/**"
---

# Workspace paket listesi: README eski, gerçekte 4 paket var

**Doküman ne diyor:** README.md "This template uses npm Workspaces with 3 packages" diyor ve paket tablosunda yalnızca `core`, `functions`, `scripts` listeleniyor; `packages/frontend` hiç geçmiyor.

**Kodda gerçek durum:** Root `package.json` workspaces olarak `packages/*` kullanıyor ve dört ana paket mevcut: `core`, `functions`, `frontend`, `scripts`. Next.js uygulaması `packages/frontend` altında ana runtime olarak yaşıyor — app router, feature modülleri, mqtt dependency ve admin/satış notification shell burada.

**Dikkat:**
- Paket yapısıyla ilgili karar verirken README'nin paket tablosuna değil, root `package.json` ve gerçek `packages/` içeriğine güven.
- Frontend'e ait bir değişikliği "paket listesinde yok" diye başka pakete taşıma; `packages/frontend` birinci sınıf bir workspace paketidir.
- README'yi güncelliyorsan paket tablosuna `packages/frontend`'i ekle ve "3 packages" ifadesini düzelt.
