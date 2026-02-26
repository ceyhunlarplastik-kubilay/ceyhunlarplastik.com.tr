"use client";

export const MobileHamburgerButton = ({
    setMobileOpen,
}: {
    setMobileOpen: (open: boolean) => void;
}) => {
    return (
        <button
            className="lg:hidden p-2 rounded-xl border bg-white/90 shadow-sm backdrop-blur-md z-20"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Menu"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>
        </button>
    );
};
