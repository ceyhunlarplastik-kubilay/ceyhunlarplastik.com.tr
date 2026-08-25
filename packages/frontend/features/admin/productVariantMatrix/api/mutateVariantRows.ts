import { adminApiClient } from "@/lib/http/client"
import type { MatrixRowSupplier } from "@/features/admin/productVariantMatrix/api/types"

export type UpdateVariantSupplierInput = {
    productId: string
    supplierRowId: string
    values: {
        price?: number
        paymentTermDays?: number
        supplierVariantCode?: string
        supplierNote?: string
        minOrderQty?: number
        stockQty?: number
        currency?: string
        hasSupplierLogo?: boolean
        unitsPerPackage?: number
        packageLengthMm?: number
        packageWidthMm?: number
        packageHeightMm?: number
        packageWeightKg?: number
        minLeadTimeDays?: number
    }
}

export async function updateVariantSupplier(input: UpdateVariantSupplierInput): Promise<MatrixRowSupplier> {
    const res = await adminApiClient.patch<{ statusCode: number; payload: { supplier: MatrixRowSupplier } }>(
        `/products/${input.productId}/variant-matrix/suppliers/${input.supplierRowId}`,
        input.values
    )

    return res.data.payload.supplier
}

export async function deleteVariantSupplier(input: { productId: string; supplierRowId: string }): Promise<string> {
    const res = await adminApiClient.delete<{ statusCode: number; payload: { deletedId: string } }>(
        `/products/${input.productId}/variant-matrix/suppliers/${input.supplierRowId}`
    )

    return res.data.payload.deletedId
}

export async function deleteVariantRow(input: { productId: string; variantId: string }): Promise<string> {
    const res = await adminApiClient.delete<{ statusCode: number; payload: { deletedId: string } }>(
        `/products/${input.productId}/variant-matrix/variants/${input.variantId}`
    )

    return res.data.payload.deletedId
}

export type BulkDeleteVariantsResult = {
    deletedIds: string[]
    /** Silinemeyenler — kodu ve sebebiyle (ör. "2 sipariş kalemi"). */
    blocked: Array<{ id: string; fullCode: string; reason: string }>
    removedSizes: number
    rewrittenCodes: number
}

/**
 * Toplu silme. Tek tek `deleteVariantRow` çağırmak YANLIŞ olurdu: her silme
 * ölçü kodlarını yeniden hesaplatır ve kodlar çağrılar arasında kayar.
 */
export async function bulkDeleteVariantRows(
    input: { productId: string; variantIds: string[] },
): Promise<BulkDeleteVariantsResult> {
    const res = await adminApiClient.post<{ statusCode: number; payload: BulkDeleteVariantsResult }>(
        `/products/${input.productId}/variant-matrix/bulk-delete`,
        { variantIds: input.variantIds },
    )

    return res.data.payload
}
