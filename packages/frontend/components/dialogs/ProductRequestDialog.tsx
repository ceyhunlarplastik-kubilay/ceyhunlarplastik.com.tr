"use client";

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
    productRequestSchema,
    type ProductRequestValues,
} from "@/components/dialogs/schemas";
import { FormInputWithIcon } from "@/components/ui/FormInputWithIcon";

export function ProductRequestDialog() {
    const defaultValues: ProductRequestValues = {
        companyName: "",
        fullName: "",
        phone: "",
        email: "",
        product: "",
    };

    return (
        <BaseFormDialog<ProductRequestValues>
            title="Ürün Talep Et"
            description="Talep ettiğiniz ürün bilgisini paylaşın, sizinle iletişime geçelim."
            schema={productRequestSchema}
            defaultValues={defaultValues}
            trigger={
                <button className="flex items-center justify-center lg:justify-start gap-2 text-white/70 hover:text-white transition">
                    <FileText className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    Ürün Talep Et
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
                        name="email"
                        placeholder="E-posta adresiniz"
                        icon={Mail}
                        type="email"
                    />

                    <FormInputWithIcon
                        control={form.control}
                        name="product"
                        placeholder="Talep edilen ürün"
                        icon={PackageSearch}
                        type="text"
                    />
                </>
            )}
        </BaseFormDialog>
    );
}
