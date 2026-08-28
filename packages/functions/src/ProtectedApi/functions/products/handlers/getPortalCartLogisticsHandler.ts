import createError from "http-errors"

import {
    normalizeCartLogisticsProfiles,
    normalizeCartLogisticsVariantIds,
} from "@/core/helpers/logistics/cartLogistics"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IPortalCartLogisticsDependencies,
    IPortalCartLogisticsEvent,
} from "@/functions/ProtectedApi/types/products"

/**
 * Müşteri portalı sepetindeki varyantlar için ticari alan içermeyen koli profili.
 * Tedarikçi seçimi istemciye bırakılmaz; legacy sıfır/çoklu aktif durumları açık
 * statülerle döner ve hiçbir satıra sessizce düşülmez.
 */
export const getPortalCartLogisticsHandler =
    ({ cartLogisticsRepository }: IPortalCartLogisticsDependencies) =>
        async (event: IPortalCartLogisticsEvent) => {
            if (!event.user?.customerId) {
                throw new createError.Forbidden("Customer portal context missing")
            }

            const variantIds = normalizeCartLogisticsVariantIds(event.body?.variantIds ?? [])
            const rows = await cartLogisticsRepository.listVariantLogisticsRows(variantIds)

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    profiles: normalizeCartLogisticsProfiles(variantIds, rows),
                },
            })
        }
