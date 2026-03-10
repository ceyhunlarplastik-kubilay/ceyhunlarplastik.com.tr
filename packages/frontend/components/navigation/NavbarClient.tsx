"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { NavigationHeader } from "@/components/navigation/NavigationHeader";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import type { Category } from "@/features/public/categories/types";

const NavigationGroup = dynamic(
    () =>
        import("@/components/navigation/NavigationGroup").then(
            (m) => m.NavigationGroup
        ),
    { ssr: false }
);

export function NavbarClient({ categories }: { categories: Category[] }) {
    const [isVisible, setIsVisible] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const lastScrollY = useRef(0);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
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
                className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-sm shadow-sm"
                ref={ref}
            >
                <NavigationHeader isVisible={isVisible} setMobileOpen={setMobileOpen}>
                    <NavigationGroup categories={categories} />
                </NavigationHeader>
            </motion.div>

            {/* =============================
          iOS SAFARI STYLE MOBILE MENU
          ============================= */}
            <MobileMenu setMobileOpen={setMobileOpen} mobileOpen={mobileOpen} />
        </>
    );
}
