"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, Factory, Gauge, Loader2, Ruler, Save } from "lucide-react"
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogFormSection, OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionArea } from "@/features/production/areas/api/types"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import {
    useCreateProductionMachine,
    useUpdateProductionMachine,
} from "@/features/production/machines/hooks/useProductionMachines"
import {
    buildProductionMachinePayload,
    createProductionMachineFormDefaults,
    productionMachineFormSchema,
    type ProductionMachineFormInput,
    type ProductionMachineFormValues,
} from "@/features/production/machines/schema/productionMachineForm"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"
import { MACHINE_STATUS_OPTIONS } from "@/features/production/shared/machineStatus"
import type { ShiftPattern } from "@/features/production/shiftPatterns/api/types"

/** Radix Select boş değer kabul etmiyor; "alanın / varsayılan düzen" bu sentinel ile seçilir. */
const INHERIT_PATTERN_VALUE = "__inherit__"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    machine?: ProductionMachine | null
    areas: ProductionArea[]
    shiftPatterns: ShiftPattern[]
}

/**
 * Makine formu (oluşturma + düzenleme). Uzun form deseni `LeadCustomerProfileDialog`
 * ile aynı: sabit başlık, kayan gövde, sabit eylem çubuğu, `DialogFormSection`.
 */
export function ProductionMachineFormDialog({ open, onOpenChange, machine, areas, shiftPatterns }: Props) {
    const isEditing = Boolean(machine)
    const createMutation = useCreateProductionMachine()
    const updateMutation = useUpdateProductionMachine()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<ProductionMachineFormInput, unknown, ProductionMachineFormValues>({
        resolver: zodResolver(productionMachineFormSchema),
        defaultValues: createProductionMachineFormDefaults(),
    })

    const firstAreaId = areas[0]?.id ?? ""

    useEffect(() => {
        if (!open) return
        form.reset(createProductionMachineFormDefaults(machine, firstAreaId))
    }, [firstAreaId, form, machine, open])

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildProductionMachinePayload(values)

        try {
            if (machine) {
                await updateMutation.mutateAsync({ id: machine.id, input: payload })
                toast.success("Makine güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Makine eklendi")
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
            <DialogContent className="flex max-h-[min(60rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(60rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {isEditing ? "Makineyi Düzenle" : "Yeni Makine"}
                    </DialogTitle>
                    <DialogDescription>
                        Yalnız kod, ad, alan ve kapama kuvveti zorunlu. Boş bıraktığınız teknik değerler kalıp
                        uygunluğunda &quot;doğrulanamadı&quot; uyarısı verir; kaydı engellemez.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <div className="divide-y px-4 sm:px-6">
                                <DialogFormSection icon={<Factory />} title="Kimlik" description="Makinenin kodu tahtada satır başlığında görünür.">
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kod *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="M-01" className="uppercase" {...field} />
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
                                                        <Input placeholder="Enjeksiyon 1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="brand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Marka<OptionalFieldHint /></FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="model"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Model<OptionalFieldHint /></FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="serialNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Seri no<OptionalFieldHint /></FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormNumberField control={form.control} name="manufactureYear" label="Üretim yılı" />
                                        <FormField
                                            control={form.control}
                                            name="areaId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Parkur / alan *</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Alan seçin" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {areas.map((area) => (
                                                                <SelectItem key={area.id} value={area.id}>
                                                                    {area.code} · {area.name}
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
                                                            {MACHINE_STATUS_OPTIONS.map((option) => (
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
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Ruler />}
                                    title="Kalıp Uyumu"
                                    description="Kalıbın bu makineye fiziksel olarak sığıp sığmadığı bu değerlerle kontrol edilir."
                                    tone="sky"
                                >
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <FormNumberField control={form.control} name="clampForceTon" label="Kapama kuvveti" unit="ton" required />
                                        <FormNumberField control={form.control} name="tieBarHorizontalMm" label="Kolonlar arası · yatay" unit="mm" />
                                        <FormNumberField control={form.control} name="tieBarVerticalMm" label="Kolonlar arası · dikey" unit="mm" />
                                        <FormNumberField
                                            control={form.control}
                                            name="minMoldHeightMm"
                                            label="Min. kalıp kalınlığı"
                                            unit="mm"
                                            description="Plakalar arasına sığan en ince kalıp."
                                        />
                                        <FormNumberField
                                            control={form.control}
                                            name="maxMoldHeightMm"
                                            label="Maks. kalıp kalınlığı"
                                            unit="mm"
                                            description="Dizlili makinede ayar sınırı. Hidrolik kapamada boş bırakılabilir; açıklık belirler."
                                        />
                                        <FormNumberField control={form.control} name="maxOpeningStrokeMm" label="Açılma stroku" unit="mm" />
                                        <FormNumberField
                                            control={form.control}
                                            name="maxDaylightMm"
                                            label="Maks. plaka açıklığı"
                                            unit="mm"
                                            description="Hidrolik kapamada (ör. Arburg C) doldurun: açılma = açıklık − kalıp kalınlığı. Dizlili makinede boş."
                                        />
                                        <FormNumberField control={form.control} name="locatingRingDiameterMm" label="Merkezleme bileziği" unit="mm" />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Gauge />}
                                    title="Enjeksiyon Ünitesi"
                                    description="Baskı ağırlığı, sıcak yolluk ve maça gereksinimleri bu değerlerle karşılaştırılır."
                                    tone="emerald"
                                >
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <FormNumberField
                                            control={form.control}
                                            name="shotCapacityG"
                                            label="Maks. baskı ağırlığı"
                                            unit="g"
                                            decimal
                                            description="Föydeki PS değeri; PP gibi hafif hammaddede daha düşüktür."
                                        />
                                        <FormNumberField control={form.control} name="screwDiameterMm" label="Vida çapı" unit="mm" />
                                        <FormNumberField control={form.control} name="hotRunnerZones" label="Sıcak yolluk bölgesi" unit="adet" required />
                                        <FormNumberField control={form.control} name="coreCircuits" label="Maça çekme devresi" unit="adet" required />
                                        <FormField
                                            control={form.control}
                                            name="hasRobot"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center gap-3 self-end rounded-xl border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Robot var</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<CalendarClock />}
                                    title="Planlama"
                                    description="Süre ve maliyet hesabı ile planlama tahtasındaki sıra."
                                    tone="amber"
                                >
                                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="shiftPatternId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Vardiya düzeni</FormLabel>
                                                    <Select
                                                        value={field.value || INHERIT_PATTERN_VALUE}
                                                        onValueChange={(value) => field.onChange(value === INHERIT_PATTERN_VALUE ? "" : value)}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={INHERIT_PATTERN_VALUE}>Alanın / varsayılan düzen</SelectItem>
                                                            {shiftPatterns.map((pattern) => (
                                                                <SelectItem key={pattern.id} value={pattern.id}>
                                                                    {pattern.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormNumberField
                                            control={form.control}
                                            name="plannedEfficiencyPercent"
                                            label="Planlama verimi"
                                            unit="%"
                                            required
                                            description="Süre hesabında kullanılır; genelde %80–90."
                                        />
                                        <FormNumberField
                                            control={form.control}
                                            name="hourlyCost"
                                            label="Saat maliyeti"
                                            unit="TL"
                                            decimal
                                            description="En ekonomik makine önerisi için."
                                        />
                                        <FormNumberField control={form.control} name="sortOrder" label="Tahtadaki sıra" required />
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
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
                                {isPending ? "Kaydediliyor" : isEditing ? "Değişiklikleri Kaydet" : "Makineyi Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
