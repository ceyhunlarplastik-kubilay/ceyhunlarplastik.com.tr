import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"
import type { VariantDictionaryTranslationInput } from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"
import type { TargetLocale } from "@/core/i18n/locales"

export type IGetColorEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export enum ColorSystem {
    RAL = "RAL",
    PANTONE = "PANTONE",
    NCS = "NCS",
    CUSTOM = "CUSTOM",
}

export interface ICreateColorBody {
    system?: ColorSystem
    code: string
    name: string
    hex: string
    isActive?: boolean
    translations?: VariantDictionaryTranslationInput[]
}

export type ICreateColorEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateColorBody>

export type IListColorsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            system?: ColorSystem
        }
    >

export type IDeleteColorEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export interface IUpdateColorBody extends Partial<ICreateColorBody> {
    /** Silinecek çeviri satırları — varsayılan dil kaydın kendi kolonunda, silinemez. */
    removeTranslationLocales?: TargetLocale[]
}

export type IUpdateColorEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IUpdateColorBody,
        { id: string }
    >

export interface IColorDependencies {
    colorRepository: IPrismaColorRepository
}
