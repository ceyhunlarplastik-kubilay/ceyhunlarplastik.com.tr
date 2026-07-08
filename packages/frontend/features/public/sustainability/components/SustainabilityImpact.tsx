import Image from "next/image";
import { useTranslations } from "next-intl";
import { FaRecycle, FaLeaf, FaBolt, FaGlobeEurope } from "react-icons/fa";

export function SustainabilityImpact() {
    const t = useTranslations("public.sustainability.impact");
    const items = [
        { icon: FaRecycle, label: t("items.recycling") },
        { icon: FaLeaf, label: t("items.zeroWaste") },
        { icon: FaBolt, label: t("items.sustainableProduction") },
        { icon: FaGlobeEurope, label: t("items.respectNature") },
    ];

    return (
        <section className="bg-white py-20">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                {/* LEFT BOX */}
                <div className="space-y-8">

                    {/* TEXT */}
                    <div className="space-y-4">
                        <h3 className="text-3xl font-semibold text-neutral-900">
                            {t("title")}
                        </h3>

                        <p className="text-muted-foreground leading-relaxed">
                            {t("body1")}
                        </p>

                        <p className="text-muted-foreground leading-relaxed">
                            {t("body2")}
                        </p>
                    </div>

                    {/* ICON GRID */}
                    <div className="grid grid-cols-2 gap-6 pt-2">

                        {items.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3"
                            >
                                <item.icon className="text-green-600 text-4xl" />

                                <span className="text-sm text-neutral-700">
                                    {item.label}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                {/* RIGHT IMAGE */}
                <div className="relative w-full h-[420px] rounded-2xl overflow-hidden">
                    <Image
                        src="/logos/sustainability3.webp"
                        alt={t("imageAlt")}
                        fill
                        className="object-cover"
                    />
                </div>

            </div>
        </section>
    );
}
