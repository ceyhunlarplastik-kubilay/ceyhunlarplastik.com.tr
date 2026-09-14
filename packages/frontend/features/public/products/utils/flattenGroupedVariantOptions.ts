import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"
import type {
    VariantColor,
    VariantMaterial,
    VariantMeasurement,
} from "@/features/public/products/components/ProductVariantTable"

/**
 * `/products/{id}/variant-table` (bkz. `useProductVariantTable`) satır başına
 * TEK varyant DEĞİL, ÖLÇÜYE göre gruplanmış satır döner (`groupVariantTableRows`,
 * P1.8(d)) — satırın kendisinde `id`/`fullCode` yok, onlar satırın `variants[]`
 * alt dizisinde. Tek bir GERÇEK varyant seçmesi gereken ekranlar (kampanya
 * varyant seçici, özel fiyat diyalogları, müşteriye tanımlı varyant ataması)
 * bunu flat bir `VariantTableData[]` sanıp doğrudan `variant.id`/`.fullCode`
 * okuyordu — hepsi `undefined` çıkıyordu (React "duplicate key" uyarısı +
 * backend'e geçersiz UUID gönderimi, kubi'de yakalandı 2026-09-14).
 *
 * Bu yardımcı gruplanmış satırları GERÇEK varyant düzeyine açar; `colorId`/
 * `materialIds`'i satırın `colors`/`materials` dizisinden çözer
 * (`ProductVariantTable.tsx`'in `variantCodesPanel`'inde zaten kullanılan aynı
 * desen). `name` alanı GERÇEK `ProductVariant.name` DEĞİLDİR — bu uç (public,
 * gruplanmış) onu hiç taşımaz; ölçü etiketi + renk/hammadde özetinden
 * sentezlenir, yalnız GÖRÜNTÜLEME amaçlıdır.
 */
export type FlatGroupedVariant = {
    id: string
    fullCode: string
    name: string
    color: VariantColor | null
    materials: VariantMaterial[]
    measurements: VariantMeasurement[]
}

export function flattenGroupedVariantOptions(
    options: readonly GroupedMeasurementOption[],
): FlatGroupedVariant[] {
    const flattened: FlatGroupedVariant[] = []

    for (const option of options) {
        const colors = (option.colors ?? []) as VariantColor[]
        const materials = (option.materials ?? []) as VariantMaterial[]
        const measurements = (option.measurements ?? []) as VariantMeasurement[]

        for (const variant of option.variants) {
            const color = variant.colorId
                ? colors.find((entry) => entry?.id === variant.colorId) ?? null
                : null
            const variantMaterials = variant.materialIds
                .map((materialId) => materials.find((entry) => entry?.id === materialId))
                .filter((material): material is VariantMaterial => Boolean(material))

            const descriptors = [
                color?.name,
                variantMaterials.map((material) => material.name).join(", ") || undefined,
            ].filter((value): value is string => Boolean(value))

            flattened.push({
                id: variant.id,
                fullCode: variant.fullCode,
                name: descriptors.length > 0 ? `${option.label} — ${descriptors.join(", ")}` : option.label,
                color,
                materials: variantMaterials,
                measurements,
            })
        }
    }

    return flattened
}
