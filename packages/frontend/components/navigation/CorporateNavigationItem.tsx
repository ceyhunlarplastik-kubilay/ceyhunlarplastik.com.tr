"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ListItem } from "@/components/navigation/ListItem"
import { corporateItems } from "@/constants/corporates";

export const CorporateNavigationItem = () => {
    const t = useTranslations("chrome.nav");

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-pill text-base font-medium bg-transparent">
                {t("corporate")}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid gap-2 p-4 w-[600px] grid-cols-[.75fr_1fr]">
                    <li className="row-span-4">
                        <NavigationMenuLink asChild>
                            <Link
                                href="/"
                                className="flex h-full w-full flex-col justify-center items-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-4 md:p-6 no-underline outline-none select-none transition-all duration-200 focus:shadow-md"
                            >
                                <div className="relative w-full h-20 mb-2 flex items-center justify-center">
                                    <Image
                                        src="/logos/ceyhunlar.png"
                                        alt={t("logoAlt")}
                                        width={200}
                                        height={80}
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </Link>
                        </NavigationMenuLink>
                    </li>
                    {corporateItems.map((item) => {
                        return (
                            <ListItem
                                key={item.key}
                                href={item.href}
                                title={t(`corporateItems.${item.key}.title`)}
                            >
                                {t(`corporateItems.${item.key}.description`)}
                            </ListItem>
                        );
                    })}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
};
