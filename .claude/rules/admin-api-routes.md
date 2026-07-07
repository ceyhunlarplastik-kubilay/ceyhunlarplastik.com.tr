---
paths:
  - "infra/AdminApi.ts"
  - "packages/functions/src/AdminApi/**"
---

# Admin API route tablosu: README ciddi biçimde eksik

**Doküman ne diyor:** README.md "API Routes" altında yalnızca Users, Categories, Colors, Suppliers, Products, Product Variants, Product Variant Suppliers, Measurement Types, Product Measurements, Materials ve Assets yüzeylerini listeliyor.

**Kodda gerçek durum:** `infra/AdminApi.ts` içinde 106 route var. README tablosunda hiç geçmeyen ek yüzeyler: `customers`, `company-contacts`, `orders`, `approval-requests`, `web-requests`, `product-attributes`, `product-attribute-values`, `industrial-usage-assignments` ve benzerleri.

**Dikkat:**
- Bir admin endpoint'inin var olup olmadığını README'den değil, doğrudan `infra/AdminApi.ts` route tanımlarından ve `packages/functions/src/AdminApi/functions/**` klasörlerinden doğrula.
- Yeni admin route eklemeden önce benzer bir yüzeyin zaten var olup olmadığını `infra/AdminApi.ts` içinde ara; tablo eksik olduğu için "yok" varsayımı yanıltıcıdır.
- README route tablosunu güncellemek düşük öncelikli; asıl kaynak infra dosyasıdır.
