"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";

interface IconLinkProps {
    icon: ReactNode;
    text: string;
}

export function IconLink({ icon, text }: IconLinkProps) {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href="#"
                    className="flex items-center gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-sm font-medium"
                >
                    {icon}
                    <span>{text}</span>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}
