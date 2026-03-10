import { adminServerClient } from "@/lib/http/serverClient";

export type Color = {
    id: string;
    name: string;
    hexCode: string;
};

export type Material = {
    id: string;
    name: string;
    description?: string;
};

export type Supplier = {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
};

export type MeasurementType = {
    id: string;
    name: string;
    code: string;
    baseUnit: string;
    displayOrder: number;
};

export type VariantReferences = {
    colors: Color[];
    materials: Material[];
    suppliers: Supplier[];
    measurementTypes: MeasurementType[];
};

export async function getVariantReferences(): Promise<VariantReferences> {
    try {
        const client = await adminServerClient();
        const res = await client.get<any>("/product-variants/references");
        const payload = res.data?.payload;

        return {
            colors: payload?.colors || [],
            materials: payload?.materials || [],
            suppliers: payload?.suppliers || [],
            measurementTypes: payload?.measurementTypes || [],
        };
    } catch (error) {
        console.error("Failed to fetch variant references:", error);
        return {
            colors: [],
            materials: [],
            suppliers: [],
            measurementTypes: [],
        };
    }
}
