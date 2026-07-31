"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
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
import {
    MEASUREMENT_TYPE_CODES,
    type MeasurementType,
    type MeasurementTypeCode,
} from "@/features/admin/measurementTypes/api/types"
import {
    useCreateMeasurementType,
    useUpdateMeasurementType,
} from "@/features/admin/measurementTypes/hooks/useMeasurementTypeMutations"
import { AdminTranslatedNameSection } from "@/features/admin/shared/translations/AdminTranslatedNameSection"
import { ADMIN_DEFAULT_LOCALE } from "@/features/admin/shared/translations/adminLocales"
import { useActiveTranslationLocale } from "@/features/admin/shared/translations/useActiveTranslationLocale"
import {
    buildNameTranslationDefaults,
    buildNameTranslationsPayload,
    nameTranslationFormSchema,
} from "@/features/admin/shared/translations/nameTranslations"

const measurementTypeFormSchema = z.object({
    name: z.string().min(2, "Ölçü tipi adı en az 2 karakter olmalıdır"),
    translations: z.array(nameTranslationFormSchema),
    code: z.enum([
        "D",
        "D1",
        "D2",
        "R",
        "R1",
        "R2",
        "L",
        "L1",
        "L2",
        "T",
        "A",
        "W",
        "H",
        "H1",
        "H2",
        "PT",
        "M",
        "R_L",
    ]),
    baseUnit: z.string().min(1, "Birim zorunludur").max(20, "Birim en fazla 20 karakter olabilir"),
    displayOrder: z.number().int("Sıra tam sayı olmalıdır").min(0, "Sıra negatif olamaz"),
})

type MeasurementTypeFormValues = z.infer<typeof measurementTypeFormSchema>

type Props = {
    open: boolean
    measurementType?: MeasurementType | null
    onOpenChange: (open: boolean) => void
}

export function MeasurementTypeFormDialog({
    open,
    measurementType,
    onOpenChange,
}: Props) {
    const createMeasurementTypeMutation = useCreateMeasurementType()
    const updateMeasurementTypeMutation = useUpdateMeasurementType()
    const [activeLocale, setActiveLocale] = useActiveTranslationLocale(open)

    const form = useForm<MeasurementTypeFormValues>({
        resolver: zodResolver(measurementTypeFormSchema),
        defaultValues: {
            name: "",
            translations: buildNameTranslationDefaults(),
            code: "D",
            baseUnit: "mm",
            displayOrder: 0,
        },
    })

    const isEditing = Boolean(measurementType)
    const isPending =
        createMeasurementTypeMutation.isPending ||
        updateMeasurementTypeMutation.isPending

    useEffect(() => {
        if (!open) return

        form.reset({
            name: measurementType?.name ?? "",
            translations: buildNameTranslationDefaults(measurementType?.translations),
            code: measurementType?.code ?? "D",
            baseUnit: measurementType?.baseUnit ?? "mm",
            displayOrder: measurementType?.displayOrder ?? 0,
        })
    }, [form, measurementType, open])

    const onSubmit = form.handleSubmit(async (values) => {
        const translationPayload = buildNameTranslationsPayload({
            translations: values.translations,
            existing: measurementType?.translations,
        })
        const payload = {
            name: values.name.trim(),
            code: values.code,
            baseUnit: values.baseUnit.trim(),
            displayOrder: values.displayOrder,
        }

        try {
            if (measurementType) {
                await updateMeasurementTypeMutation.mutateAsync({
                    id: measurementType.id,
                    ...payload,
                    ...translationPayload,
                })
            } else {
                await createMeasurementTypeMutation.mutateAsync({
                    ...payload,
                    translations: [
                        { locale: ADMIN_DEFAULT_LOCALE, name: payload.name },
                        ...(translationPayload.translations ?? []),
                    ],
                })
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
                    <DialogTitle>{isEditing ? "Ölçü Tipini Düzenle" : "Yeni Ölçü Tipi"}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
                    <Controller
                        name="translations"
                        control={form.control}
                        render={({ field }) => (
                            <AdminTranslatedNameSection
                                entityLabel="Ölçü tipi adı"
                                activeLocale={activeLocale}
                                onActiveLocaleChange={setActiveLocale}
                                translations={field.value}
                                onTranslationsChange={field.onChange}
                                targetPlaceholder="örn. Diameter"
                                defaultLocaleField={
                                    <div className="space-y-1.5">
                                        <Label htmlFor="measurement-type-name">Türkçe ölçü tipi adı</Label>
                                        <Input
                                            id="measurement-type-name"
                                            placeholder="örn. Çap"
                                            {...form.register("name")}
                                        />
                                        {form.formState.errors.name ? (
                                            <p className="text-xs text-red-500">
                                                {form.formState.errors.name.message}
                                            </p>
                                        ) : null}
                                    </div>
                                }
                            />
                        )}
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label>Kod</Label>
                            <Select
                                value={form.watch("code")}
                                onValueChange={(value) => form.setValue("code", value as MeasurementTypeCode, { shouldDirty: true })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Kod" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MEASUREMENT_TYPE_CODES.map((code) => (
                                        <SelectItem key={code} value={code}>
                                            {code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="measurement-type-base-unit">Birim</Label>
                            <Input
                                id="measurement-type-base-unit"
                                placeholder="mm"
                                {...form.register("baseUnit")}
                            />
                            {form.formState.errors.baseUnit ? (
                                <p className="text-xs text-red-500">{form.formState.errors.baseUnit.message}</p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="measurement-type-display-order">Sıra</Label>
                            <Input
                                id="measurement-type-display-order"
                                type="number"
                                min={0}
                                step={1}
                                {...form.register("displayOrder", { valueAsNumber: true })}
                            />
                            {form.formState.errors.displayOrder ? (
                                <p className="text-xs text-red-500">{form.formState.errors.displayOrder.message}</p>
                            ) : null}
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
