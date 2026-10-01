/**
 * Denetim kayıtlarını kim görebilir: yalnız admin / owner.
 *
 * Asıl kural backend'dedir (`GET /audit-logs`, `auditLogReaderGroups`); burası yalnız
 * yetkisi olmayan kullanıcıya 403 verecek bir sekmeyi hiç göstermemek için.
 */
export function canViewAuditLogs(groups: readonly string[] | null | undefined): boolean {
    return Boolean(groups?.includes("admin") || groups?.includes("owner"))
}
