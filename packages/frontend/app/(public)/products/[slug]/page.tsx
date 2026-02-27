import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug";

export const revalidate = 60; // ISR

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {

    const { slug } = await params;

    const product = await getProductBySlug(slug);

    if (!product) return {};

    return {
        title: `${product.name} | Ceyhunlar Plastik`,
        description: `${product.name} teknik özellikleri ve detayları.`,
        openGraph: {
            title: product.name,
            description: `${product.name} teknik detay sayfası.`,
            type: "website",
            url: `https://ceyhunlarplastik.com.tr/products/${product.slug}`,
        },
    };
}

export default async function ProductPage(
    { params }: PageProps
) {
    const { slug } = await params; // ✅ await ettik

    const product = await getProductBySlug(slug);

    if (!product) notFound();

    return (
        <main className="max-w-6xl mx-auto p-6">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="mt-4 text-gray-600">
                Ürün kodu: {product.code}
            </p>
        </main>
    );
}