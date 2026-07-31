import { adminApiClient } from "@/lib/http/client"
import type { ColorReference } from "@/features/admin/productVariants/api/types";
import type { SupportedLocale } from "@core/i18n/locales"

type CreateColorResponse = {
    statusCode: number
    payload: {
        color: ColorReference
    }
}

type Params = {
    name: string
    system?: "RAL" | "PANTONE" | "NCS" | "CUSTOM"
    code: string
    hex: string
    translations?: Array<{
        locale: SupportedLocale
        name: string
    }>
}

export async function createColorReference({
    name,
    system = "CUSTOM",
    code,
    hex,
    translations,
}: Params): Promise<ColorReference> {
    const res = await adminApiClient.post<CreateColorResponse>("/colors", {
        name,
        system,
        code,
        hex,
        translations,
    })

    return res.data.payload.color
}
