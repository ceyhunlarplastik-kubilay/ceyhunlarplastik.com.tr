"use client";

import {
    NavigationMenu,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { catalogItems } from "@/constants/catalogs";
import { CorporateNavigationItem } from "@/components/navigation/CorporateNavigationItem";
import { CatalogNavigationItem } from "@/components/navigation/CatalogNavigationItem";
import { CategoryNavigationItem } from "@/components/navigation/CategoryNavigationItem";
import { ServicesNavigationItem } from "@/components/navigation/ServicesNavigationItem";
/* import { SupportNavigationItem } from "@/components/navigation/SupportNavigationItem"; */
import { ContactNavigationItem } from "@/components/navigation/Contact";
import type { Category } from "@/features/public/categories/types";

export const NavigationGroup = ({ categories }: { categories: Category[] }) => {
    return (
        // CENTER NAVIGATION - Transform-free centering to support fixed dropdowns
        <div className="absolute inset-0 hidden lg:flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
                <NavigationMenu viewport={false}>
                    <NavigationMenuList className="flex space-x-1">
                        {/* KURUMSAL */}
                        <CorporateNavigationItem />

                        {/* KATEGORİLER - Full width mega menu */}
                        <CategoryNavigationItem categories={categories} />

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
        </div>
    );
};
