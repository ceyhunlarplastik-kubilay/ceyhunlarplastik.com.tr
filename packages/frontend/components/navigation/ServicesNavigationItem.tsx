"use client";

import { useTranslations } from "next-intl";
import {
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { NavLink } from "@/components/navigation/NavLink";
import { serviceItems } from "@/constants/services";

export function ServicesNavigationItem() {
    const t = useTranslations("chrome.nav");

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-pill text-base font-medium bg-transparent">
                {t("services")}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid w-[600px] gap-2 p-4 grid-cols-2">
                    {serviceItems.map((item) => (
                        <NavLink
                            key={item.key}
                            title={t(`serviceItems.${item.key}.title`)}
                            desc={t(`serviceItems.${item.key}.description`)}
                            href={item.href}
                        />
                    ))}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
}
