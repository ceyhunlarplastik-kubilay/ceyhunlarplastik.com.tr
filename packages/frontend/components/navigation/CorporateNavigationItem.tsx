"use client";

import Link from "next/link";
import Image from "next/image";
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ListItem } from "@/components/navigation/ListItem"
import { corporateItems } from "@/constants/corporates";

export const CorporateNavigationItem = () => {
    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="text-base font-medium bg-transparent">
                Kurumsal
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
                                        alt="Ceyhunlar Plastik"
                                        width={200}
                                        height={80}
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </Link>
                        </NavigationMenuLink>
                    </li>
                    {corporateItems.map((item, index) => {
                        return (
                            <ListItem key={index} href={item.href} title={item.title}>
                                {item.description}
                            </ListItem>
                        );
                    })}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
};
