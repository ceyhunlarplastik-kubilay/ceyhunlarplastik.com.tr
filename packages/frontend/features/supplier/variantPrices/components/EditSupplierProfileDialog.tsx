"use client"

import { useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { motion, AnimatePresence } from "motion/react"
import { Building2, CalendarClock, MapPin, Phone, ReceiptText, User } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { SupplierProfile } from "@/features/supplier/variantPrices/api/types"

const schema = z.object({
    name: z.string().trim().min(2, "Firma adı en az 2 karakter olmalıdır"),
    contactName: z.string().trim().max(120, "Yetkili adı çok uzun").optional(),
    phone: z.string().trim().max(50, "Telefon çok uzun").optional(),
    address: z.string().trim().max(300, "Adres çok uzun").optional(),
    taxNumber: z.string().trim().max(50, "Vergi numarası çok uzun").optional(),
    defaultPaymentTermDays: z.coerce.number().int().min(0, "Vade 0 veya pozitif olmalıdır").optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    profile?: SupplierProfile | null
    onSubmit: (values: FormValues) => Promise<void>
    isPending?: boolean
}

export function EditSupplierProfileDialog({
    open,
    onOpenChange,
    profile,
    onSubmit,
    isPending = false,
}: Props) {
    const form = useForm<FormInput, unknown, FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            contactName: "",
            phone: "",
            address: "",
            taxNumber: "",
            defaultPaymentTermDays: undefined,
        },
    })

    useEffect(() => {
        if (!open) return
        form.reset({
            name: profile?.name ?? "",
            contactName: profile?.contactName ?? "",
            phone: profile?.phone ?? "",
            address: profile?.address ?? "",
            taxNumber: profile?.taxNumber ?? "",
            defaultPaymentTermDays: profile?.defaultPaymentTermDays ?? undefined,
        })
    }, [form, open, profile])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tedarikçi Bilgilerini Düzenle</DialogTitle>
                    <DialogDescription>
                        Firma ve iletişim bilgilerini güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(async (values) => {
                            await onSubmit(values)
                            onOpenChange(false)
                        })}
                        className="space-y-4"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="supplier-profile-form"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="grid gap-3 sm:grid-cols-2"
                            >
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />Firma Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Firma adı" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="contactName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="inline-flex items-center gap-2"><User className="h-4 w-4" />Yetkili Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Yetkili kişi" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />Telefon</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="+90..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="inline-flex items-center gap-2"><ReceiptText className="h-4 w-4" />Vergi Numarası</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Vergi numarası" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="defaultPaymentTermDays"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" />Varsayılan Vade (Gün)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={typeof field.value === "number" ? field.value : ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? undefined : Number(e.target.value)
                                                        )
                                                    }
                                                    placeholder="örn. 60"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />Adres</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Açık adres" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Vazgeç
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Kaydediliyor..." : "Bilgileri Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
