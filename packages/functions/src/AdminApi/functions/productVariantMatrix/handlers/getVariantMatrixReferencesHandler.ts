import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IVariantMatrixReferenceDependencies } from "@/functions/AdminApi/types/productVariantMatrix"

/**
 * Matris ekranının seçim listeleri — DAR sözleşme.
 *
 * `/product-variants/references` bu iş için kullanılamaz: o uç `["admin"]` ile
 * kapalı ve tedarikçileri TAM satır olarak döndürüyor (vergi numarası, adres,
 * telefon, varsayılan vade). Veri girişi operatörünün bunlara ihtiyacı yok ve
 * AGENTS.md gereği ticari alanlardan uzak tutulmalı — bu yüzden ayrı, yalnız
 * id + görünen ad taşıyan bir uç.
 *
 * Ürüne bağlı değildir; istemci tarafında ayrıca önbelleklenir.
 */
export const getVariantMatrixReferencesHandler = ({
    colorRepository,
    materialRepository,
    supplierRepository,
    measurementTypeRepository,
}: IVariantMatrixReferenceDependencies) => {
    return async () => {
        const [colors, materials, suppliers, measurementTypes] = await Promise.all([
            colorRepository.listColors({ limit: 1000 }),
            materialRepository.listMaterials({ limit: 1000 }),
            supplierRepository.listSuppliers({ limit: 1000 }),
            measurementTypeRepository.listMeasurementTypes({ limit: 1000 }),
        ])

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                colors: colors.data.map((color) => ({
                    id: color.id,
                    code: color.code,
                    name: color.name,
                    hex: color.hex,
                    system: color.system,
                })),
                materials: materials.data.map((material) => ({
                    id: material.id,
                    code: material.code ?? null,
                    name: material.name,
                })),
                // Yalnız id + ad. Vergi numarası / adres / vade BİLİNÇLİ olarak yok.
                suppliers: suppliers.data.map((supplier) => ({
                    id: supplier.id,
                    name: supplier.name,
                })),
                measurementTypes: measurementTypes.data.map((measurementType) => ({
                    id: measurementType.id,
                    code: measurementType.code,
                    name: measurementType.name,
                    baseUnit: measurementType.baseUnit,
                    displayOrder: measurementType.displayOrder,
                })),
            },
        })
    }
}
