import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import { recalculateProductVariantCodes } from "@/core/helpers/productVariants/productVariantMaintenance"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductMeasurementRequirementDependencies,
    IReplaceMeasurementRequirementsEvent,
} from "@/functions/AdminApi/types/productMeasurementRequirements"

export const replaceProductMeasurementRequirementsHandler = ({
    productMeasurementRequirementRepository,
    productRepository,
}: IProductMeasurementRequirementDependencies) => {
    return async (event: IReplaceMeasurementRequirementsEvent) => {
        const { id: productId } = event.pathParameters
        const { requirements } = event.body

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            // Aynı ölçü tipi + etiket ikilisi iki kez gelemez (şemadaki unique kısıtın
            // istek tarafındaki karşılığı; validator `.refine()` kullanamıyor).
            const seen = new Set<string>()
            for (const requirement of requirements) {
                const key = `${requirement.measurementTypeId}#${requirement.label.trim().toLowerCase()}`
                if (seen.has(key)) {
                    throw new createError.BadRequest(
                        `Aynı ölçü tipi ve etiket birden fazla kez tanımlanamaz: ${requirement.label}`,
                    )
                }
                seen.add(key)
            }

            const saved = await productMeasurementRequirementRepository.replaceForProduct(productId, requirements)

            // Şablon ölçü KODUNU belirler: `sortPriority` veya etiket değiştiyse
            // mevcut ölçü kayıtlarının anahtarları bayatlar. Kodları yeniden hesapla.
            await prisma.$transaction(
                (tx) => recalculateProductVariantCodes(tx, productId),
                { timeout: 15_000, maxWait: 10_000 },
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: { requirements: saved },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to replace product measurement requirements")
        }
    }
}
