"use client"

import { useEffect, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    customerPortalUserInviteSchema,
    emptyCustomerPortalUserInvite,
    type CustomerPortalUserInviteFormValues,
} from "@/features/customerPortal/schema/customerPortalUserInvite"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (values: CustomerPortalUserInviteFormValues) => Promise<void> | void
    isSubmitting?: boolean
}

function RequiredFormLabel({ children }: { children: ReactNode }) {
    return (
        <FormLabel>
            {children}
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        </FormLabel>
    )
}

export function CustomerPortalUserInviteDialog({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting = false,
}: Props) {
    const form = useForm<CustomerPortalUserInviteFormValues>({
        resolver: zodResolver(customerPortalUserInviteSchema),
        defaultValues: emptyCustomerPortalUserInvite(),
    })

    useEffect(() => {
        if (!open) {
            form.reset(emptyCustomerPortalUserInvite())
            return
        }

        form.reset(emptyCustomerPortalUserInvite())
    }, [form, open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                    <DialogDescription>
                        Portal kullanıcısı için e-posta daveti oluşturun. Kullanıcı şifresini davet linki üzerinden belirleyecek.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-5"
                        onSubmit={form.handleSubmit(async (values) => {
                            await onSubmit(values)
                        })}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <RequiredFormLabel>Ad</RequiredFormLabel>
                                        <FormControl>
                                            <Input placeholder="Ad" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <RequiredFormLabel>Soyad</RequiredFormLabel>
                                        <FormControl>
                                            <Input placeholder="Soyad" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <RequiredFormLabel>E-posta</RequiredFormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="kullanici@firma.com" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Davet bağlantısı bu e-posta adresine gönderilir.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="customerContactTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Görev</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Muhasebe sorumlusu, operasyon yöneticisi..."
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="customerContactDepartment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departman</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Muhasebe, depo, satın alma..."
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isPrimaryCustomerContact"
                            render={({ field }) => (
                                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                        </FormControl>
                                        <div className="space-y-1">
                                            <FormLabel className="text-sm font-medium text-slate-900">Ana yetkili olarak işaretle</FormLabel>
                                            <FormDescription className="text-sm leading-6 text-slate-500">
                                                Kullanıcı daveti kabul ettiğinde mevcut ana yetkili otomatik olarak güncellenir.
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Vazgeç
                            </Button>
                            <Button type="submit" variant="brand" disabled={isSubmitting}>
                                {isSubmitting ? "Davet Gönderiliyor..." : "Daveti Gönder"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
