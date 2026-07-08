"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    BookOpen,
    Building,
    UserCircle,
    PhoneCall,
    MapPin,
} from "lucide-react";
import { BaseFormDialog } from "@/components/dialogs/BaseFormDialog";
import {
    buildCatalogRequestSchema,
    type CatalogRequestValues,
} from "@/components/dialogs/schemas";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

type Props = {
    className?: string;
};

export function CatalogRequestDialog({ className }: Props) {
    const t = useTranslations("chrome.dialogs.catalogRequest");
    const tv = useTranslations("chrome.dialogs.catalogRequest.validation");
    const schema = useMemo(() => buildCatalogRequestSchema(tv), [tv]);

    const defaultValues: CatalogRequestValues = {
        companyName: "",
        fullName: "",
        phone: "",
        address: "",
    };

    return (
        <BaseFormDialog<CatalogRequestValues>
            title={t("title")}
            description={t("description")}
            schema={schema}
            defaultValues={defaultValues}
            trigger={
                <button
                    className={`flex items-center gap-2 transition ${className ?? "text-white/70 hover:text-white"}`}
                >
                    <BookOpen className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    {t("trigger")}
                </button>
            }
        >
            {(form) => (
                <>
                    <FormInputWithIcon
                        control={form.control}
                        name="companyName"
                        placeholder={t("fields.companyName")}
                        icon={Building}
                        type="text"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="fullName"
                        placeholder={t("fields.fullName")}
                        icon={UserCircle}
                        type="text"
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
                        name="address"
                        placeholder={t("fields.address")}
                        icon={MapPin}
                        type="text"
                    />
                </>
            )}
        </BaseFormDialog>
    );
}
