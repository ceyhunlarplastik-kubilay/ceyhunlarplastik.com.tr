"use client";

import {
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { NavLink } from "@/components/navigation/NavLink";
import { serviceItems } from "@/constants/services";

export function ServicesNavigationItem() {
    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-pill text-base font-medium bg-transparent">
                Hizmetler
            </NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid w-[600px] gap-2 p-4 grid-cols-2">
                    {serviceItems.map((item, index) => (
                        <NavLink
                            key={index}
                            title={item.title}
                            desc={item.description}
                            href={item.href}
                        />
                    ))}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
}
