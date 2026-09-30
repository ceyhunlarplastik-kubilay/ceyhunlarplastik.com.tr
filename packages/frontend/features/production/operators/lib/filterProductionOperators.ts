import type { ProductionOperator } from "@/features/production/operators/api/types"

/** URL değeri (`?durum=`): boş = hepsi. */
export type ProductionOperatorStatusFilter = "" | "aktif" | "pasif"

export type ProductionOperatorFilters = {
    search: string
    status: string
}

export function operatorFullName(operator: Pick<ProductionOperator, "firstName" | "lastName">): string {
    return `${operator.firstName} ${operator.lastName}`
}

const collator = new Intl.Collator("tr-TR", { sensitivity: "base" })

/**
 * Operatör listesi küçük ve tamamı tek çağrıda geliyor → filtre ve sıralama İSTEMCİDE
 * (AGENTS.md "Filtrelemeyi nereye koymalı"). Sıra: aktifler önce, sonra soyadı + ad —
 * Türkçe harf sırasıyla (veritabanı sıralaması Ç/Ş/İ'yi yanlış yere koyabilir).
 */
export function filterProductionOperators(
    operators: ProductionOperator[],
    { search, status }: ProductionOperatorFilters,
): ProductionOperator[] {
    const needle = search.trim().toLocaleLowerCase("tr-TR")
    const digits = needle.replace(/\D/g, "")

    return operators
        .filter((operator) => {
            if (status === "aktif" && !operator.isActive) return false
            if (status === "pasif" && operator.isActive) return false
            if (!needle) return true

            const textMatch = [operatorFullName(operator), operator.employeeNo]
                .some((value) => value?.toLocaleLowerCase("tr-TR").includes(needle))
            // Telefon, biçimden bağımsız rakamlarla aranır ("0532 111" ↔ "05321112233").
            const phoneMatch = digits.length >= 3 && (operator.phone ?? "").replace(/\D/g, "").includes(digits)
            return textMatch || phoneMatch
        })
        .sort((a, b) => (
            Number(b.isActive) - Number(a.isActive)
            || collator.compare(a.lastName, b.lastName)
            || collator.compare(a.firstName, b.firstName)
        ))
}
