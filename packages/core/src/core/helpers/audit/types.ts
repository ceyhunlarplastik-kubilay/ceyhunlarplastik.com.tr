/**
 * Audit (denetim kaydı) tipleri.
 *
 * Saf modül — hiçbir import YOK: frontend bu dosyayı `@core/helpers/audit/types`
 * alias'ıyla içe alabilsin (core'daki `@/` alias'ı frontend'de çözülmez).
 */

/**
 * Denetlenen modeller. Yeni bir modeli denetlemeye başlarken adını buraya ekle:
 * okuma ucunun validator'ı ve kapsam testi bu listeden türer.
 */
export const AUDIT_ENTITY_TYPES = ["Category", "Customer"] as const

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export type AuditAction = "CREATE" | "UPDATE" | "DELETE"

/** Kimliği `authMiddleware`'in doğruladığı kullanıcı; alanlar OLAY ANINDAKİ künyedir. */
export type AuditUserActor = {
    type: "USER"
    userId: string
    cognitoSub: string
    email: string
    name: string
    groups: string[]
}

/** İnsan olmayan aktör: olay tetikli Lambda, cron, operatör CLI'ı. */
export type AuditSystemActor = {
    type: "SYSTEM"
    name: string
}

/** Giriş yapmamış kişi (sitedeki public form). Kimliği yok; IP ve tarayıcı bağlamda kalır. */
export type AuditAnonymousActor = {
    type: "ANONYMOUS"
    name: string
}

export type AuditActor = AuditUserActor | AuditSystemActor | AuditAnonymousActor

export type AuditActorType = AuditActor["type"]

/** Bir yazmanın "kim / nereden" bilgisi. Yazan her repository metodu bunu ZORUNLU alır. */
export type AuditContext = {
    actor: AuditActor
    /** İşlemi başlatan uç ("PUT /categories/{id}") ya da sistem kaynağı. */
    source: string
    /** API Gateway requestId — CloudWatch'taki `correlationId` ile aynı değer. */
    requestId: string | null
    ipAddress: string | null
    userAgent: string | null
}

/** Snapshot'ta saklanabilen yaprak değer: JSON'a olduğu gibi yazılır. */
export type AuditValue = string | number | boolean | null | string[]

/** Bir kaydın denetlenen hâli: alan yolu → değer ("translations.en.name" gibi). */
export type AuditSnapshot = Record<string, AuditValue>

export type AuditChange = {
    field: string
    before: AuditValue
    after: AuditValue
}

export type AuditJson = string | number | boolean | null | AuditJson[] | { [key: string]: AuditJson }

/** Olayın bağlamı (silmede kaskadla gidenler, iş talebi id'si gibi). */
export type AuditMetadata = { [key: string]: AuditJson }
