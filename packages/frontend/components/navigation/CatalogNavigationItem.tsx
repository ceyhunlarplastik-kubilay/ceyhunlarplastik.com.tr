"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";

export const CatalogNavigationItem = () => {
    const t = useTranslations("chrome.nav");

    return (
        <NavigationMenuItem>
            <Link
                href="/kataloglar"
                className="nav-pill text-base font-medium"
            >
                {t("catalogs")}
            </Link>
        </NavigationMenuItem>
    );
};
