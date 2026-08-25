import { adminApiClient } from "@/lib/http/client"
import type {
    CreateVariantVersionInput,
    ListVariantVersionsResponse,
    VariantVersionEntry,
} from "@/features/admin/variantVersions/api/types"

/**
 * Versiyon sözlüğü ÜRÜN MODELİ BAŞINA tutulur — uçlar da ürünün altındadır.
 * Varyant girişi tanımsız kombinasyonu reddeder; önce buradan tanımlanır.
 */

export async function getVariantVersions(
    productId: string
): Promise<{ versions: VariantVersionEntry[]; nextCode: number }> {
    const res = await adminApiClient.get<ListVariantVersionsResponse>(
        `/products/${productId}/variant-versions`
    )
    return {
        versions: res.data.payload.versions ?? [],
        nextCode: res.data.payload.nextCode ?? 1,
    }
}

export async function createVariantVersion(
    productId: string,
    input: CreateVariantVersionInput
): Promise<VariantVersionEntry> {
    const res = await adminApiClient.post<{ statusCode: number; payload: { version: VariantVersionEntry } }>(
        `/products/${productId}/variant-versions`,
        input
    )
    return res.data.payload.version
}

/**
 * Kombinasyonu değiştirir. NUMARA gönderilmez — değiştirilemez; kod (10.5.8.V1)
 * içinde renk/hammadde geçmediği için bu düzenleme hiçbir varyant kodunu
 * yeniden yazmaz.
 */
export async function updateVariantVersion(
    productId: string,
    versionId: string,
    input: CreateVariantVersionInput,
): Promise<VariantVersionEntry> {
    const res = await adminApiClient.patch<{ statusCode: number; payload: { version: VariantVersionEntry } }>(
        `/products/${productId}/variant-versions/${versionId}`,
        { colorId: input.colorId, materialIds: input.materialIds },
    )
    return res.data.payload.version
}

export async function deleteVariantVersion(productId: string, versionId: string): Promise<string> {
    const res = await adminApiClient.delete<{ statusCode: number; payload: { deletedId: string } }>(
        `/products/${productId}/variant-versions/${versionId}`
    )
    return res.data.payload.deletedId
}
