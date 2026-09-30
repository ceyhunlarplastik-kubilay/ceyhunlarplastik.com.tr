import createError from "http-errors"

import { boardRangeInstants } from "@/core/helpers/production/productionBoard"
import { buildProductHistory, defaultStatsRange, findStatsRangeIssue } from "@/core/helpers/production/productionStats"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetProductHistoryEvent, IProductionStatsDependencies } from "@/functions/ProtectedApi/types/productionStats"

/**
 * Ürün geçmişi (Faz 5.1): bir ürün modelinin — ölçü ve versiyon süzgeçli — her üretimi bir satır +
 * özet. Hesap kuralları (kesin sayım / raporlu toplam, gerçek çevrim, aile kalıbı) core
 * `productionStats.ts`'te; burada pencere, süzgeç doğrulaması ve okuma.
 */
export const getProductHistoryHandler = ({ productionReferenceRepository, productionStatsRepository }: IProductionStatsDependencies) => {
    return async (event: IGetProductHistoryEvent) => {
        const query = event.queryStringParameters
        const defaults = defaultStatsRange(new Date())
        const from = query.from ?? defaults.from
        const to = query.to ?? defaults.to
        const issue = findStatsRangeIssue(from, to)
        if (issue) throw new createError.BadRequest(issue)

        const catalog = await productionReferenceRepository.getProductSizes(query.productId)
        if (!catalog) throw new createError.NotFound("Ürün modeli bulunamadı.")
        if (query.sizeId && !catalog.sizes.some((size) => size.id === query.sizeId)) {
            throw new createError.BadRequest("Ölçü bu ürün modeline ait değil.")
        }
        const sizes = query.sizeId ? catalog.sizes.filter((size) => size.id === query.sizeId) : catalog.sizes

        const now = new Date()
        const { start, end } = boardRangeInstants(from, to)
        const [versions, history] = await Promise.all([
            productionStatsRepository.listProductVersions(query.productId),
            productionStatsRepository.listProductHistoryJobs({
                productSizeIds: sizes.map((size) => size.id),
                versionSignature: query.version ?? null,
                from: start,
                to: end,
            }),
        ])

        const { rows, summary } = buildProductHistory({
            jobs: history.jobs,
            sizes: new Map(sizes.map((size) => [size.id, { id: size.id, sizeCode: size.sizeCode, label: size.label }])),
            versions: new Map(versions.map((version) => [version.signature, {
                code: version.code,
                colorName: version.colorName,
                colorHex: version.colorHex,
                materials: version.materials,
            }])),
            truncated: history.truncated,
            window: { start, end },
            now,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                product: catalog.product,
                range: { from, to },
                // Süzgeç seçenekleri sonuçla aynı kaynaktan: ürün modelinin tüm ölçüleri ve versiyonları.
                sizes: catalog.sizes.map((size) => ({ id: size.id, sizeCode: size.sizeCode, label: size.label })),
                versions: versions.map((version) => ({
                    signature: version.signature,
                    code: version.code,
                    colorName: version.colorName,
                    colorHex: version.colorHex,
                    materials: version.materials,
                })),
                rows,
                summary,
            },
        })
    }
}

export { getMachineStatsHandler } from "./machineStats"
export { getMoldStatsHandler } from "./moldStats"
