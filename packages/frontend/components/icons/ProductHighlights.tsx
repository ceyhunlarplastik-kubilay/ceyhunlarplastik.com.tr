"use client";

import { useTranslations } from "next-intl";
import { Truck, BadgeCheck, FlaskConical, Headset } from "lucide-react";

export function ProductHighlights() {
    const t = useTranslations("home.quality");
    const data = t.raw("highlights") as { title: string; description: string }[];
    const icons = [Truck, BadgeCheck, FlaskConical, Headset];
    const items = data.map((d, i) => ({ ...d, icon: icons[i] }));

    return (
        <div className="bg-[var(--color-section-bg)] py-12">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="group flex flex-col items-center text-center gap-4"
                        >
                            {/* Icon */}
                            <item.icon className="h-12 w-12 text-brand transition-transform duration-300 group-hover:-translate-y-1" />

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-foreground">
                                {item.title}
                            </h3>

                            {/* Description */}
                            <p className="text-pretty text-sm text-muted-foreground max-w-xs">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
