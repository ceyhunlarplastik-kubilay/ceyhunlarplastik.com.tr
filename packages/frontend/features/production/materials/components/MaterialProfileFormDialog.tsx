"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { MaterialWithProfile } from "@/features/production/materials/api/types"
import { useUpsertMaterialProfile } from "@/features/production/materials/hooks/useMaterialProfiles"
import {
    buildMaterialProfilePayload,
    createMaterialProfileFormDefaults,
    materialProfileFormSchema,
    type MaterialProfileFormInput,
    type MaterialProfileFormValues,
} from "@/features/production/materials/schema/materialProfileForm"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    material: MaterialWithProfile | null
}

export function MaterialProfileFormDialog({ open, onOpenChange, material }: Props) {
    const upsertMutation = useUpsertMaterialProfile()

    const form = useForm<MaterialProfileFormInput, unknown, MaterialProfileFormValues>({
        resolver: zodResolver(materialProfileFormSchema),
        defaultValues: createMaterialProfileFormDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createMaterialProfileFormDefaults(material))
    }, [form, material, open])

    const requiresDrying = useWatch({ control: form.control, name: "requiresDrying" })

    const handleSubmit = form.handleSubmit(async (values) => {
        if (!material) return

        try {
            await upsertMutation.mutateAsync({ materialId: material.id, input: buildMaterialProfilePayload(values) })
            toast.success("Hammadde üretim bilgisi kaydedildi")
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-xl">
                <DialogHeader className="text-start">
                    <DialogTitle>Hammadde Üretim Bilgisi</DialogTitle>
                    <DialogDescription>
                        {material ? <span className="font-medium text-foreground">{material.name} · </span> : null}
                        Katalogdaki hammadde kaydı değişmez; bu bilgiler yalnız planlamada kullanılır.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="isMoldResin"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 rounded-xl border p-3">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                    </FormControl>
                                    <div className="space-y-1">
                                        <FormLabel>Makinede işlenen hammadde</FormLabel>
                                        <FormDescription className="text-xs">
                                            Metal burç/civata gibi kalıba yerleştirilen parçalar için işareti kaldırın.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* İki sütun: üçte birlik sütuna "Yoğunluk (g/cm³) (opsiyonel)" sığmıyor. items-start —
                            açıklaması olan alan satırı uzatsa da etiketler ve kutular aynı hizada kalır. */}
                        <div className="grid items-start gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="family"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aile<OptionalFieldHint /></FormLabel>
                                        <FormControl>
                                            <Input placeholder="PP, PA6, PF…" className="uppercase" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormNumberField control={form.control} name="densityGCm3" label="Yoğunluk" unit="g/cm³" decimal />
                            <FormNumberField
                                control={form.control}
                                name="cycleTimeFactor"
                                label="Çevrim katsayısı"
                                decimal
                                required
                                description="1 = etkisiz; 1,2 = %20 yavaş."
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="requiresDrying"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-3 rounded-xl border p-3">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                    </FormControl>
                                    <FormLabel className="font-normal">Üretimden önce kurutma gerekir</FormLabel>
                                </FormItem>
                            )}
                        />

                        {requiresDrying ? (
                            <div className="grid items-start gap-4 sm:grid-cols-2">
                                <FormNumberField control={form.control} name="dryingTempC" label="Kurutma sıcaklığı" unit="°C" />
                                <FormNumberField control={form.control} name="dryingHours" label="Kurutma süresi" unit="saat" decimal />
                            </div>
                        ) : null}

                        <FormField
                            control={form.control}
                            name="purgeNote"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Temizleme notu<OptionalFieldHint /></FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Ör. koyu renkten açığa geçişte tam temizleme" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => onOpenChange(false)}
                                disabled={upsertMutation.isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={upsertMutation.isPending}>
                                {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {upsertMutation.isPending ? "Kaydediliyor" : "Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
