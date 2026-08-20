import createError from "http-errors"

import { applyVariantSupplierMarginVisibility } from "@/core/helpers/productVariants/supplierFieldVisibility"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    IGetVariantMatrixEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

export const getProductVariantMatrixHandler = ({
    productVariantMatrixRepository,
}: IProductVariantMatrixDependencies) => {
    return async (event: IGetVariantMatrixEvent) => {
        const { id: productId } = event.pathParameters

        const matrix = await productVariantMatrixRepository.getMatrix(productId)
        if (!matrix) throw new createError.NotFound("Product not found")

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                matrix: {
                    ...matrix,
                    rows: matrix.rows.map((row) => ({
                        ...row,
                        // Veri girişi operatörü marj alanlarını GÖRMEZ.
                        suppliers: row.suppliers.map((supplier) =>
                            applyVariantSupplierMarginVisibility(supplier, event.user),
                        ),
                    })),
                },
            },
        })
    }
}
