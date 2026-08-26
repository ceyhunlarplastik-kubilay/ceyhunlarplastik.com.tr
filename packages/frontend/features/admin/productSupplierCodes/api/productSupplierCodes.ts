import { adminApiClient } from "@/lib/http/client"
import type {
    CreateProductSupplierCodeInput,
    ListProductSupplierCodesResponse,
    ProductSupplierCodeEntry,
} from "@/features/admin/productSupplierCodes/api/types"

/** Tedarikçi harfi sözlüğü ÜRÜN MODELİ BAŞINA — uçlar da ürünün altında. */

export async function getProductSupplierCodes(productId: string): Promise<ProductSupplierCodeEntry[]> {
    const res = await adminApiClient.get<ListProductSupplierCodesResponse>(
        `/products/${productId}/supplier-codes`,
    )
    return res.data.payload.codes ?? []
}

export async function createProductSupplierCode(
    productId: string,
    input: CreateProductSupplierCodeInput,
): Promise<ProductSupplierCodeEntry> {
    const res = await adminApiClient.post<{ statusCode: number; payload: { code: ProductSupplierCodeEntry } }>(
        `/products/${productId}/supplier-codes`,
        input,
    )
    return res.data.payload.code
}

/** HARF gönderilmez — değiştirilemez; yalnız tedarikçi ataması düzenlenir. */
export async function updateProductSupplierCode(
    productId: string,
    codeId: string,
    supplierId: string,
): Promise<ProductSupplierCodeEntry> {
    const res = await adminApiClient.patch<{ statusCode: number; payload: { code: ProductSupplierCodeEntry } }>(
        `/products/${productId}/supplier-codes/${codeId}`,
        { supplierId },
    )
    return res.data.payload.code
}

export async function deleteProductSupplierCode(productId: string, codeId: string): Promise<string> {
    const res = await adminApiClient.delete<{ statusCode: number; payload: { deletedId: string } }>(
        `/products/${productId}/supplier-codes/${codeId}`,
    )
    return res.data.payload.deletedId
}
