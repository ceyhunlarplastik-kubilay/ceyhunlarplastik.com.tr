"use client";

import Link from "next/link";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";

export const ContactNavigationItem = () => {
    return (
        <NavigationMenuItem>
            <Link
                href="/iletisim"
                className="nav-pill text-base font-medium"
            >
                İletişim
            </Link>
        </NavigationMenuItem>
    );
};
