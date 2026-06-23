"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useCreateSupplierBusinessRequest } from "@/features/supplier/businessRequests/hooks/useCreateSupplierBusinessRequest"

const schema = z.object({
    code: z.coerce.number().int().positive("Kategori kodu zorunlu"),
    name: z.string().min(2, "Kategori adı zorunlu"),
    description: z.string().max(2000).optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateSupplierCategoryRequestDialog({ open, onOpenChange }: Props) {
    const mutation = useCreateSupplierBusinessRequest("Kategori talebi onaya gönderildi")
    const form = useForm<FormInput, unknown, FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            code: undefined,
            name: "",
            description: "",
        },
    })

    const onSubmit = form.handleSubmit(async (values) => {
        await mutation.mutateAsync({
            type: "SUPPLIER_CATEGORY_CREATE",
            title: `${values.code} · ${values.name}`,
            description: values.description?.trim() || null,
            requestedData: {
                code: values.code,
                name: values.name.trim(),
            },
        })

        onOpenChange(false)
        form.reset()
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Kategori Oluşturma Talebi</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Kategori Kodu</Label>
                            <Input type="number" placeholder="10" {...form.register("code")} />
                            {form.formState.errors.code ? <p className="text-xs text-red-500">{form.formState.errors.code.message}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kategori Adı</Label>
                            <Input placeholder="Bakalit Tutamaklar" {...form.register("name")} />
                            {form.formState.errors.name ? <p className="text-xs text-red-500">{form.formState.errors.name.message}</p> : null}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Açıklama</Label>
                        <Textarea rows={5} placeholder="Kategori ihtiyacını ve kapsamını açıklayın" {...form.register("description")} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Gönderiliyor..." : "Talep Aç"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
