"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Mail, UserCircle, PhoneCall, MessageSquareText } from "lucide-react";

import { BaseFormDialog } from "@/components/dialogs/BaseFormDialog";
import { buildMailSchema, type MailValues } from "@/components/dialogs/schemas";

import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

export function MailDialog() {
    const t = useTranslations("chrome.dialogs.mail");
    const tv = useTranslations("chrome.dialogs.mail.validation");
    const schema = useMemo(() => buildMailSchema(tv), [tv]);

    const defaultValues: MailValues = {
        fullName: "",
        phone: "",
        email: "",
        message: "",
    };

    return (
        <BaseFormDialog<MailValues>
            title={t("title")}
            description={t("description")}
            schema={schema}
            defaultValues={defaultValues}
            submitLabel={t("submit")}
            trigger={
                <button className="flex items-center justify-center lg:justify-start gap-2 text-white/70 hover:text-white transition">
                    <Mail className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    {t("trigger")}
                </button>
            }
        >
            {(form) => (
                <>
                    <FormInputWithIcon
                        control={form.control}
                        name="fullName"
                        placeholder={t("fields.fullName")}
                        icon={UserCircle}
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="phone"
                        placeholder={t("fields.phone")}
                        icon={PhoneCall}
                        mask="+90 (000) 000-0000"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="email"
                        placeholder={t("fields.email")}
                        icon={Mail}
                        type="email"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="message"
                        placeholder={t("fields.message")}
                        icon={MessageSquareText}
                        textarea
                        rows={6}
                    />
                </>
            )}
        </BaseFormDialog>
    );
}
