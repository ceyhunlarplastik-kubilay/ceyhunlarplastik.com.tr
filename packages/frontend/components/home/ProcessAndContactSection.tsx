"use client";

import * as React from "react";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { motion, type Variants } from "motion/react";
import {
    Beaker,
    BadgeCheck,
    Handshake,
    ClipboardList,
    ArrowUpRight,
    Brain,
    Phone,
    Mail,
    User,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Form Schema */
/* ------------------------------------------------------------------ */
const contactFormSchema = z.object({
    fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
    phone: z.string().min(10, "Telefon numarası geçersiz"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

/* ------------------------------------------------------------------ */
/* Motion config (motion/react v12 compatible) */
/* ------------------------------------------------------------------ */

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: EASE_OUT,
            staggerChildren: 0.08,
        },
    },
};

const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: EASE_OUT,
        },
    },
};

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type FormValues = {
    fullName: string;
    phone: string;
    email: string;
};

/* ------------------------------------------------------------------ */
/* Feature Card */
/* ------------------------------------------------------------------ */

function FeatureCard({
    title,
    description,
    Icon,
}: {
    title: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <motion.div
            variants={item}
            className="group relative rounded-2xl p-6 transition-all duration-300 hover:bg-[var(--color-brand)]/90"
        >
            {/* Accent line */}
            <span className="absolute left-0 top-6 h-10 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[var(--color-brand)]" />

            <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-white/20">
                    <Icon className="h-6 w-6 text-[var(--color-brand)] group-hover:text-white transition-colors" />
                </div>

                <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/80">
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/* Main Section */
/* ------------------------------------------------------------------ */

export function ProcessAndContactSection({
    backgroundImageUrl = "/logos/hakkimizda.jpg",
}: {
    backgroundImageUrl?: string;
}) {
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            fullName: "",
            phone: "",
            email: "",
        },
    });

    const {
        handleSubmit,
        control,
        formState: { isSubmitting },
        reset,
    } = form;

    const onSubmit = async (data: ContactFormValues) => {
        // API entegrasyonu buraya bağlanacak
        try {
            toast.loading("Gönderiliyor...");
            // Simulate API delay
            await new Promise((r) => setTimeout(r, 1200));

            toast.success("Mesajınız başarıyla iletildi!");
            reset();
        } catch (error) {
            toast.error("Gönderim sırasında bir hata oldu!");
        }
    };

    return (
        <section className="relative isolate overflow-hidden">
            {/* Fixed background */}
            <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundAttachment: "fixed",
                }}
            />
            <div className="absolute inset-0 -z-10 bg-black/70" />

            <div className="mx-auto max-w-7xl px-6 py-16">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {/* Header */}
                    <motion.div variants={item} className="max-w-3xl">
                        <p className="text-sm font-semibold tracking-wide text-[var(--color-brand)]">
                            Ceyhunlar
                        </p>
                        <h2 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight text-white">
                            Projeden Seri Üretime Nedir?
                        </h2>
                    </motion.div>

                    {/* Intro blocks */}
                    <motion.div
                        variants={item}
                        className="mt-10 grid gap-8 md:grid-cols-2"
                    >
                        {/* BLOK 1 */}
                        <div className="p-6">
                            <h4 className="mb-2 text-base font-semibold text-white">
                                Plastik, kauçuk, metal ve bakalit ürünlerinizin projeleri için;
                            </h4>

                            <p className="text-sm leading-relaxed text-white/80">
                                Taslaktan başlayarak Ar-Ge ile devam eden ve seri üretim ile
                                nihayete kavuşan fayda / maliyet temel esasına dayanan iş
                                modelimizle sizlere hizmet veriyoruz.
                            </p>
                        </div>

                        {/* BLOK 2 */}
                        <div className="p-6">
                            <h4 className="mb-2 text-base font-semibold text-white">
                                Projelerinizin nihai ürüne ulaşması için;
                            </h4>

                            <p className="text-sm leading-relaxed text-white/80">
                                3d modelleme, model analizi, numune ürün prototipleme, üretim
                                analizi, kalıplama ve seri üretim baskısı ile projelerinizi
                                nihai sonuca getiriyoruz.
                            </p>
                        </div>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                        variants={item}
                        className="mt-14 grid gap-6 md:grid-cols-2"
                    >
                        <FeatureCard
                            Icon={Beaker}
                            title="AR-GE ve Tasarım"
                            description="Yenilikçi Ar-Ge süreçleri ve özgün tasarım yaklaşımı."
                        />
                        <FeatureCard
                            Icon={ClipboardList}
                            title="Kaliteli Üretim"
                            description="Sıfır hata prensibi ile uçtan uca kalite kontrol."
                        />
                        <FeatureCard
                            Icon={BadgeCheck}
                            title="Sertifikalı Ürün"
                            description="Her ürün sertifikalı üretim anlayışıyla desteklenir."
                        />
                        <FeatureCard
                            Icon={Handshake}
                            title="Müşteri Memnuniyeti"
                            description="Her aşamada şeffaf iletişim ve uzman desteği."
                        />
                    </motion.div>

                    {/* CTA */}
                    <motion.div variants={item} className="mt-10 flex justify-center">
                        <span className="rounded-full border border-white/10 bg-black/30 px-6 py-2 text-sm text-white/80 backdrop-blur-sm group inline-flex items-center gap-2">
                            <Brain className="h-6 w-6 text-[var(--color-brand)] transition group-hover:scale-110" />
                            Siz düşünün, birlikte karar verelim, biz üretelim.
                        </span>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        variants={item}
                        className="mt-14 rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-sm"
                    >
                        <div className="grid gap-10 lg:grid-cols-2">
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    Bizimle İletişime Geçin
                                </h3>
                                <p className="mt-2 text-sm text-white/70">
                                    Formu doldurun, uzman ekibimiz size en kısa sürede ulaşsın.
                                </p>
                            </div>

                            <Form {...form}>
                                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                                    {/* Full Name */}
                                    <FormField
                                        control={control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Ad Soyad"
                                                        className="rounded-xl bg-black/20 text-white placeholder:text-white/40 focus-visible:ring-[var(--color-brand)]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Phone with Mask */}
                                    <FormField
                                        control={control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <IMaskInput
                                                        mask="+90 (000) 000-0000"
                                                        value={field.value}
                                                        unmask={false}
                                                        onAccept={(value) => field.onChange(value)}
                                                        placeholder="Telefon (ör: +90 (532) 123-4567)"
                                                        className="
            w-full rounded-xl border border-white/10
            bg-black/20 px-4 py-3 text-sm text-white
            placeholder:text-white/40 outline-none
            focus:border-[var(--color-brand)]
          "
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Email */}
                                    <FormField
                                        control={control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Mail Adresi"
                                                        className="rounded-xl bg-black/20 text-white placeholder:text-white/40 focus-visible:ring-[var(--color-brand)]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="mt-2 rounded-xl bg-white text-black hover:bg-[var(--color-brand)] hover:text-white"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Spinner className="h-4 w-4 text-black" />
                                                Gönderiliyor...
                                            </div>
                                        ) : (
                                            <>
                                                Gönder
                                                <ArrowUpRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
