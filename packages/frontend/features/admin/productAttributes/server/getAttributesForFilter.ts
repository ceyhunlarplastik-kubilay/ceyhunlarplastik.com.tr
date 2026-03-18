import axios from "axios"
import { auth } from "@/lib/auth/auth"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"

export async function getAttributesForFilter(): Promise<ProductAttribute[]> {

    const session = await auth()

    if (!session?.idToken) throw new Error("Unauthorized")

    const res = await axios.get(
        `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/product-attributes/with-values`,
        {
            headers: {
                Authorization: `Bearer ${session.idToken}`
            }
        }
    )

    return res.data.payload.data
}