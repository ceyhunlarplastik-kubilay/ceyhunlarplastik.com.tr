---
paths:
  - "packages/core/prisma/schema.prisma"
  - "packages/**/suppliers/**"
  - "packages/functions/src/ProtectedApi/**"
---

# Supplier-purchasing ataması: tekil FK değil, many-to-many relation

**Doküman ne diyor:** ARCHITECTURE.md iki yerde `Supplier.assignedPurchasingUserId` diyor ve "the schema still keeps a single assignedPurchasingUserId on Supplier" diyerek çoklu purchasing atamasının henüz uygulanmadığını söylüyor.

**Kodda gerçek durum:** `schema.prisma` içinde `Supplier.assignedPurchasingUserId` yok. Bunun yerine many-to-many relation var: `Supplier.assignedPurchasingSuppliers User[]` ve `User.assignedPurchasingSuppliers Supplier[]` (`"SupplierPurchasingAssignments"` relation'ı). Yani çoklu purchasing kullanıcısı ataması şemada zaten mümkün.

**Dikkat:**
- Supplier-purchasing sahipliği sorgularken tekil FK varsayma; relation üzerinden (many-to-many) sorgula. "Any assigned purchasing user may approve" kuralı bu relation ile çalışır.
- ARCHITECTURE.md'nin "follow-up schema change gerekir" notu geçersiz — şema değişikliği zaten yapılmış; onun üzerine ikinci bir tekil FK ekleme.
- Buna karşılık `Customer.assignedSalesUserId` hâlâ tekil FK'dır; müşteri tarafındaki modeli supplier tarafına genelleme (ve tersi).
- `User.supplierId` (portal hesabı bağlama) ile purchasing ataması (iç personel sahipliği) farklı kavramlardır; karıştırma.
