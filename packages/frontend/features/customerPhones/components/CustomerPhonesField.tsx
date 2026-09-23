"use client"

import { useId } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CUSTOMER_ADDITIONAL_PHONE_LIMIT } from "@core/helpers/crm/customerPhones"
import type { CustomerPhonesFormFields } from "@/features/customerPhones/schema/customerPhonesForm"

/** Etiket kutusunda tarayıcının önerdiği yaygın hatlar; serbest metin de yazılabilir. */
const LABEL_SUGGESTIONS = ["Merkez", "Muhasebe", "Satın Alma", "Fabrika", "Cep", "WhatsApp"]

/**
 * Birincil telefon + ek telefon satırları. Admin/temsilci düzenleme dialogu ile
 * veri girişi potansiyel müşteri dialogu ORTAK kullanır; form bağlamından
 * `phone` ve `additionalPhones` alanlarını okur (şema:
 * `features/customerPhones/schema/customerPhonesForm.ts`).
 */
export function CustomerPhonesField() {
    const form = useFormContext<CustomerPhonesFormFields>()
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "additionalPhones",
    })
    const suggestionsId = useId()
    const canAddMore = fields.length < CUSTOMER_ADDITIONAL_PHONE_LIMIT

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Birincil Telefon *</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="tel"
                                inputMode="tel"
                                autoComplete="off"
                                placeholder="0532 000 00 00"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                        Ek Telefonlar <span className="font-normal text-neutral-400">(opsiyonel)</span>
                    </span>
                    <span className="text-xs tabular-nums text-neutral-400">
                        {fields.length}/{CUSTOMER_ADDITIONAL_PHONE_LIMIT}
                    </span>
                </div>

                {fields.length > 0 ? (
                    <ul className="space-y-2">
                        {fields.map((item, index) => (
                            // Mobilde numara tam genişlik, etiket + sil altında; sm+'da tek satır.
                            <li
                                key={item.id}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]"
                            >
                                <FormField
                                    control={form.control}
                                    name={`additionalPhones.${index}.number`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 sm:col-span-1">
                                            <FormLabel className="sr-only">{`${index + 1}. ek telefon numarası`}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="tel"
                                                    inputMode="tel"
                                                    autoComplete="off"
                                                    placeholder="0232 000 00 00"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`additionalPhones.${index}.label`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">{`${index + 1}. ek telefon etiketi`}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    list={suggestionsId}
                                                    autoComplete="off"
                                                    placeholder="Etiket (ör. Muhasebe)"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-neutral-500 hover:text-red-600"
                                    aria-label={`${index + 1}. ek telefonu kaldır`}
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs leading-5 text-neutral-500">
                        Muhasebe, satın alma veya yetkilinin cep numarası gibi ek hatları buraya ekleyin.
                    </p>
                )}

                <datalist id={suggestionsId}>
                    {LABEL_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                    ))}
                </datalist>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={!canAddMore}
                    // Yeni satırın numara kutusuna odaklanır (RHF varsayılanı).
                    onClick={() => append({ number: "", label: "" })}
                >
                    <Plus className="h-4 w-4" />
                    Telefon ekle
                </Button>
            </div>
        </div>
    )
}
