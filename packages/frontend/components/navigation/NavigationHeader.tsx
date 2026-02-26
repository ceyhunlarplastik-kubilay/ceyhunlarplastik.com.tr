"use client";

import { CeyhunlarLogo } from "@/components/navigation/CeyhunlarLogo";
// import { NavigationGroup } from "@/components/navigation/NavigationGroup";
import { NavigationContactButton } from "@/components/navigation/NavigationContactButton";

export const NavigationHeader = ({
    isVisible,
    setMobileOpen,
    children,
}: {
    isVisible: boolean;
    setMobileOpen: (open: boolean) => void;
    children?: React.ReactNode;
}) => {
    return (
        <header
            className={`w-full border-b bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
                }`}
        >
            <div className="max-w-7xl mx-auto relative flex items-center justify-between px-4 sm:px-6 py-4 md:py-5">
                {/* LOGO - Left aligned */}
                <CeyhunlarLogo />

                {/* CENTER NAVIGATION (client-only geliyor artık) */}
                {children}

                {/* CENTER NAVIGATION - Absolutely centered */}
                {/* <NavigationGroup /> */}

                {/* RIGHT ACTIONS - Placeholder for future use (e.g. Search, Cart, Login) */}
                <NavigationContactButton setMobileOpen={setMobileOpen} />
            </div>
        </header>
    );
};
