"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Plane, Bus, Train, Navigation } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";

export function ContactContent() {
    const t = useTranslations("public.contact");
    const tf = useTranslations("public.contact.form");
    const tr = useTranslations("public.contact.routes");

    return (
        <main className="bg-white">

            {/* ================= MAP ================= */}
            <section className="w-full h-[520px] md:h-[600px]">
                <iframe
                    src="https://www.google.com/maps?q=Ceyhunlar+Plastik&output=embed"
                    className="w-full h-full border-0"
                    loading="lazy"
                />
            </section>

            {/* ================= CONTACT ================= */}
            <section className="max-w-7xl mx-auto px-6 py-20">

                <div className="grid lg:grid-cols-2 gap-12 items-stretch">

                    {/* ================= LEFT: Contact Info ================= */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="rounded-3xl border border-neutral-200 p-8 md:p-10 shadow-sm bg-white h-full flex flex-col">
                            <h2 className="text-3xl font-semibold mb-6">
                                {t("infoTitle")}
                            </h2>

                            <p className="text-muted-foreground leading-relaxed mb-10">
                                {t("infoBody")}
                            </p>

                            {/* CONTACT ITEMS */}
                            <div className="space-y-8 text-neutral-700 mb-10">
                                {/* PHONE */}
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[var(--color-brand)]/10 p-3 rounded-xl">
                                        <Phone className="text-[var(--color-brand)] w-6 h-6" />
                                    </div>

                                    <div className="flex flex-col gap-2">

                                        {/* SABİT TELEFON */}
                                        <a
                                            href="tel:+902327002946"
                                            className="font-medium text-neutral-900 hover:text-[var(--color-brand)] transition"
                                        >
                                            +90 232 700 29 46
                                        </a>

                                        {/* WHATSAPP */}
                                        <a
                                            href="https://wa.me/905530602946"
                                            target="_blank"
                                            className="flex items-center gap-2 font-medium text-neutral-900 hover:text-green-600 transition"
                                        >
                                            <SiWhatsapp className="w-4 h-4 text-green-500" />
                                            +90 553 060 29 46
                                        </a>

                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[var(--color-brand)]/10 p-3 rounded-xl">
                                        <Mail className="text-[var(--color-brand)] w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm md:text-base">
                                        <span className="font-medium text-neutral-900">siparis@ceyhunlarplastik.com.tr</span>
                                        <span className="font-medium text-neutral-900">info@ceyhunlarplastik.com.tr</span>
                                    </div>
                                </div>

                                {/* ADDRESS */}
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[var(--color-brand)]/10 p-3 rounded-xl">
                                        <MapPin className="text-[var(--color-brand)] w-6 h-6" />
                                    </div>
                                    <span className="leading-relaxed font-medium text-neutral-900">
                                        {t("addressLine1")}<br />
                                        {t("addressLine2")}
                                    </span>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="mt-auto">
                                <Button
                                    className="
                                        w-full
                                        bg-[var(--color-brand)] text-white
                                        hover:bg-black hover:text-white
                                        flex items-center justify-center gap-2
                                        py-6 rounded-xl text-base font-semibold
                                    "
                                    onClick={() =>
                                        window.open(
                                            "https://www.google.com/maps?q=Ceyhunlar+Plastik",
                                            "_blank"
                                        )
                                    }
                                >
                                    <Navigation className="w-5 h-5" />
                                    {t("directionsCta")}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ================= RIGHT: Contact Form ================= */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="rounded-3xl border border-neutral-200 p-8 md:p-10 shadow-sm bg-white h-full flex flex-col">
                            <h3 className="text-3xl font-semibold mb-2">
                                {t("formTitle")}
                            </h3>

                            <p className="text-muted-foreground mb-10">
                                {t("formSubtitle1")}
                                <br />
                                {t("formSubtitle2")}
                            </p>

                            <form className="space-y-5 flex-1 flex flex-col">
                                <input
                                    placeholder={tf("fullName")}
                                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50/50 focus:bg-white focus:outline-[var(--color-brand)] transition"
                                />

                                <input
                                    placeholder={tf("email")}
                                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50/50 focus:bg-white focus:outline-[var(--color-brand)] transition"
                                />

                                <input
                                    placeholder={tf("phone")}
                                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50/50 focus:bg-white focus:outline-[var(--color-brand)] transition"
                                />

                                <textarea
                                    placeholder={tf("message")}
                                    rows={4}
                                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50/50 focus:bg-white focus:outline-[var(--color-brand)] transition"
                                />

                                {/* CONSENT */}
                                <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                                    <input type="checkbox" className="mt-1" />
                                    {tf("consent")}
                                </label>

                                <div className="mt-auto pt-4">
                                    <Button
                                        className="
                                            w-full
                                            bg-[var(--color-brand)] text-white
                                            hover:bg-black
                                            py-6 rounded-xl text-base font-semibold
                                        "
                                    >
                                        {tf("submit")}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>

                </div>

                {/* ================= ROUTES (Ulaşım Bilgileri) ================= */}
                <div className="mt-24 space-y-12">
                    <div className="text-center space-y-3">
                        <h3 className="text-3xl font-bold text-neutral-900">
                            {tr("sectionTitle")}
                        </h3>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {tr("sectionSubtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* AIRPLANE */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 flex flex-col items-center text-center space-y-4"
                        >
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Plane className="w-8 h-8 text-[var(--color-brand)]" />
                            </div>
                            <h4 className="text-lg font-semibold">{tr("air.title")}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {tr("air.text")}
                            </p>
                        </motion.div>

                        {/* BUS */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 flex flex-col items-center text-center space-y-4"
                        >
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Bus className="w-8 h-8 text-[var(--color-brand)]" />
                            </div>
                            <h4 className="text-lg font-semibold">{tr("road.title")}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {tr("road.text")}
                            </p>
                        </motion.div>

                        {/* TRAIN */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 flex flex-col items-center text-center space-y-4"
                        >
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Train className="w-8 h-8 text-[var(--color-brand)]" />
                            </div>
                            <h4 className="text-lg font-semibold">{tr("rail.title")}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {tr("rail.text")}
                            </p>
                        </motion.div>
                    </div>
                </div>

            </section>

        </main>
    );
}
