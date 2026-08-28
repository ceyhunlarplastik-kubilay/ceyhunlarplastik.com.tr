import type { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaCartLogisticsRepository } from "@/core/helpers/prisma/cartLogistics/repository"
import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

/**
 * P2.8(a): Customer varyant tablosu, public muadilinden farklı olarak müşterinin
 * fiyat bağlamını da (genel indirim yüzdesi) döndürür → customerRepository ek deps.
 * Public handler'ın deps tipi (IProductVariantTableDependencies) bilinçli olarak
 * dar bırakıldı; public tarafın müşteri verisine erişimi olmamalı.
 */
export interface ICustomerProductVariantTableDependencies {
    productVariantRepository: IPrismaProductVariantRepository
    customerRepository: IPrismaCustomerRepository
}

export interface IPortalCartLogisticsDependencies {
    cartLogisticsRepository: IPrismaCartLogisticsRepository
}

export type IPortalCartLogisticsEvent = IAPIGatewayProxyEventWithUserGeneric<{
    variantIds: string[]
}>
