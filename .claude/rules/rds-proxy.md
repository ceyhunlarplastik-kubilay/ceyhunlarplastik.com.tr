---
paths:
  - "infra/db.ts"
  - "packages/core/src/core/db/**"
  - "packages/core/prisma.config.ts"
---

# RDS Proxy: her stage'de değil, yalnızca prod'da açık

**Doküman ne diyor:** README.md infra tablosunda `infra/db.ts` için "VPC, RDS Postgres (with RDS Proxy), Prisma DevCommand" diyor — proxy'nin her zaman açık olduğu izlenimi veriyor.

**Kodda gerçek durum:** `infra/db.ts` içinde `proxy: isProd` — RDS Proxy yalnızca `prod` stage için etkin. Dev/test stage'leri doğrudan RDS'e bağlanıyor. Ayrıca Prisma, non-development runtime'larda bilinçli olarak küçük bir `pg` pool kullanıyor (bkz. ARCHITECTURE.md: kapasite incelemesi olmadan yükseltme).

**Dikkat:**
- Bağlantı davranışını (pool boyutu, timeout, connection spike) değerlendirirken stage farkını hesaba kat: prod proxy arkasında, diğer stage'ler değil.
- Dev stage'de görülen bağlantı davranışı prod'u temsil etmez; tersine, prod'daki proxy katmanı dev'de yoktur.
- `proxy` ayarını veya pool boyutunu değiştirmek prod veritabanını doğrudan etkiler — CLAUDE.md gereği önce plan gösterip onay al.
