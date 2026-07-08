"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
    User,
    Mail,
    PhoneCall,
    MessageSquare,
} from "lucide-react";

import {
    buildSuggestionFormSchema,
    type SuggestionFormValues,
} from "../schema";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

export function SuggestionForm() {
    const t = useTranslations("public.suggestion");
    const tf = useTranslations("public.suggestion.form");
    const tv = useTranslations("public.suggestion.validation");
    const schema = useMemo(() => buildSuggestionFormSchema(tv), [tv]);

    const form = useForm<SuggestionFormValues>({
        resolver: zodResolver(schema),
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
                        {t("heroTitle")}
                    </h1>

                    <p className="mt-4 text-white/90 max-w-2xl leading-relaxed">
                        {t("heroSubtitle")}
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
                                    placeholder={tf("fields.fullName")}
                                    icon={User}
                                />

                                <FormInputWithIcon
                                    control={control}
                                    name="email"
                                    type="email"
                                    placeholder={tf("fields.email")}
                                    icon={Mail}
                                />

                                <FormInputWithIcon
                                    control={control}
                                    name="phone"
                                    mask="+90 (000) 000-0000"
                                    placeholder={tf("fields.phone")}
                                    icon={PhoneCall}
                                />

                                {/* ================= TYPE ================= */}
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        {tf("typeLabel")}
                                    </p>

                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="suggestion"
                                                {...register("type")}
                                            />
                                            {tf("typeSuggestion")}
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="complaint"
                                                {...register("type")}
                                            />
                                            {tf("typeComplaint")}
                                        </label>
                                    </div>
                                </div>

                                <FormInputWithIcon
                                    control={control}
                                    name="message"
                                    textarea
                                    rows={5}
                                    placeholder={tf("fields.message")}
                                    icon={MessageSquare}
                                />

                                {/* ================= CONSENT ================= */}
                                <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...register("consent")}
                                        className="mt-1"
                                    />
                                    {tf("consent")}
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
                                            {tf("submitting")}
                                        </span>
                                    ) : (
                                        tf("submit")
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
