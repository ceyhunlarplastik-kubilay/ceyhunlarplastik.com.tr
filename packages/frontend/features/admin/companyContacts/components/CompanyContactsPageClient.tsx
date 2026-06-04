"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Building2, PencilLine, Plus, RefreshCcw } from "lucide-react"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
    useCompanyContacts,
    useCreateCompanyContact,
    useUpdateCompanyContact,
} from "@/features/admin/companyContacts/hooks/useCompanyContacts"
import type { CompanyContact } from "@/features/admin/companyContacts/api/types"

const companyContactFormSchema = z.object({
    department: z.string().trim().min(2, "Departman en az 2 karakter olmalı.").max(120),
    name: z.string().trim().min(2, "Kişi adı en az 2 karakter olmalı.").max(160),
    roleLabel: z.string().trim().max(120).optional(),
    email: z.union([z.email("Geçerli e-posta girin."), z.literal("")]).optional(),
    phone: z.string().trim().max(50).optional(),
    whatsappPhone: z.string().trim().max(50).optional(),
    note: z.string().trim().max(2000).optional(),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
}).superRefine((value, ctx) => {
    if (value.email || value.phone || value.whatsappPhone) return
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "En az bir iletişim kanalı girilmelidir.",
    })
})

type CompanyContactFormInput = z.input<typeof companyContactFormSchema>
type CompanyContactFormValues = z.output<typeof companyContactFormSchema>

function createDefaults(contact?: CompanyContact | null): CompanyContactFormInput {
    return {
        department: contact?.department ?? "",
        name: contact?.name ?? "",
        roleLabel: contact?.roleLabel ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        whatsappPhone: contact?.whatsappPhone ?? "",
        note: contact?.note ?? "",
        displayOrder: contact?.displayOrder ?? 0,
        isActive: contact?.isActive ?? true,
    }
}

function toPayload(values: CompanyContactFormValues) {
    return {
        department: values.department.trim(),
        name: values.name.trim(),
        roleLabel: values.roleLabel?.trim() || null,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        whatsappPhone: values.whatsappPhone?.trim() || null,
        note: values.note?.trim() || null,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
    }
}

export function CompanyContactsPageClient() {
    const [editingContact, setEditingContact] = useState<CompanyContact | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const contactsQuery = useCompanyContacts({ page: 1, limit: 500 })
    const createMutation = useCreateCompanyContact()
    const updateMutation = useUpdateCompanyContact()
    const contacts = contactsQuery.data?.data ?? []
    const form = useForm<CompanyContactFormInput, unknown, CompanyContactFormValues>({
        resolver: zodResolver(companyContactFormSchema),
        defaultValues: createDefaults(),
    })

    useEffect(() => {
        if (!dialogOpen) return
        form.reset(createDefaults(editingContact))
    }, [dialogOpen, editingContact, form])

    async function handleSubmit(values: CompanyContactFormValues) {
        const payload = toPayload(values)
        try {
            if (editingContact) {
                await updateMutation.mutateAsync({ id: editingContact.id, ...payload })
                toast.success("Ceyhunlar iletişim kaydı güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Ceyhunlar iletişim kaydı oluşturuldu")
            }
            setDialogOpen(false)
            setEditingContact(null)
        } catch {
            toast.error("Ceyhunlar iletişim kaydı kaydedilemedi")
        }
    }

    function openCreateDialog() {
        setEditingContact(null)
        setDialogOpen(true)
    }

    function openEditDialog(contact: CompanyContact) {
        setEditingContact(contact)
        setDialogOpen(true)
    }

    const isSaving = createMutation.isPending || updateMutation.isPending

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                        <Building2 className="h-4 w-4" />
                        Ceyhunlar Plastik
                    </div>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
                        Departman İletişimleri
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Müşteri portalında gösterilecek muhasebe, depo, destek ve operasyon contact kayıtlarını yönetin.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void contactsQuery.refetch()}
                        disabled={contactsQuery.isFetching}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Yenile
                    </Button>
                    <Button type="button" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni İletişim
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <Table className="min-w-[960px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Departman</TableHead>
                                <TableHead>Kişi</TableHead>
                                <TableHead>İletişim</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Sıra</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contactsQuery.isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12">
                                        <div className="flex justify-center">
                                            <Spinner className="size-5" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : contacts.length > 0 ? contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell>
                                        <div className="font-medium text-neutral-900">{contact.department}</div>
                                        {contact.note ? (
                                            <div className="mt-1 line-clamp-1 text-xs text-neutral-500">{contact.note}</div>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-neutral-900">{contact.name}</div>
                                        <div className="text-xs text-neutral-500">{contact.roleLabel || "Rol tanımlı değil"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-neutral-900">{contact.email || "-"}</div>
                                        <div className="text-xs text-neutral-500">{contact.whatsappPhone || contact.phone || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={contact.isActive ? "default" : "secondary"}>
                                            {contact.isActive ? "Aktif" : "Pasif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{contact.displayOrder}</TableCell>
                                    <TableCell className="text-right">
                                        <Button type="button" size="sm" variant="outline" onClick={() => openEditDialog(contact)}>
                                            <PencilLine className="mr-2 h-4 w-4" />
                                            Düzenle
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-sm text-neutral-500">
                                        Henüz Ceyhunlar departman iletişimi yok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditingContact(null)
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingContact ? "İletişim Kaydını Düzenle" : "Yeni Ceyhunlar İletişimi"}
                        </DialogTitle>
                        <DialogDescription>
                            Bu kayıt login hesabı değildir; yalnız müşteri portalında gösterilecek iletişim bilgisidir.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Departman</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Muhasebe, Depo, Destek" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kişi Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ad Soyad" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="roleLabel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol / Unvan</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Muhasebe Yetkilisi" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="displayOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sıralama</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={typeof field.value === "number" ? field.value : ""}
                                                    onChange={(event) => field.onChange(event.target.value === "" ? 0 : Number(event.target.value))}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    ref={field.ref}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>E-posta</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" placeholder="ornek@ceyhunlarplastik.com.tr" />
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
                                            <FormLabel>Telefon</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="+90..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="whatsappPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>WhatsApp Telefon</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="+90..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Durum</FormLabel>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={field.value ? "default" : "outline"}
                                                    onClick={() => field.onChange(true)}
                                                >
                                                    Aktif
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={!field.value ? "default" : "outline"}
                                                    onClick={() => field.onChange(false)}
                                                >
                                                    Pasif
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Not</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} rows={3} placeholder="İç not veya çalışma açıklaması" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Vazgeç
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
