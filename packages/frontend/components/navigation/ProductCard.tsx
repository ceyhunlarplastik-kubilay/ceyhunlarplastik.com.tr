"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface ProductCardProps {
    title: string;
    code: string;
    href: string;
    imageStatic: string;
    imageAnimated?: string;
    attributeValues?: Array<{
        id: string;
        name: string;
        attribute?: {
            code?: string;
            name?: string;
        };
    }>;
    children?: ReactNode;

    /** 👇 SADECE NAVIGATION'DA true */
    asNavigationItem?: boolean;
}

export function ProductCard({
    title,
    code,
    href,
    imageStatic,
    imageAnimated,
    attributeValues = [],
    children,
    asNavigationItem = false,
}: ProductCardProps) {
    const [hovered, setHovered] = useState(false);
    const hiddenCodes = new Set(["sector", "production_group", "usage_area"]);

    const compactAttributes = attributeValues
        .filter((value) => !hiddenCodes.has(value.attribute?.code ?? ""))
        .slice(0, 4);
    const remainingCount = Math.max(attributeValues.filter((value) => !hiddenCodes.has(value.attribute?.code ?? "")).length - compactAttributes.length, 0);

    const CardContent = (
        <Link
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="block select-none space-y-2 rounded-lg p-2 leading-none no-underline outline-none transition hover:bg-transparent"
        >
            {/* IMAGE */}
            <div className="relative w-full aspect-square rounded-md overflow-hidden bg-white mb-2 flex items-center justify-center p-2 border border-neutral-100">
                <Badge
                    className="
                        absolute left-2 top-2 z-10
                        inline-flex items-center gap-1
                        rounded-full border border-white/30
                        bg-black/70 px-2 py-0.5
                        text-[10px] font-semibold text-white
                        backdrop-blur-sm
                        transition-transform duration-300 group-hover:scale-[1.04]
                    "
                >
                    <Hash className="h-3 w-3" />
                    {code}
                </Badge>

                <Image
                    src={imageStatic}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className={`object-contain transition-opacity duration-300 ${hovered && imageAnimated ? "opacity-0" : "opacity-100"
                        }`}
                />

                {imageAnimated && hovered && (
                    <Image
                        src={imageAnimated}
                        alt={`${title} animation`}
                        fill
                        unoptimized
                        className="object-contain"
                    />
                )}
            </div>

            {/* CONTENT */}
            <div className="text-center px-1">
                <div className="text-sm font-medium leading-tight text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                    {children || title}
                </div>
                {compactAttributes.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                        {compactAttributes.map((value) => (
                            <span
                                key={value.id}
                                title={value.attribute?.name}
                                className="
                                    inline-flex max-w-full items-center rounded-full
                                    border border-neutral-200 bg-neutral-50
                                    px-2 py-0.5 text-[10px] font-medium text-neutral-700
                                "
                            >
                                <span className="truncate">{value.name}</span>
                            </span>
                        ))}
                        {remainingCount > 0 && (
                            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-500">
                                +{remainingCount}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );

    return asNavigationItem ? (
        <NavigationMenuLink asChild>{CardContent}</NavigationMenuLink>
    ) : (
        <div className="group block rounded-xl border border-transparent bg-white hover:border-neutral-200/60 hover:shadow-lg transition-all duration-300 overflow-hidden">
            {CardContent}
        </div>
    );
}
