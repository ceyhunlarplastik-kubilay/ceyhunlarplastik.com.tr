import { notFound } from "next/navigation";
import { adminServerClient } from "@/lib/http/serverClient";
import { getVariantReferences } from "@/features/admin/productVariants/server/getVariantReferences";
import { getProductVariants } from "@/features/admin/productVariants/server/getProductVariants";
import { ProductVariantsManager } from "@/features/admin/productVariants/components/ProductVariantsManager";
import type { Product } from "@/features/public/products/types";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ProductVariantsPage({ params }: Props) {
    const { id } = await params;

    const client = await adminServerClient();

    let product: Product | null = null;
    try {
        const res = await client.get<any>(`/products/${id}`);
        product = res.data?.payload?.product ?? null;
    } catch (error) {
        console.error("Failed to fetch product:", error);
        notFound();
    }

    if (!product) notFound();

    const [variants, references] = await Promise.all([
        getProductVariants(id),
        getVariantReferences(),
    ]);

    return (
        <ProductVariantsManager
            product={product}
            initialVariants={variants}
            references={references}
        />
    );
}
