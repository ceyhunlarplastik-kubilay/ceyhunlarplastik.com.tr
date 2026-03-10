"use client";

import {
    FaCogs,
    FaGlobe,
    FaUsers,
    FaChartLine,
    FaShoppingCart,
    FaStore,
} from "react-icons/fa";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export function StatsBar() {
    const stats = [
        { icon: FaCogs, value: 15, label: "Ayrı Sektör" },
        { icon: FaGlobe, value: 44, label: "Ülke" },
        { icon: FaStore, value: 840, label: "Bayi" },
        { icon: FaChartLine, value: 2360, label: "Başarılı Proje" },
        { icon: FaUsers, value: 12000, label: "Müşteri" },
        { icon: FaShoppingCart, value: 35000, label: "Ürün Çeşidi" },
    ];

    return (
        <section className="bg-white py-10">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6 text-center">
                    {stats.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 relative">
                            {/* Icon */}
                            <item.icon className="text-[5rem] text-[var(--color-brand)]" />

                            {/* Number */}
                            <span className="text-3xl font-semibold text-muted-foreground">
                                <AnimatedCounter value={item.value} />
                            </span>

                            {/* Label */}
                            <span className="text-xl text-muted-foreground">
                                {item.label}
                            </span>

                            {/* Divider (except last) */}
                            {i !== stats.length - 1 && (
                                <span className="hidden lg:block absolute right-0 top-1/2 h-12 w-px -translate-y-1/2 bg-gray-200" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
