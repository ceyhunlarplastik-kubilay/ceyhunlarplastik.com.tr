"use client";

import Link from "next/link";
import { MobileHamburgerButton } from "@/components/navigation/MobileHamburgerButton";

export const NavigationContactButton = ({
    setMobileOpen,
}: {
    setMobileOpen: (open: boolean) => void;
}) => {
    return (
        <div className="flex items-center gap-4 z-20">
            <Link
                href="/iletisim"
                className="hidden md:inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
                İletişim
            </Link>

            {/* MOBILE HAMBURGER BUTTON */}
            <MobileHamburgerButton setMobileOpen={setMobileOpen} />
        </div>
    );
};
