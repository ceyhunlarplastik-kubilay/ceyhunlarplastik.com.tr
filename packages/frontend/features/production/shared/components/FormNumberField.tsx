"use client"

import type { Control, FieldPathByValue, FieldValues } from "react-hook-form"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"

/**
 * Üretim formlarının sayı alanı: değer formda METİN (boş bırakılabilir, "12,5" yazılabilir),
 * sayıya çevirme şemada (`shared/formNumbers.ts`). Birim etikette, zorunluluk yıldızla.
 *
 * Çok sütunlu ızgarada: etiket parçaları (ad, birim, "opsiyonel") sütuna sığmazsa alt satıra
 * geçer — yan sütunun üstüne taşmaz. Alan satır yüksekliğine gerilmez (`content-start`), yoksa
 * aynı satırda açıklaması olan bir alan varken etiket ve kutu aşağı kayar, kutular hizasını kaybeder.
 */
export function FormNumberField<TInput extends FieldValues, TOutput>({
    control,
    name,
    label,
    unit,
    required = false,
    decimal = false,
    description,
    className,
}: {
    control: Control<TInput, unknown, TOutput>
    name: FieldPathByValue<TInput, string>
    label: string
    unit?: string
    required?: boolean
    decimal?: boolean
    description?: string
    className?: string
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn("content-start", className)}>
                    <FormLabel className="flex-wrap gap-x-2 gap-y-1">
                        {label}
                        {unit ? <span className="font-normal text-muted-foreground">({unit})</span> : null}
                        {required ? " *" : <OptionalFieldHint />}
                    </FormLabel>
                    <FormControl>
                        <Input inputMode={decimal ? "decimal" : "numeric"} {...field} />
                    </FormControl>
                    {description ? <FormDescription className="text-xs">{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
