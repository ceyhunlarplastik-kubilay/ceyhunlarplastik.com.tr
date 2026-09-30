/** Ekip listelerinde operatör adı ve sırası — tek yerde (Türkçe harf sırası). */
export type OperatorLike = { id: string; firstName: string; lastName: string; employeeNo: string | null; isActive: boolean }

export function formatOperatorName(operator: Pick<OperatorLike, "firstName" | "lastName">): string {
    return `${operator.firstName} ${operator.lastName}`.trim()
}

/** Kısa ad: "Ahmet Y." — dar hücrelerde. */
export function formatOperatorShortName(operator: Pick<OperatorLike, "firstName" | "lastName">): string {
    const initial = operator.lastName.trim().charAt(0)
    return initial ? `${operator.firstName} ${initial.toLocaleUpperCase("tr-TR")}.` : operator.firstName
}

/** Aktifler önce, sonra soyad + ad (tr). */
export function sortOperators<T extends OperatorLike>(operators: T[]): T[] {
    return [...operators].sort((a, b) => (
        Number(b.isActive) - Number(a.isActive)
        || a.lastName.localeCompare(b.lastName, "tr")
        || a.firstName.localeCompare(b.firstName, "tr")
    ))
}
