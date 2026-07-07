---
paths:
  - "packages/core/src/core/middleware/**"
  - "packages/frontend/lib/auth/**"
---

# Role flag'leri: isSalesDirector dokümanda eksik ama kodda var

**Doküman ne diyor:** ARCHITECTURE.md derived boolean listesini `isOwner`, `isAdmin`, `isSupplier`, `isPurchasing`, `isSales`, `isCustomer`, `isContentEditor` olarak veriyor; AGENTS.md'deki capability-check listesi de `isSalesDirector`'ı içermiyor.

**Kodda gerçek durum:** `authMiddleware.ts` ayrıca `isSalesDirector` üretiyor (`user.groups.includes("sales_director")`) ve permission kontrollerinde `sales_director` aktif olarak kullanılıyor.

**Dikkat:**
- Permission/capability kontrolü yazarken flag setinin tamamını `authMiddleware.ts`'ten doğrula; dokümandaki listeyi eksiksiz sanma.
- `sales_director`, satış domain'inde `sales` adımlarını override edebilen süpervizör roldür (workflow onay zincirinde `customer -> sales -> sales_director -> admin`). Sales-domain permission mantığında bu rolü atlamak yetki hatası üretir.
- Yeni bir derived flag eklersen middleware çıktısı, frontend session varsayımları ve API permission kontrolleri arasında tutarlılığı koru (ARCHITECTURE.md'nin kendi kuralı).
