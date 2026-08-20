/**
 * Versiyon kaydı (`ProductVersion`) için tekilleştirme anahtarı ve ilk atama sırası.
 *
 * Kodun 4. segmenti (`V1`, `V2`, …) ürün modeli içindeki RENK + HAMMADDE
 * kombinasyonunu ifade eder. Ölçü kodundan iki farkı vardır:
 *  - Doğal bir "küçükten büyüğe" sırası yoktur; ilk atamada yalnız DERLİ TOPLU ve
 *    DETERMİNİSTİK bir sıra kurulur (renk kodu, sonra hammadde kodu).
 *  - İlk atamadan sonra append-only'dur: sonradan eklenen bir kombinasyon araya
 *    girmez, sona eklenir. Bu yüzden `ProductSize` gibi saklanan bir `sortKey`
 *    kolonuna ihtiyaç duymaz — sıra yalnız ilk atamada, bellekte hesaplanır.
 *
 * Saf modül: I/O yok, Prisma yok.
 */

export type VersionColorLike = {
    id: string
    /** `ColorSystem` — RAL, PANTONE, NCS, CUSTOM */
    system: string
    code: string
}

export type VersionMaterialLike = {
    id: string
    /** "PP", "PE", "PVC" — opsiyonel; yoksa ada düşülür. */
    code: string | null
    name: string
}

export type VersionKeyInput = {
    color: VersionColorLike | null
    materials: readonly VersionMaterialLike[]
}

const NO_COLOR_TOKEN = "none"

/** "9005" ile "1013" gibi sayısal kodların doğru sıralanması için. */
const naturalCollator = new Intl.Collator("tr", { numeric: true, sensitivity: "base" })

function sortedMaterialIds(materials: readonly VersionMaterialLike[]): string[] {
    return [...new Set(materials.map((material) => material.id))].sort()
}

/**
 * Versiyonun tekilleştirme anahtarı — "color:<id>|materials:<id>,<id>".
 *
 * Hammadde ÇOKLUDUR (mevcut `ProductVariant.materials` m2m davranışı korunuyor),
 * bu yüzden id'ler tekilleştirilip sıralanır: aynı küme farklı sırada girildiğinde
 * ikinci bir versiyon oluşmamalı.
 */
export function buildVersionSignature(input: { colorId: string | null; materialIds: readonly string[] }): string {
    const colorToken = input.colorId ?? NO_COLOR_TOKEN
    const materialToken = [...new Set(input.materialIds)].sort().join(",")
    return `color:${colorToken}|materials:${materialToken}`
}

/** `VersionKeyInput`'tan imza üretir — çağıranın id çıkarmasına gerek kalmasın diye. */
export function buildVersionSignatureFromEntities(input: VersionKeyInput): string {
    return buildVersionSignature({
        colorId: input.color?.id ?? null,
        materialIds: sortedMaterialIds(input.materials),
    })
}

function materialSortToken(materials: readonly VersionMaterialLike[]): string {
    return [...materials]
        .map((material) => material.code?.trim() || material.name.trim())
        .sort((left, right) => naturalCollator.compare(left, right))
        .join(",")
}

/**
 * İlk atama sırası: önce renksizler, sonra renk sistemi + kodu, sonra hammadde
 * kodları. Eşitlik durumunda imza ayırır — iki versiyon asla aynı sıraya düşmez.
 */
export function compareVersionKeys(left: VersionKeyInput & { signature: string }, right: VersionKeyInput & { signature: string }): number {
    const leftHasColor = left.color ? 1 : 0
    const rightHasColor = right.color ? 1 : 0
    if (leftHasColor !== rightHasColor) return leftHasColor - rightHasColor

    if (left.color && right.color) {
        const systemComparison = naturalCollator.compare(left.color.system, right.color.system)
        if (systemComparison !== 0) return systemComparison

        const codeComparison = naturalCollator.compare(left.color.code, right.color.code)
        if (codeComparison !== 0) return codeComparison
    }

    const materialComparison = naturalCollator.compare(
        materialSortToken(left.materials),
        materialSortToken(right.materials),
    )
    if (materialComparison !== 0) return materialComparison

    if (left.signature !== right.signature) return left.signature < right.signature ? -1 : 1
    return 0
}
