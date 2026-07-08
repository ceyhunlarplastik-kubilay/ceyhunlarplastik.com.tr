"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";

export const ContactNavigationItem = () => {
    const t = useTranslations("chrome.nav");

    return (
        <NavigationMenuItem>
            <Link
                href="/iletisim"
                className="nav-pill text-base font-medium"
            >
                {t("contact")}
            </Link>
        </NavigationMenuItem>
    );
};
