"use client";

import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { IconLink } from "@/components/navigation/IconLink";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";
import { iconItems } from "@/constants/icons";

export const SupportNavigationItem = () => {
    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-pill text-base font-medium bg-transparent">
                Destek
            </NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid w-[600px] gap-2 p-4 grid-cols-2">
                    {iconItems.map((item) => (
                        <IconLink
                            key={item.text}
                            icon={<item.icon className="h-4 w-4" />}
                            text={item.text}
                        />
                    ))}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
};
