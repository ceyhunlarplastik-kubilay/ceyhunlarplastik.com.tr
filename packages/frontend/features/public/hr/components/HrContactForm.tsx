"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import {
    User,
    Mail,
    PhoneCall,
    MapPin,
    GraduationCap,
    Building2,
    MessageSquare,
    FileUp,
} from "lucide-react";

import { hrFormSchema, type HrFormValues } from "@/features/public/hr/schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";
import { FormFileUpload } from "@/components/ui/FormFileUpload";

export default function HrContactForm() {
    const form = useForm<HrFormValues>({
        resolver: zodResolver(hrFormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            address: "",
            education: "",
            department: "",
            message: "",
            cv: undefined,
        },
    });

    const {
        handleSubmit,
        control,
        formState: { isSubmitting },
    } = form;

    const onSubmit = async (data: HrFormValues) => {
        // TODO: Formu gönder
        console.log("HR FORM:", data);
        // Honeypot doluysa → direkt discard
        if (data.website) {
            return;
        }
        await new Promise((r) => setTimeout(r, 1200));
        console.log("HR FORM:", data);
    };

    return (
        <section id="hr-form" className="relative pb-24 bg-neutral-50">
            <div className="mx-auto max-w-2xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="rounded-3xl bg-white shadow-xl p-8 md:p-10"
                >
                    <h2 className="text-3xl font-semibold text-neutral-900 text-center">
                        İnsan Kaynakları Başvuru Formu
                    </h2>

                    <p className="mt-3 text-base text-neutral-600 text-center">
                        Bilgilerinizi doldurun, CV’nizi ekleyin, sizinle iletişime geçelim.
                    </p>

                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
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
                                placeholder="E-posta adresiniz"
                                icon={Mail}
                            />

                            <FormInputWithIcon
                                control={control}
                                name="phone"
                                mask="+90 (000) 000-0000"
                                placeholder="+90 (532) 123-4567"
                                icon={PhoneCall}
                            />

                            <FormInputWithIcon
                                control={control}
                                name="address"
                                placeholder="Adres"
                                icon={MapPin}
                            />

                            <FormInputWithIcon
                                control={control}
                                name="education"
                                placeholder="Eğitim Durumu"
                                icon={GraduationCap}
                            />

                            <FormInputWithIcon
                                control={control}
                                name="department"
                                placeholder="Başvurulan Departman"
                                icon={Building2}
                            />

                            <FormInputWithIcon
                                control={control}
                                name="message"
                                textarea
                                rows={5}
                                placeholder="Kendinizden ve başvurunuzdan bahsedin"
                                icon={MessageSquare}
                            />

                            <FormFileUpload
                                control={control}
                                name="cv"
                                icon={FileUp}
                                label="CV Yükle (PDF · max 5MB)"
                            />

                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                className="hidden"
                                {...form.register("website")}
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
                                    "Başvuruyu Gönder"
                                )}
                            </Button>
                        </form>
                    </Form>
                </motion.div>
            </div>
        </section>
    );
}
