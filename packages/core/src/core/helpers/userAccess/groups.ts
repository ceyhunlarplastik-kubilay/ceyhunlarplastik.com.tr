/**
 * Cognito grup adlarının TEK KAYNAĞI.
 *
 * Bu liste eskiden ~6 dosyada elle tekrarlanıyordu (backend `authMiddleware`,
 * frontend `cognito-tokens`, Admin/Owner API validator'ları…). Birinde eksik
 * kalan grup SESSİZCE bozar: token parser'ı bilmediği grubu düşürür, kullanıcı
 * rolü olduğu hâlde panele giremez ve hiçbir yerde hata görünmez.
 *
 * Saf modül — hiçbir import YOK: frontend bu dosyayı `@core/helpers/userAccess/groups`
 * alias'ıyla içe alıyor ve core'daki `@/` alias'ı frontend'de çözülmez.
 *
 * Yeni grup eklerken: `infra/cognito.ts`'e `UserGroup` kaynağını, buraya adını,
 * `authMiddleware.ts`'e türetilmiş bayrağını ekle; panel yönlendirmesi için
 * frontend `features/auth/lib/navigation.ts` + `proxy.ts`.
 */
export const ALL_USER_GROUPS = [
    "owner",
    "admin",
    "user",
    "supplier",
    "purchasing",
    "sales",
    "sales_director",
    "customer",
    "content_editor",
    "production_planner",
] as const

/** Admin'in atayabildiği gruplar — `admin`/`owner` atamak yalnız owner'a açık. */
export const BUSINESS_USER_GROUPS = [
    "user",
    "supplier",
    "purchasing",
    "sales",
    "sales_director",
    "customer",
    "content_editor",
    "production_planner",
] as const

export const PRIVILEGED_USER_GROUPS = ["admin", "owner"] as const

export type UserGroup = (typeof ALL_USER_GROUPS)[number]

export function isKnownUserGroup(group: string): group is UserGroup {
    return (ALL_USER_GROUPS as readonly string[]).includes(group)
}
