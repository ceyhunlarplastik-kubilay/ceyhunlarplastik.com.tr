"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Boxes, Factory, Grid3x3, Loader2, Ruler, Save, Timer, Wrench } from "lucide-react"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogFormSection, OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import type { Mold } from "@/features/production/molds/api/types"
import { useCreateMold, useUpdateMold } from "@/features/production/molds/hooks/useMolds"
import {
    buildMoldPayload,
    createMoldFormDefaults,
    moldFormSchema,
    type MoldFormInput,
    type MoldFormValues,
} from "@/features/production/molds/schema/moldForm"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"
import { MOLD_OWNERSHIP_OPTIONS, MOLD_STATUS_OPTIONS } from "@/features/production/shared/moldStatus"
import { MoldMachineProfilesField } from "./MoldMachineProfilesField"
import { MoldOutputsField } from "./MoldOutputsField"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    mold?: Mold | null
    machines: ProductionMachine[]
}

/**
 * Kalıp formu (oluşturma + düzenleme). Göz grupları ve makine kartları formla BİRLİKTE
 * kaydedilir (sunucuda tam değişim). Uzun form deseni `LeadCustomerProfileDialog` ile aynı.
 */
export function MoldFormDialog({ open, onOpenChange, mold, machines }: Props) {
    const isEditing = Boolean(mold)
    const createMutation = useCreateMold()
    const updateMutation = useUpdateMold()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<MoldFormInput, unknown, MoldFormValues>({
        resolver: zodResolver(moldFormSchema),
        defaultValues: createMoldFormDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createMoldFormDefaults(mold))
    }, [form, mold, open])

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildMoldPayload(values)

        try {
            if (mold) {
                await updateMutation.mutateAsync({ id: mold.id, input: payload })
                toast.success("Kalıp güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Kalıp eklendi")
            }
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(64rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(64rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {isEditing ? "Kalıbı Düzenle" : "Yeni Kalıp"}
                    </DialogTitle>
                    <DialogDescription>
                        Kalıp ürün modelinin ÖLÇÜSÜNE bağlanır; renk ve hammadde yalnız çevrimi etkiler. Zorunlu olanlar
                        kod, ad ve çevrim süresi — boş teknik değerler uygunlukta &quot;doğrulanamadı&quot; uyarısı verir.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <div className="divide-y px-4 sm:px-6">
                                <DialogFormSection icon={<Boxes />} title="Kimlik">
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kod *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="K-1045" className="uppercase" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="lg:col-span-2">
                                                    <FormLabel>Ad *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Elcik 10 mm, 4 gözlü" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Durum</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {MOLD_STATUS_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ownership"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sahiplik</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {MOLD_OWNERSHIP_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="storageLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Depo yeri<OptionalFieldHint /></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Raf B-3" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2 lg:col-span-3">
                                                    <FormLabel>Not<OptionalFieldHint /></FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={2} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Grid3x3 />}
                                    title="Göz Grupları"
                                    description="Kalıbın hangi ölçüden kaç göz bastığı. Aile kalıbında farklı ölçüler ve farklı ürün modelleri olabilir; tek baskı hepsini birlikte basar."
                                    tone="brand"
                                >
                                    <MoldOutputsField />
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Ruler />}
                                    title="Makine Gereksinimleri"
                                    description="Makinenin kapama kuvveti, kolonlar arası mesafesi ve kalıp kalınlığı aralığıyla karşılaştırılır."
                                    tone="sky"
                                >
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <FormNumberField control={form.control} name="requiredClampForceTon" label="Gerekli kapama kuvveti" unit="ton" />
                                        <FormNumberField control={form.control} name="widthMm" label="Genişlik" unit="mm" />
                                        <FormNumberField control={form.control} name="heightMm" label="Yükseklik" unit="mm" />
                                        <FormNumberField control={form.control} name="thicknessMm" label="Kalınlık" unit="mm" />
                                        <FormNumberField control={form.control} name="weightKg" label="Ağırlık" unit="kg" decimal />
                                        <FormNumberField control={form.control} name="requiredOpeningStrokeMm" label="Gerekli açılma" unit="mm" />
                                        <FormNumberField control={form.control} name="locatingRingDiameterMm" label="Merkezleme bileziği" unit="mm" />
                                        <FormNumberField control={form.control} name="hotRunnerZones" label="Sıcak yolluk bölgesi" unit="adet" required />
                                        <FormNumberField control={form.control} name="coreCircuitsRequired" label="Maça çekme devresi" unit="adet" required />
                                        <FormField
                                            control={form.control}
                                            name="requiresRobot"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center gap-3 self-end rounded-xl border p-3">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Robot gerekir</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Timer />}
                                    title="Üretim"
                                    description="Süre hesabının temeli: çevrim, fire ve kalıp bağlama süresi."
                                    tone="emerald"
                                >
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <FormNumberField
                                            control={form.control}
                                            name="standardCycleTimeSec"
                                            label="Çevrim süresi"
                                            unit="sn"
                                            decimal
                                            required
                                            description="Referans; hammadde katsayısı ve makine kartı ezebilir."
                                        />
                                        <FormNumberField control={form.control} name="runnerWeightG" label="Yolluk ağırlığı" unit="g" decimal />
                                        <FormNumberField control={form.control} name="expectedScrapPercent" label="Beklenen fire" unit="%" decimal required />
                                        <FormNumberField
                                            control={form.control}
                                            name="setupMinutes"
                                            label="Bağlama süresi"
                                            unit="dk"
                                            required
                                            description="Söküm + bağlama + ısınma."
                                        />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Wrench />}
                                    title="Bakım"
                                    description="Bakım aralığının %85'i dolunca listede uyarı görünür."
                                    tone="amber"
                                >
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <FormNumberField control={form.control} name="totalShots" label="Toplam baskı" required />
                                        <FormNumberField control={form.control} name="maintenanceIntervalShots" label="Bakım aralığı" unit="baskı" />
                                        <FormNumberField control={form.control} name="shotsAtLastMaintenance" label="Son bakımdaki baskı" required />
                                        <FormField
                                            control={form.control}
                                            name="lastMaintenanceAt"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Son bakım tarihi<OptionalFieldHint /></FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Factory />}
                                    title="Makine Kartları"
                                    description="Opsiyonel: kalıbın belirli makinelerde kanıtlanmış ayarı, tercihi ya da engeli."
                                >
                                    <MoldMachineProfilesField machines={machines} />
                                </DialogFormSection>
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isPending ? "Kaydediliyor" : isEditing ? "Değişiklikleri Kaydet" : "Kalıbı Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
