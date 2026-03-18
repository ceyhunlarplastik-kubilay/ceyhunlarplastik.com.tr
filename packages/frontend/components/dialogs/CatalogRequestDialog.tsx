"use client";

import {
    BookOpen,
    Building,
    UserCircle,
    PhoneCall,
    MapPin,
} from "lucide-react";
import { BaseFormDialog } from "@/components/dialogs/BaseFormDialog";
import {
    catalogRequestSchema,
    type CatalogRequestValues,
} from "@/components/dialogs/schemas";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

type Props = {
    className?: string;
};

export function CatalogRequestDialog({ className }: Props) {
    const defaultValues: CatalogRequestValues = {
        companyName: "",
        fullName: "",
        phone: "",
        address: "",
    };

    return (
        <BaseFormDialog<CatalogRequestValues>
            title="Katalog Talep Et"
            description="Katalog talebinizi iletin, size e-posta ile gönderelim."
            schema={catalogRequestSchema}
            defaultValues={defaultValues}
            trigger={
                <button
                    className={`flex items-center gap-2 transition ${className ?? "text-white/70 hover:text-white"}`}
                >
                    <BookOpen className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    Katalog Talep Et
                </button>
            }
        >
            {(form) => (
                <>
                    <FormInputWithIcon
                        control={form.control}
                        name="companyName"
                        placeholder="Firma Adı"
                        icon={Building}
                        type="text"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="fullName"
                        placeholder="Ad Soyad"
                        icon={UserCircle}
                        type="text"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="phone"
                        placeholder="Telefon (ör: +90 (532) 123-4567)"
                        icon={PhoneCall}
                        mask="+90 (000) 000-0000"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="address"
                        placeholder="Adres"
                        icon={MapPin}
                        type="text"
                    />
                </>
            )}
        </BaseFormDialog>
    );
}