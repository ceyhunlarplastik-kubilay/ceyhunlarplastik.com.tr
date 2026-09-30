/**
 * Üretim planlama uçlarının yetkisi: planlayıcı + admin/owner (docs/production-planning.md §4).
 * Tek kaynak — operatör hesabı gelirse (`production_operator`) operatör uçları için ayrı
 * bir liste burada tanımlanır.
 */
export const PRODUCTION_PLANNER_GROUPS = ["production_planner", "admin", "owner"]

/** Kullanıcının grupları üretim planlama yetkisi veriyor mu (uç yetkisiyle aynı liste). */
export function hasProductionAccess(groups: readonly string[]): boolean {
    return groups.some((group) => PRODUCTION_PLANNER_GROUPS.includes(group))
}
