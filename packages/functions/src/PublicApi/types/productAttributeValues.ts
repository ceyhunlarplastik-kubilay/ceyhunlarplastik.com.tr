import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export interface IProductAttributeValueDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

// attributeId iki yoldan gelebilir: /{id} path parametresi veya ?attributeId= query string.
export type IListProductAttributeValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        { attributeId?: string; id?: string } | undefined,
        { attributeId?: string; locale?: string } | undefined
    >
