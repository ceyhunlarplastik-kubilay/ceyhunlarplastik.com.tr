"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { ReactNode } from "react";

interface ProductCardProps {
    title: string;
    code: string;
    href: string;
    imageStatic: string;
    imageAnimated?: string;
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
    children,
    asNavigationItem = false,
}: ProductCardProps) {
    const [hovered, setHovered] = useState(false);

    const CardContent = (
        <Link
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="block select-none space-y-2 rounded-lg p-2 leading-none no-underline outline-none transition hover:bg-transparent"
        >
            {/* IMAGE */}
            <div className="relative w-full aspect-square rounded-md overflow-hidden bg-white mb-2 flex items-center justify-center p-2 border border-neutral-100">
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
                <div className="text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                    KOD: {code}
                </div>
                <div className="text-sm font-medium leading-tight text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                    {children || title}
                </div>
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
