import { lambdaHandler } from "@/core/middy"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { getCustomerProductVariantTableHandler, getCustomerProductVariantsByMeasurementHandler } from "@/functions/ProtectedApi/functions/products/handlers"
// Request validator public tarafla aynı (yapı özdeş). Response validator ise
// P2.8(a)'da ayrıldı: yanıt artık `customerDiscountPercent` de taşıyor ve public
// şemanın katı `payload` objesi bu alanı reddederdi.
import { productVariantTableRequestValidator, productVariantsByMeasurementRequestValidator } from "@/functions/PublicApi/validators/products"
import { customerProductVariantTableResponseValidator, customerProductVariantsByMeasurementResponseValidator } from "@/functions/ProtectedApi/validators/products"
import type { IGetProductVariantTableEvent, IGetProductVariantsByMeasurementEvent } from "@/functions/PublicApi/types/products"

export const getCustomerProductVariantTable = lambdaHandler(
    async (event) =>
        getCustomerProductVariantTableHandler({
            productVariantRepository: productVariantRepository(),
            customerRepository: customerRepository(),
        })(event as IGetProductVariantTableEvent),
    {
        // Fiyat public'e sızmamalı; giriş yapmış müşteri + iç roller görebilir.
        auth: { requiredPermissionGroups: ["customer", "sales", "sales_director", "admin", "owner"] },
        requestValidator: productVariantTableRequestValidator,
        responseValidator: customerProductVariantTableResponseValidator,
    }
)

export const getCustomerProductVariantsByMeasurement = lambdaHandler(
    async (event) =>
        getCustomerProductVariantsByMeasurementHandler({
            productVariantRepository: productVariantRepository(),
            customerRepository: customerRepository(),
        })(event as IGetProductVariantsByMeasurementEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "sales", "sales_director", "admin", "owner"] },
        requestValidator: productVariantsByMeasurementRequestValidator,
        responseValidator: customerProductVariantsByMeasurementResponseValidator,
    }
)
