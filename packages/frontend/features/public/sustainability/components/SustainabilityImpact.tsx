import Image from "next/image";
import { FaRecycle, FaLeaf, FaBolt, FaGlobeEurope } from "react-icons/fa";

export function SustainabilityImpact() {
    const items = [
        { icon: FaRecycle, label: "Geri Dönüşüm" },
        { icon: FaLeaf, label: "Sıfır Atık" },
        { icon: FaBolt, label: "Sürdürülebilir Üretim" },
        { icon: FaGlobeEurope, label: "Doğaya Saygı" },
    ];

    return (
        <section className="bg-white py-20">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                {/* LEFT BOX */}
                <div className="space-y-8">

                    {/* TEXT */}
                    <div className="space-y-4">
                        <h3 className="text-3xl font-semibold text-neutral-900">
                            Geri Dönüştürülebilir Plastik
                        </h3>

                        <p className="text-muted-foreground leading-relaxed">
                            Plastik, pek çok tüketici ürününün bir bileşeni olup, imalat sanayinin çıktı ve nihai ürünlerinin çoğunu oluşturur. Bununla birlikte, bütün plastikler aynı değildir ve bu, hepsinin aynı şekilde bertaraf edilip geri dönüştürülemeyeceği anlamına gelir.
                        </p>

                        <p className="text-muted-foreground leading-relaxed">
                            Ceyhunlar Plastik olarak, geri dönüşüme uygun ürünler üretiyoruz. Doğaya saygı çerçevesinde üretim alanımızda yenilenebilir enerji kaynaklarını kullanmaya özen gösteriyoruz.
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
                        alt="Sürdürülebilirlik"
                        fill
                        className="object-cover"
                    />
                </div>

            </div>
        </section>
    );
}
