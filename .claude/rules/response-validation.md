---
paths:
  - "packages/functions/src/**"
  - "packages/core/src/core/middy.ts"
---

# Response validation: zorunlu değil, dosya bazında değişen opsiyonel bir katman

**Doküman ne diyor:** AGENTS.md "validators/ holds request/response validation" diyor ve middleware stack'inde "response validation"ı standart bir adım gibi listeliyor. ARCHITECTURE.md "Response validation is actively used in parts of the backend" diyor.

**Kodda gerçek durum:** `lambdaHandler` `responseValidator`'ı opsiyonel parametre olarak alıyor ve kullanım tutarsız: örneğin AdminApi categories create/delete/update `responseValidator` geçmiyor; buna karşılık `businessRequests` ve birçok public/CRM route'u `responseValidator` kullanıyor. Kapsam handler/dosya bazında değişiyor.

**Dikkat:**
- Yeni endpoint eklerken response validation'ın beklenip beklenmediğini varsayma; aynı klasördeki komşu handler'ların `lambdaHandler` çağrılarına bakıp o alanın mevcut pratiğini takip et.
- `responseValidator` kullanan bir handler'ın response shape'ini değiştiriyorsan validator'ı da aynı değişiklikte güncelle; yoksa runtime'da response validation hatası üretirsin.
- Validator'sız bir handler'a "eksik" diye otomatik validator ekleme; bu bilinçli bir dosya-bazı tercih olabilir. Eklemek istiyorsan bunu ayrı ve açık bir karar olarak sun.
- Request validation ise tutarlı biçimde Zod ile yapılıyor — bu sapma yalnızca response tarafı için geçerli.
