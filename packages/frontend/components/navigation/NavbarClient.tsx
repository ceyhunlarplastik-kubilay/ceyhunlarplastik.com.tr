"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { NavigationHeader } from "@/components/navigation/NavigationHeader";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { TopBar } from "@/components/navigation/TopBar";
import CustomerLeadDialog from "@/components/home/CustomerLeadDialog";
import { MobileHamburgerButton } from "@/components/navigation/MobileHamburgerButton";
import { InquiryCartNavItem } from "@/components/navigation/InquiryCartNavItem";
import type { Category } from "@/features/public/categories/types";
import type { ProductAttribute } from "@/features/public/productAttributes/types";

const NavigationGroup = dynamic(
    () =>
        import("@/components/navigation/NavigationGroup").then(
            (m) => m.NavigationGroup
        ),
    { ssr: false }
);

export function NavbarClient({
    categories,
    attributes,
}: {
    categories: Category[];
    attributes: ProductAttribute[];
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCustomerLeadOpen, setIsCustomerLeadOpen] = useState(false);
    const lastScrollY = useRef(0);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (isCustomerLeadOpen) return;

        const previous = lastScrollY.current;
        const diff = latest - previous;

        // Scroll threshold: aşağı kaydırınca gizle, yukarı kaydırınca göster
        if (diff > 10 && latest > 100) {
            setIsVisible(false);
        } else if (diff < -10) {
            setIsVisible(true);
        }

        lastScrollY.current = latest;
    });

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;

        const updateHeight = () => {
            const h = ref.current!.offsetHeight;
            document.documentElement.style.setProperty("--navbar-height", `${h}px`);
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    return (
        <>
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: isVisible ? 0 : "-100%" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed top-0 left-0 right-0 z-50"
                ref={ref}
            >

                {/* TOP BAR */}
                <TopBar />

                {/* MAIN NAVBAR */}
                {/* <div className="bg-background/70 backdrop-blur-sm shadow-sm"> */}
                <div className="bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 border-b border-neutral-200/60 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                    <NavigationHeader
                        isVisible={isVisible}
                        rightActions={
                            <>
                                <div className="hidden lg:flex items-center gap-3 z-20">
                                    <InquiryCartNavItem />
                                    <CustomerLeadDialog
                                        attributes={attributes}
                                        onDialogOpenChange={setIsCustomerLeadOpen}
                                    />
                                </div>
                                <div className="lg:hidden z-20">
                                    <div className="flex items-center gap-2">
                                        <InquiryCartNavItem className="h-10 px-3 text-[11px]" />
                                        <MobileHamburgerButton setMobileOpen={setMobileOpen} />
                                    </div>
                                </div>
                            </>
                        }
                    >
                        <NavigationGroup categories={categories} />
                    </NavigationHeader>
                </div>

            </motion.div>

            <MobileMenu
                setMobileOpen={setMobileOpen}
                mobileOpen={mobileOpen}
                categories={categories}
                attributes={attributes}
            />
        </>
    );
}
