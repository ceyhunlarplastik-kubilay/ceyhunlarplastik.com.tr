import { protectedApiClient } from "@/lib/http/client"
import type {
    PortalCartLogisticsProfile,
    PortalCartLogisticsResponse,
} from "@/features/customerPortal/logistics/types"

export async function getPortalCartLogistics(
    variantIds: readonly string[],
): Promise<PortalCartLogisticsProfile[]> {
    const response = await protectedApiClient.post<PortalCartLogisticsResponse>(
        "/portal/customer/cart/logistics",
        { variantIds },
    )

    return response.data.payload.profiles
}
