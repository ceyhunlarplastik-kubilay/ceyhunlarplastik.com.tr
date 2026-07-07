---
paths:
  - "infra/cognito.ts"
  - "packages/core/src/core/middleware/**"
  - "packages/frontend/lib/auth/**"
  - "packages/functions/src/Cognito/**"
---

# Cognito grupları: 3 değil 9 grup var

**Doküman ne diyor:** README.md "Groups (owner/admin/user)" ve "Three user groups with role precedence" diyor.

**Kodda gerçek durum:** `infra/cognito.ts` dokuz grup tanımlıyor: `owner`, `admin`, `user`, `supplier`, `purchasing`, `sales`, `sales_director`, `customer`, `content_editor`.

**Dikkat:**
- Rol/permission mantığına dokunurken README'nin üç gruplu modelini varsayma; dokuz grubun tamamını hesaba kat.
- Özellikle `sales_director` (satış domain'inde `sales` üstü süpervizör), `customer`/`supplier` (portal dış kullanıcıları) ve `content_editor` (`/veri-girisi` workspace'i olan, geniş `/admin` erişimi olmayan iç rol) kolayca gözden kaçıyor.
- Yeni grup eklemek/varolanı değiştirmek Cognito + `authMiddleware` + frontend session akışını birlikte etkiler; tek noktada değişiklik bırakma.
