"use client";

import { Mail, UserCircle, PhoneCall, MessageSquareText } from "lucide-react";

import { BaseFormDialog } from "@/components/dialogs/BaseFormDialog";
import { mailSchema, type MailValues } from "@/components/dialogs/schemas";

import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

export function MailDialog() {
    const defaultValues: MailValues = {
        fullName: "",
        phone: "",
        email: "",
        message: "",
    };

    return (
        <BaseFormDialog<MailValues>
            title="Mail Gönder"
            description="Mesajınızı iletin, en kısa sürede dönüş yapalım."
            schema={mailSchema}
            defaultValues={defaultValues}
            submitLabel="Mesajı Gönder"
            trigger={
                <button className="flex items-center justify-center lg:justify-start gap-2 text-white/70 hover:text-white transition">
                    <Mail className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    Mail Gönder
                </button>
            }
        >
            {(form) => (
                <>
                    {/* Ad Soyad */}
                    <FormInputWithIcon
                        control={form.control}
                        name="fullName"
                        placeholder="Ad Soyad"
                        icon={UserCircle}
                    />

                    {/* Telefon */}
                    <FormInputWithIcon
                        control={form.control}
                        name="phone"
                        placeholder="Telefon (ör: +90 (532) 123-4567)"
                        icon={PhoneCall}
                        mask="+90 (000) 000-0000"
                    />

                    {/* Email */}
                    <FormInputWithIcon
                        control={form.control}
                        name="email"
                        placeholder="E-posta adresiniz"
                        icon={Mail}
                        type="email"
                    />

                    {/* Mesaj (TEXTAREA) */}
                    <FormInputWithIcon
                        control={form.control}
                        name="message"
                        placeholder="Mesajınızı detaylı şekilde yazabilirsiniz"
                        icon={MessageSquareText}
                        textarea
                        rows={6}
                    />
                </>
            )}
        </BaseFormDialog>
    );
}
