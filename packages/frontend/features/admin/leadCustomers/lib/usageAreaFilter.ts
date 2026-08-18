/**
 * Kullanım alanı listesinin süzme yüklemi — saf, bu yüzden testlenebilir.
 *
 * Taksonomi: sektör → üretim grubu → kullanım alanı. Yani bir kullanım alanının
 * `parentValueId` alanı ÜRETİM GRUBUNU, grubun `parentValueId`'si SEKTÖRÜ gösterir.
 *
 * İki daraltma da VARSAYILANDIR, kilit değil: kullanıcı sektör chip'ine basarak
 * ya da grup göstergesindeki "Kaldır" ile çıkabilir. Seçili kullanım alanları
 * filtre dışında kalsa bile GÖRÜNÜR kalır — kullanıcı neyi seçtiğini kaybetmemeli.
 */

/** Picker'daki "Tümü" chip'inin değeri; tek kaynak burası. */
export const ALL_SECTORS = "__all__"

type Candidate = {
    id: string
    name: string
    /** Üretim grubu kimliği. */
    parentValueId?: string | null
}

export type UsageAreaFilterInput = {
    /** Kullanım alanının ait olduğu sektör (grup üzerinden çözülmüş). */
    sectorId: string | null
    sectorName: string
    sectorFilterId: string
    productionGroupFilterId: string | null
    isSelected: boolean
    /** Küçük harfe indirilmiş arama metni; boşsa arama uygulanmaz. */
    search: string
}

export function matchesUsageAreaFilter(
    value: Candidate,
    input: UsageAreaFilterInput,
): boolean {
    if (input.isSelected) {
        // Seçili olan her koşulda görünür; yalnız arama onu gizleyebilir.
        return matchesSearch(value, input)
    }

    const sectorOk = input.sectorFilterId === ALL_SECTORS || input.sectorId === input.sectorFilterId
    if (!sectorOk) return false

    const groupOk = !input.productionGroupFilterId
        || value.parentValueId === input.productionGroupFilterId
    if (!groupOk) return false

    return matchesSearch(value, input)
}

function matchesSearch(value: Candidate, input: UsageAreaFilterInput) {
    if (!input.search) return true

    return value.name.toLocaleLowerCase("tr").includes(input.search)
        || input.sectorName.toLocaleLowerCase("tr").includes(input.search)
}
