"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import {
    User,
    Mail,
    PhoneCall,
    MessageSquare,
} from "lucide-react";

import {
    suggestionFormSchema,
    type SuggestionFormValues,
} from "../schema";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

export function SuggestionForm() {
    const form = useForm<SuggestionFormValues>({
        resolver: zodResolver(suggestionFormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            type: "suggestion",
            message: "",
            consent: false,
        },
    });

    const {
        handleSubmit,
        control,
        formState: { isSubmitting },
        register,
        watch,
    } = form;

    const onSubmit = async (data: SuggestionFormValues) => {
        if (data.website) return;

        console.log("FORM:", data);
        await new Promise((r) => setTimeout(r, 1200));
    };

    return (
        <div className="bg-neutral-50">

            {/* ================= HERO ================= */}
            <section className="relative h-[35vh] min-h-[260px] overflow-hidden">
                <img
                    src="/logos/hr.jpg"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">

                    <h1 className="text-white text-3xl md:text-4xl font-semibold">
                        Öneri & Şikayet
                    </h1>

                    <p className="mt-4 text-white/90 max-w-2xl leading-relaxed">
                        Sizlere daha iyi hizmet sunabilmek için geri bildirimleriniz bizim için büyük önem taşımaktadır. Bu form aracılığıyla işletmemiz hakkında görüş, öneri ve şikayetlerinizi iletebilirsiniz.
                    </p>

                </div>
            </section>

            {/* ================= FORM ================= */}
            <section className="relative pb-24 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto -mt-12 md:-mt-16"
                >
                    <div className="rounded-3xl bg-white shadow-2xl p-8 md:p-10">

                        <Form {...form}>
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="mt-8 space-y-6"
                            >
                                <FormInputWithIcon
                                    control={control}
                                    name="fullName"
                                    placeholder="Ad Soyad"
                                    icon={User}
                                />

                                <FormInputWithIcon
                                    control={control}
                                    name="email"
                                    type="email"
                                    placeholder="E-posta"
                                    icon={Mail}
                                />

                                <FormInputWithIcon
                                    control={control}
                                    name="phone"
                                    mask="+90 (000) 000-0000"
                                    placeholder="+90 (532) 123-4567"
                                    icon={PhoneCall}
                                />

                                {/* ================= TYPE ================= */}
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Bildirim Türü
                                    </p>

                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="suggestion"
                                                {...register("type")}
                                            />
                                            Öneri
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="complaint"
                                                {...register("type")}
                                            />
                                            Şikayet
                                        </label>
                                    </div>
                                </div>

                                <FormInputWithIcon
                                    control={control}
                                    name="message"
                                    textarea
                                    rows={5}
                                    placeholder="Mesajınız"
                                    icon={MessageSquare}
                                />

                                {/* ================= CONSENT ================= */}
                                <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...register("consent")}
                                        className="mt-1"
                                    />
                                    Gizlilik Politikasını okudum ve kabul ediyorum.
                                </label>

                                {/* honeypot */}
                                <input
                                    type="text"
                                    className="hidden"
                                    {...register("website")}
                                />

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="
                                        w-full rounded-xl py-6 text-base font-semibold
                                        bg-[var(--color-brand)] text-black
                                        hover:bg-black hover:text-white
                                        transition
                                    "
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <Spinner className="h-5 w-5" />
                                            Gönderiliyor...
                                        </span>
                                    ) : (
                                        "Gönder"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
