"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { ReactNode } from "react";

interface CategoryCardProps {
    title: string;
    code: number;
    children: ReactNode;
    href: string;
    imageStatic: string;
    imageAnimated?: string;

    /** 👇 SADECE NAVIGATION'DA true */
    asNavigationItem?: boolean;
}

export function CategoryCard({
    title,
    code,
    children,
    href,
    imageStatic,
    imageAnimated,
    asNavigationItem = false,
}: CategoryCardProps) {
    const [hovered, setHovered] = useState(false);

    const CardContent = (
        <Link
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="block select-none space-y-2 rounded-lg p-2 leading-none no-underline outline-none transition hover:bg-transparent"
        >
            {/* IMAGE */}
            <div className="relative w-full aspect-square rounded-md overflow-hidden bg-white mb-2 flex items-center justify-center p-2">
                <Image
                    src={imageStatic}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className={`object-contain transition-opacity duration-200 ${hovered && imageAnimated ? "opacity-0" : "opacity-100"
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

            {/* TITLE */}
            <div className="text-sm font-medium text-center">
                <span className="text-muted-foreground mr-1">{code}.</span>
                {title}
            </div>
        </Link>
    );

    return asNavigationItem ? (
        <NavigationMenuLink asChild>{CardContent}</NavigationMenuLink>
    ) : (
        <div className="group">{CardContent}</div>
    );
}
