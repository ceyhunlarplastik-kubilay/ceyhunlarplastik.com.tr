import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies } from "@/functions/AdminApi/types/productVariants"

export const getProductVariantReferencesHandler = ({
    colorRepository,
    materialRepository,
    supplierRepository,
    measurementTypeRepository,
}: IProductVariantDependencies) => {
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
                colors: colors.data,
                materials: materials.data,
                suppliers: suppliers.data,
                measurementTypes: measurementTypes.data,
            },
        })
    }
}
