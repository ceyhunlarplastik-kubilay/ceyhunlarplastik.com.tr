"use client";

import {
    NavigationMenu,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { CorporateNavigationItem } from "@/components/navigation/CorporateNavigationItem";
import { CatalogNavigationItem } from "@/components/navigation/CatalogNavigationItem";
import { CategoryNavigationItem } from "@/components/navigation/CategoryNavigationItem";
import { ServicesNavigationItem } from "@/components/navigation/ServicesNavigationItem";
/* import { SupportNavigationItem } from "@/components/navigation/SupportNavigationItem"; */
import { SectorelProductsNavigationItem } from "@/components/navigation/SectorelProductsNavigationItem";
import { ContactNavigationItem } from "@/components/navigation/Contact";
import type { Category } from "@/features/public/categories/types";

export const NavigationGroup = ({ categories }: { categories: Category[] }) => {
    return (
        <div className="hidden lg:flex items-center justify-center">
            <NavigationMenu viewport={false}>
                <NavigationMenuList className="flex items-center gap-0.5 xl:gap-1">
                    {/* KURUMSAL */}
                    <CorporateNavigationItem />

                    {/* KATEGORİLER - Full width mega menu */}
                    <CategoryNavigationItem categories={categories} />

                    {/* SEKTÖREL ÜRÜNLER */}
                    <SectorelProductsNavigationItem />

                    {/* HİZMETLER */}
                    <ServicesNavigationItem />

                    {/* KATALOGLAR */}
                    <CatalogNavigationItem />
                    {/* <CatalogNavigationItem title="Kataloglar" items={catalogItems} /> */}

                    {/* DESTEK */}
                    {/* <SupportNavigationItem /> */}

                    {/* İLETİŞİM */}
                    <ContactNavigationItem />
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
};
