import { adminApiClient } from "@/lib/http/client"
import type { ColorReference } from "@/features/admin/productVariants/api/types";

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
        locale: "tr" | "en"
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
