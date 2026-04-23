"use client";

import Link from "next/link";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";

export const SectorelProductsNavigationItem = () => {
    return (
        <NavigationMenuItem>
            <Link
                href="/urunler/filtre"
                className="nav-pill text-base font-medium"
            >
                Sektörel Ürünler
            </Link>
        </NavigationMenuItem>
    );
};