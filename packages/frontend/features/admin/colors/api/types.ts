export type ColorSystem = "RAL" | "PANTONE" | "NCS" | "CUSTOM"

export type ColorTranslation = {
    id: string
    locale: string
    name: string
    createdAt: string
    updatedAt: string
}

export type Color = {
    id: string
    system: ColorSystem
    code: string
    name: string
    translations?: ColorTranslation[]
    hex: string
    rgbR?: number | null
    rgbG?: number | null
    rgbB?: number | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type ListColorsResponse = {
    statusCode: number
    payload: {
        data: Color[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type ColorResponse = {
    statusCode: number
    payload: {
        color: Color
    }
}
