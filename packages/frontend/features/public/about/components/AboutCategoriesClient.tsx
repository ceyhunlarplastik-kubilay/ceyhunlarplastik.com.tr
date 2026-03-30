"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/features/public/categories/types";

export default function AboutCategoriesClient({
    categories,
}: {
    categories: Category[];
}) {
    const [query, setQuery] = useState("");

    const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
    );

    const getImages = (category: Category) => {
        const primary = category.assets?.find((a: any) => a.role === "PRIMARY")?.url;
        const animation = category.assets?.find((a: any) => a.role === "ANIMATION")?.url;

        return {
            primary: primary ?? "/placeholder.webp",
            animation,
        };
    };

    return (
        <section className="py-20 bg-neutral-50">
            <div className="mx-auto max-w-7xl px-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-3xl font-bold text-neutral-900">
                        Ürün Gruplarımız
                    </h2>

                    <input
                        placeholder="Kategori ara..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full md:w-80 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* GRID */}
                <div className="mt-12 grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filtered.map((category) => {
                        const images = getImages(category);

                        return (
                            <Link
                                key={category.id}
                                href={`/urun-kategori/${category.slug}`}
                                className="group block rounded-xl border bg-white overflow-hidden transition hover:shadow-md"
                            >
                                {/* IMAGE */}
                                <div className="relative h-32 overflow-hidden">
                                    {/* PRIMARY */}
                                    <Image
                                        src={images.primary}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition duration-300"
                                    />

                                    {/* GIF (soft hover) */}
                                    {images.animation && (
                                        <Image
                                            src={images.animation}
                                            alt={category.name}
                                            fill
                                            className="object-cover opacity-0 group-hover:opacity-100 transition duration-300"
                                            unoptimized
                                        />
                                    )}

                                    {/* OVERLAY */}
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />
                                </div>

                                {/* TITLE */}
                                <div className="p-3 text-center">
                                    <p className="text-sm font-medium text-neutral-800 line-clamp-2">
                                        {category.name}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* EMPTY */}
                {filtered.length === 0 && (
                    <div className="mt-16 text-center text-neutral-500">
                        Sonuç bulunamadı
                    </div>
                )}
            </div>
        </section>
    );
}