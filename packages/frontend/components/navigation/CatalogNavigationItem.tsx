"use client";

import Link from "next/link";
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function CatalogNavigationItem({
    title,
    items,
}: {
    title: string;
    items: { title: string; href: string; description: string }[];
}) {
    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-pilltext-base font-medium bg-transparent">
                {title}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid w-[600px] gap-2 p-4 grid-cols-2">
                    {items.map((item, index) => (
                        <li key={index}>
                            <Link
                                href={item.href}
                                className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-sm font-medium"
                            >
                                <div className="text-sm font-semibold leading-none mb-1">
                                    {item.title}
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {item.description}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
}
