"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Color, ColorSystem } from "@/features/admin/colors/api/types"
import {
    useCreateColor,
    useUpdateColor,
} from "@/features/admin/colors/hooks/useColorMutations"

const colorFormSchema = z.object({
    name: z.string().min(2, "Renk adı en az 2 karakter olmalıdır"),
    englishName: z.string().optional(),
    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
    code: z.string().min(3, "Kod en az 3 karakter olmalıdır").max(20, "Kod en fazla 20 karakter olabilir"),
    hex: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Hex formatı #RRGGBB olmalıdır"),
    isActive: z.enum(["true", "false"]),
})

type ColorFormValues = z.infer<typeof colorFormSchema>

type Props = {
    open: boolean
    color?: Color | null
    onOpenChange: (open: boolean) => void
}

const colorSystemLabels: Record<ColorSystem, string> = {
    RAL: "RAL",
    PANTONE: "Pantone",
    NCS: "NCS",
    CUSTOM: "Özel",
}

function normalizePickerHex(value: string) {
    return /^#([0-9A-Fa-f]{6})$/.test(value) ? value : "#000000"
}

function getEnglishTranslation(color?: Color | null) {
    return color?.translations?.find((translation) => translation.locale === "en")
}

export function ColorFormDialog({ open, color, onOpenChange }: Props) {
    const createColorMutation = useCreateColor()
    const updateColorMutation = useUpdateColor()
    const englishTranslation = getEnglishTranslation(color)

    const form = useForm<ColorFormValues>({
        resolver: zodResolver(colorFormSchema),
        defaultValues: {
            name: "",
            englishName: "",
            system: "CUSTOM",
            code: "",
            hex: "#000000",
            isActive: "true",
        },
    })

    const isEditing = Boolean(color)
    const isPending = createColorMutation.isPending || updateColorMutation.isPending
    const hexValue = form.watch("hex")

    useEffect(() => {
        if (!open) return

        form.reset({
            name: color?.name ?? "",
            englishName: englishTranslation?.name ?? "",
            system: color?.system ?? "CUSTOM",
            code: color?.code ?? "",
            hex: color?.hex ?? "#000000",
            isActive: color?.isActive === false ? "false" : "true",
        })
    }, [color, englishTranslation?.name, form, open])

    const onSubmit = form.handleSubmit(async (values) => {
        const englishName = values.englishName?.trim()
        const translations = [
            { locale: "tr" as const, name: values.name.trim() },
            ...(!englishTranslation && englishName
                ? [{ locale: "en" as const, name: englishName }]
                : []),
        ]
        const payload = {
            name: values.name.trim(),
            system: values.system,
            code: values.code.trim(),
            hex: values.hex.trim(),
            translations,
        }

        try {
            if (color) {
                await updateColorMutation.mutateAsync({
                    id: color.id,
                    ...payload,
                    isActive: values.isActive === "true",
                })
            } else {
                await createColorMutation.mutateAsync(payload)
            }

            onOpenChange(false)
        } catch {
            // Mutations own user-facing errors.
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Rengi Düzenle" : "Yeni Renk"}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="color-name">Ad</Label>
                            <Input
                                id="color-name"
                                placeholder="örn. Siyah"
                                {...form.register("name")}
                            />
                            {form.formState.errors.name ? (
                                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="color-english-name">İngilizce Ad</Label>
                            <Input
                                id="color-english-name"
                                placeholder="örn. Black"
                                disabled={Boolean(englishTranslation)}
                                {...form.register("englishName")}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Sistem</Label>
                            <Select
                                value={form.watch("system")}
                                onValueChange={(value) => form.setValue("system", value as ColorSystem, { shouldDirty: true })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sistem seç" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(colorSystemLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="color-code">Kod</Label>
                            <Input
                                id="color-code"
                                placeholder="örn. RAL9005"
                                {...form.register("code")}
                            />
                            {form.formState.errors.code ? (
                                <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[96px_1fr_140px]">
                        <div className="space-y-1.5">
                            <Label htmlFor="color-picker">Renk</Label>
                            <Input
                                id="color-picker"
                                type="color"
                                className="h-10 p-1"
                                value={normalizePickerHex(hexValue)}
                                onChange={(event) => form.setValue("hex", event.target.value, { shouldDirty: true, shouldValidate: true })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="color-hex">Hex</Label>
                            <Input
                                id="color-hex"
                                placeholder="#000000"
                                {...form.register("hex")}
                            />
                            {form.formState.errors.hex ? (
                                <p className="text-xs text-red-500">{form.formState.errors.hex.message}</p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Durum</Label>
                            <Select
                                value={form.watch("isActive")}
                                onValueChange={(value) => form.setValue("isActive", value as "true" | "false", { shouldDirty: true })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Durum" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Aktif</SelectItem>
                                    <SelectItem value="false">Pasif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
