import { adminServerClient } from "@/lib/http/serverClient";

export type VariantMeasurement = {
    id: string;
    value: number;
    label: string;
    measurementType: {
        id: string;
        code: string;
        name: string;
        baseUnit: string;
    };
};

export type VariantSupplier = {
    id: string;
    isActive: boolean;
    supplier: {
        id: string;
        name: string;
    };
};

export type ProductVariant = {
    id: string;
    productId: string;
    name: string;
    fullCode: string;
    versionCode: string;
    supplierCode: string;
    variantIndex: number;
    createdAt: string;
    color?: {
        id: string;
        name: string;
        hex: string;
        code: string;
        system: string;
    } | null;
    materials: { id: string; name: string }[];
    measurements: VariantMeasurement[];
    variantSuppliers: VariantSupplier[];
};

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
        const client = await adminServerClient();

        const res = await client.get("/product-variants/table", {
            params: { productId, limit: 500 },
        });

        return res.data?.payload?.data ?? [];
    } catch (error) {
        console.error("Failed to fetch product variants", error);
        return [];
    }
}