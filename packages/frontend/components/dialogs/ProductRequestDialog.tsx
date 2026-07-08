"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    FileText,
    Building,
    UserCircle,
    PhoneCall,
    Mail,
    PackageSearch,
} from "lucide-react";
import { BaseFormDialog } from "@/components/dialogs/BaseFormDialog";
import {
    buildProductRequestSchema,
    type ProductRequestValues,
} from "@/components/dialogs/schemas";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

type Props = {
    className?: string;
};

export function ProductRequestDialog({ className }: Props) {
    const t = useTranslations("chrome.dialogs.productRequest");
    const tv = useTranslations("chrome.dialogs.productRequest.validation");
    const schema = useMemo(() => buildProductRequestSchema(tv), [tv]);

    const defaultValues: ProductRequestValues = {
        companyName: "",
        fullName: "",
        phone: "",
        email: "",
        product: "",
    };

    return (
        <BaseFormDialog<ProductRequestValues>
            title={t("title")}
            description={t("description")}
            schema={schema}
            defaultValues={defaultValues}
            trigger={
                <button
                    className={`flex items-center gap-2 transition ${className ?? "text-white/70 hover:text-white"}`}
                >
                    <FileText className="h-3.5 w-3.5 text-[var(--color-brand)]" />
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
                        name="email"
                        placeholder={t("fields.email")}
                        icon={Mail}
                        type="email"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="product"
                        placeholder={t("fields.product")}
                        icon={PackageSearch}
                        type="text"
                    />
                </>
            )}
        </BaseFormDialog>
    );
}
