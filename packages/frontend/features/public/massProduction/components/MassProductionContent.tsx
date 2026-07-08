"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { ChevronUp } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { MassProductionMetal } from "@/features/public/massProduction/components/MassProductionMetal";
import { MassProductionPlastic } from "@/features/public/massProduction/components/MassProductionPlastic";
import { MassProductionRubber } from "@/features/public/massProduction/components/MassProductionRubber";
import { MassProductionBakalite } from "@/features/public/massProduction/components/MassProductionBakalite";
import { cn } from "@/lib/utils";

export function MassProductionContent() {
    const t = useTranslations("public.massProduction");
    const tb = useTranslations("shared.breadcrumbs");
    const [activeTab, setActiveTab] = useState("metal");

    const tabs = [
        { id: "metal", label: t("tabs.metal") },
        { id: "plastic", label: t("tabs.plastic") },
        { id: "rubber", label: t("tabs.rubber") },
        { id: "bakelite", label: t("tabs.bakelite") },
    ];

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const sectionIds = ["metal", "plastic", "rubber", "bakelite"];
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;

            for (const id of sectionIds) {
                const element = document.getElementById(id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveTab(id);
                        break;
                    }
                }
            }
            setShowScrollTop(window.scrollY > 300);
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 120; // sticky header + tabs height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveTab(id);
        }
    };

    return (
        <main className="bg-white scroll-smooth pb-20">
            <PageHero
                title={t("heroTitle")}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: tb("services") },
                ]}
            />

            {/* STICKY SUB-NAV (TABS) */}
            <nav className="sticky top-[var(--header-height)] z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200 overflow-x-auto no-scrollbar py-2">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-2 items-center justify-center min-w-max mx-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <a
                                    key={tab.id}
                                    href={`#${tab.id}`}
                                    onClick={(e) => scrollToSection(e, tab.id)}
                                    className={cn(
                                        "relative px-5 py-2 text-sm font-medium transition-colors duration-300 rounded-full",
                                        isActive ? "text-white" : "text-neutral-500 hover:text-neutral-900"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-[var(--color-brand)] rounded-full -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {tab.label}
                                </a>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* SECTIONS WITH ALTERNATING BACKGROUNDS */}
            <div id="metal" className="bg-white">
                <MassProductionMetal />
            </div>

            <div id="plastic" className="bg-[var(--color-section-bg)]">
                <MassProductionPlastic />
            </div>

            <div id="rubber" className="bg-white border-t border-neutral-100">
                <MassProductionRubber />
            </div>

            <div id="bakelite" className="bg-[var(--color-section-bg)]">
                <MassProductionBakalite />
            </div>
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        key="scroll-to-top"
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        onClick={() =>
                            window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                        className="
                            fixed bottom-8 right-8 z-[100]
                            w-12 h-12
                            rounded-full
                            bg-[var(--color-brand)] text-white
                            shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                            flex items-center justify-center
                            hover:scale-110 active:scale-95
                            transition-all duration-300
                        "
                    >
                        <ChevronUp className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>
        </main>
    );
}
