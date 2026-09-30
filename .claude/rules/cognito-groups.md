---
paths:
  - "infra/cognito.ts"
  - "packages/core/src/core/middleware/**"
  - "packages/core/src/core/helpers/userAccess/**"
  - "packages/frontend/lib/auth/**"
  - "packages/functions/src/Cognito/**"
---

# Cognito grupları: 3 değil 10 grup var

**Doküman ne diyordu:** README.md eskiden "Groups (owner/admin/user)" ve "Three user groups with role precedence" diyordu (2026-08-29'da tazelendi).

**Kodda gerçek durum:** `infra/cognito.ts` on grup tanımlıyor: `owner`, `admin`, `user`, `supplier`, `purchasing`, `sales`, `sales_director`, `customer`, `content_editor`, `production_planner`. Ad listesinin tek kaynağı `packages/core/src/core/helpers/userAccess/groups.ts` (2026-09-25).

**Dikkat:**
- Rol/permission mantığına dokunurken üç gruplu modeli varsayma; on grubun tamamını hesaba kat.
- Özellikle `sales_director` (satış domain'inde `sales` üstü süpervizör), `customer`/`supplier` (portal dış kullanıcıları), `content_editor` (`/veri-girisi` workspace'i olan, geniş `/admin` erişimi olmayan iç rol) ve `production_planner` (`/uretim` workspace'i olan üretim planlama rolü) kolayca gözden kaçıyor.
- Yeni grup eklemek/varolanı değiştirmek Cognito + `groups.ts` + `authMiddleware` bayrağı + frontend yönlendirmesini (`navigation.ts`, `proxy.ts`) birlikte etkiler; tek noktada değişiklik bırakma. `groups.ts`'te olmayan grup backend'de de frontend token'ında da SESSİZCE düşer.
