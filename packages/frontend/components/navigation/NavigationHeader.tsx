"use client";

import { CeyhunlarLogo } from "@/components/navigation/CeyhunlarLogo";
// import { NavigationGroup } from "@/components/navigation/NavigationGroup";

export const NavigationHeader = ({
    isVisible: _isVisible,
    rightActions,
    children,
}: {
    isVisible: boolean;
    rightActions?: React.ReactNode;
    children?: React.ReactNode;
}) => {
    return (
        <header
            className="w-full border-b bg-white/95 backdrop-blur-lg shadow-sm"
        >
            <div className="mx-auto grid w-[min(98vw,1720px)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:px-4 md:px-5">
                {/* LOGO - Left aligned */}
                <CeyhunlarLogo />

                {/* CENTER NAVIGATION (client-only geliyor artık) */}
                <div className="min-w-0 flex justify-center">
                    {children}
                </div>

                <div className="flex items-center justify-end">
                    {rightActions}
                </div>
            </div>
        </header>
    );
};
