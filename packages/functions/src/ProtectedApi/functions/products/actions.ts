import { lambdaHandler } from "@/core/middy"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { getCustomerProductVariantTableHandler } from "@/functions/ProtectedApi/functions/products/handlers"
// Request/response validator ve tipler public tarafla aynı (yapı özdeş; yalnız
// DTO içeriği farklı, response validator data:z.any() olduğu için ikisini de kapsar).
import { idValidator, productVariantTableResponseValidator } from "@/functions/PublicApi/validators/products"
import type { IGetProductVariantTableEvent } from "@/functions/PublicApi/types/products"

export const getCustomerProductVariantTable = lambdaHandler(
    async (event) =>
        getCustomerProductVariantTableHandler({
            productVariantRepository: productVariantRepository(),
        })(event as IGetProductVariantTableEvent),
    {
        // Fiyat public'e sızmamalı; giriş yapmış müşteri + iç roller görebilir.
        auth: { requiredPermissionGroups: ["customer", "sales", "sales_director", "admin", "owner"] },
        requestValidator: idValidator,
        responseValidator: productVariantTableResponseValidator,
    }
)
