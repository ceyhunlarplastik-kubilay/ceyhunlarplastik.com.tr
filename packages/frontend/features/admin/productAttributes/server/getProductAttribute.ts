import axios from "axios";
import { auth } from "@/lib/auth/auth";
import { ProductAttribute } from "@/features/admin/productAttributes/types";

type GetProductAttributeApiResponse = {
    statusCode: number;
    payload: {
        productAttribute: ProductAttribute;
    }
};

export async function getProductAttribute(id: string): Promise<ProductAttribute> {
    const session = await auth();

    if (!session?.idToken) throw new Error("Unauthorized");

    const res = await axios.get<GetProductAttributeApiResponse>(
        `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/product-attributes/${id}`,
        {
            headers: { Authorization: `Bearer ${session.idToken}` },
        }
    );

    return res.data.payload.productAttribute;
}
