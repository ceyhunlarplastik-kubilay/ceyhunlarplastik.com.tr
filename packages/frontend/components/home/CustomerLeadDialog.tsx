"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AnimatePresence, motion } from "motion/react"
import {
    ArrowRight,
    Building2,
    ChevronRight,
    Factory,
    Mail,
    MessageSquare,
    Phone,
    Check,
    Send,
    Sparkles,
    User2,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ButtonShine } from "@/components/ui/button-shine"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import type { ProductAttribute } from "@/features/public/productAttributes/types"
import { createCustomer } from "@/features/public/customers/api/createCustomer"

type AttributeValue = {
    id: string
    name: string
    slug: string
    parentValueId?: string | null
    assets?: {
        id: string
        role: string
        url: string
    }[]
}

type Props = {
    attributes: ProductAttribute[]
    buttonClassName?: string
    buttonLabel?: string
    onDialogOpenChange?: (open: boolean) => void
}

const STEP_TITLES = [
    "Karşılama",
    "Sektör",
    "Üretim Grubu",
    "Kullanım Alanı",
    "İletişim",
]

const customerLeadSchema = z.object({
    sectorValueId: z.string().min(1, "Lütfen sektör seçin"),
    productionGroupValueId: z.string().min(1, "Lütfen üretim grubu seçin"),
    usageAreaValueIds: z.array(z.string()).default([]),
    companyName: z.string().trim().max(120, "Firma adı en fazla 120 karakter olabilir").optional().or(z.literal("")),
    fullName: z.string().trim().min(2, "Ad Soyad zorunludur"),
    phone: z.string().trim().min(7, "Telefon zorunludur"),
    email: z.string().trim().email("Geçerli bir e-posta girin"),
    note: z.string().trim().max(1000, "Not en fazla 1000 karakter olabilir").optional().or(z.literal("")),
})

type CustomerLeadFormValues = z.infer<typeof customerLeadSchema>

export default function CustomerLeadDialog({
    attributes,
    buttonClassName,
    buttonLabel = "Numune Talep Formu",
    onDialogOpenChange,
}: Props) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)
    const [usageQuery, setUsageQuery] = useState("")

    const form = useForm<CustomerLeadFormValues>({
        resolver: zodResolver(customerLeadSchema) as any,
        defaultValues: {
            sectorValueId: "",
            productionGroupValueId: "",
            usageAreaValueIds: [],
            companyName: "",
            fullName: "",
            phone: "",
            email: "",
            note: "",
        },
    })

    const attrsByCode = useMemo(
        () => new Map(attributes.map((attribute) => [attribute.code, attribute])),
        [attributes]
    )

    const sectorValues = useMemo(
        () => (attrsByCode.get("sector")?.values ?? []) as AttributeValue[],
        [attrsByCode]
    )

    const productionGroupValues = useMemo(
        () => (attrsByCode.get("production_group")?.values ?? []) as AttributeValue[],
        [attrsByCode]
    )

    const usageAreaValues = useMemo(
        () => (attrsByCode.get("usage_area")?.values ?? []) as AttributeValue[],
        [attrsByCode]
    )

    const selectedSectorId = form.watch("sectorValueId")
    const selectedProductionGroupId = form.watch("productionGroupValueId")
    const selectedUsageAreaIds = form.watch("usageAreaValueIds")

    const visibleProductionGroups = useMemo(() => {
        if (!selectedSectorId) return productionGroupValues
        return productionGroupValues.filter((value) => value.parentValueId === selectedSectorId)
    }, [productionGroupValues, selectedSectorId])

    const visibleUsageAreas = useMemo(() => {
        if (!selectedProductionGroupId) return usageAreaValues
        return usageAreaValues.filter((value) => value.parentValueId === selectedProductionGroupId)
    }, [usageAreaValues, selectedProductionGroupId])

    const filteredUsageAreas = useMemo(() => {
        const normalized = usageQuery.trim().toLowerCase()
        if (!normalized) return visibleUsageAreas
        return visibleUsageAreas.filter((value) => value.name.toLowerCase().includes(normalized))
    }, [usageQuery, visibleUsageAreas])

    function getValueImageUrl(value: AttributeValue) {
        if (!value.assets?.length) return null
        const primary = value.assets.find((asset) => asset.role === "PRIMARY")
        return primary?.url ?? value.assets[0]?.url ?? null
    }

    function resetState() {
        setStep(0)
        setUsageQuery("")
        form.reset()
    }

    function closeAndReset() {
        setOpen(false)
        resetState()
    }

    function toggleUsageArea(id: string) {
        const current = form.getValues("usageAreaValueIds")
        const next = current.includes(id)
            ? current.filter((value) => value !== id)
            : [...current, id]

        form.setValue("usageAreaValueIds", next, {
            shouldDirty: true,
            shouldTouch: true,
        })
    }

    async function nextStep() {
        if (step === 0) {
            setStep(1)
            return
        }

        if (step === 1) {
            const isValid = await form.trigger("sectorValueId")
            if (!isValid) return
            setStep(2)
            return
        }

        if (step === 2) {
            const isValid = await form.trigger("productionGroupValueId")
            if (!isValid) return
            setStep(3)
            return
        }

        if (step === 3) {
            setStep(4)
        }
    }

    function prevStep() {
        if (step === 0) return
        setStep((current) => (current - 1) as 0 | 1 | 2 | 3 | 4)
    }

    const onSubmit = form.handleSubmit(async (values) => {
        try {
            await createCustomer({
                companyName: values.companyName?.trim() || undefined,
                fullName: values.fullName.trim(),
                phone: values.phone.trim(),
                email: values.email.trim(),
                note: values.note?.trim() || undefined,
                sectorValueId: values.sectorValueId || undefined,
                productionGroupValueId: values.productionGroupValueId || undefined,
                usageAreaValueIds: values.usageAreaValueIds,
            })

            toast.success("Bilgileriniz kaydedildi. En kısa sürede iletişime geçeceğiz.")
            closeAndReset()
        } catch {
            toast.error("Kayıt sırasında bir hata oluştu")
        }
    })

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value)
                onDialogOpenChange?.(value)
                if (!value) resetState()
            }}
        >
            <motion.div
                className="relative"
                animate={{
                    y: [0, -2, 0],
                    boxShadow: [
                        "0 0 0 0 rgba(0,0,0,0)",
                        "0 10px 28px -14px color-mix(in oklch, var(--color-brand), black 22%)",
                        "0 0 0 0 rgba(0,0,0,0)",
                    ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
                <span className="pointer-events-none absolute -inset-0.5 rounded-full bg-[var(--color-brand)]/20 blur-sm" />
                <ButtonShine
                    onClick={() => setOpen(true)}
                    className={cn(
                        "relative z-10 h-10 rounded-full border border-[var(--color-brand)]/30 px-4 text-xs font-semibold md:text-sm",
                        buttonClassName
                    )}
                >
                    <span className="inline-flex items-center gap-2">
                        <Factory className="h-4 w-4 text-white" />
                        {buttonLabel}
                    </span>
                </ButtonShine>
            </motion.div>

            <DialogContent
                showCloseButton={false}
                className="w-[min(760px,calc(100vw-1.25rem))] h-[min(84vh,700px)] overflow-hidden p-0 rounded-2xl border-neutral-200"
            >
                <DialogTitle className="sr-only">Numune Talep Formu</DialogTitle>

                <div className="flex h-full flex-col">
                    <div className="bg-gradient-to-r from-[var(--color-brand)] to-[color-mix(in_oklch,var(--color-brand),black_15%)] px-6 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold">Numune Talep Formu</p>
                                    <p className="text-xs text-white/80">{STEP_TITLES[step]}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeAndReset}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/20 hover:bg-white/30"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-1">
                            {[0, 1, 2, 3, 4].map((index) => (
                                <div key={index} className="h-1 rounded-full bg-white/25">
                                    <motion.div
                                        className="h-full rounded-full bg-white"
                                        animate={{ width: step >= index ? "100%" : "0%" }}
                                        transition={{ duration: 0.25 }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Form {...form}>
                        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
                            <div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
                                <AnimatePresence mode="wait">
                                    {step === 0 && (
                                        <motion.div
                                            key="welcome"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex h-full flex-col items-center justify-center text-center space-y-7"
                                        >
                                            <motion.div
                                                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                                className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-50 shadow-sm border border-neutral-100"
                                            >
                                                <div className="absolute inset-0 bg-brand/5 rounded-3xl blur-xl" />
                                                <Factory className="w-11 h-11 text-brand relative z-10" />
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg shadow-yellow-200"
                                                >
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </motion.div>
                                            </motion.div>

                                            <div className="space-y-3 max-w-l">
                                                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
                                                    Merhaba <span className="inline-block animate-bounce">👋</span>
                                                </h2>
                                                <p className="text-base text-neutral-600 leading-relaxed">
                                                    Ceyhunlar Plastik olarak geliştirdiğimiz bu platform ile sektörünüze özel ürünlere tek noktadan ulaşmanızı, ihtiyaçlarınıza en uygun çözümleri detaylı şekilde incelemenizi ve numune taleplerinizi pratik bir şekilde oluşturmanızı hedefliyoruz.
                                                </p>
                                                <p className="text-base text-neutral-600 leading-relaxed">
                                                    Amacımız; karar süreçlerinizi hızlandıran, güvenilir ve kullanıcı odaklı bir deneyim sunmaktır.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 1 && (
                                        <motion.div
                                            key="sector"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
                                        >
                                            <div>
                                                <h3 className="text-lg font-semibold">Faaliyet sektörünüzü seçin</h3>
                                                <p className="text-sm text-neutral-500">Tek seçim yapın.</p>
                                            </div>

                                            <ScrollArea
                                                type="always"
                                                scrollHideDelay={0}
                                                className="h-[390px] rounded-lg border border-neutral-200/70 p-2 pr-3"
                                            >
                                                <div className="grid grid-cols-2 gap-2 pb-2 md:grid-cols-3 lg:grid-cols-4">
                                                    {sectorValues.map((value) => (
                                                        <button
                                                            key={value.id}
                                                            type="button"
                                                            onClick={() => {
                                                                form.setValue("sectorValueId", value.id, {
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                    shouldValidate: true,
                                                                })
                                                                form.setValue("productionGroupValueId", "", {
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                })
                                                                form.setValue("usageAreaValueIds", [], {
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                })
                                                            }}
                                                            className={cn(
                                                                "group overflow-hidden rounded-xl border text-left text-sm transition",
                                                                selectedSectorId === value.id
                                                                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)] shadow-sm"
                                                                    : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                                                            )}
                                                        >
                                                            <div className="relative aspect-[4/3] w-full bg-neutral-100">
                                                                {getValueImageUrl(value) ? (
                                                                    <Image
                                                                        src={getValueImageUrl(value)!}
                                                                        alt={value.name}
                                                                        fill
                                                                        loading="lazy"
                                                                        sizes="(max-width: 768px) 45vw, (max-width: 1200px) 28vw, 20vw"
                                                                        className="object-cover transition duration-300 group-hover:scale-105"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                                                                        Görsel yok
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="px-3 py-2">
                                                                <p className="line-clamp-2 text-xs font-medium sm:text-sm">{value.name}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </ScrollArea>

                                            <FormField
                                                control={form.control}
                                                name="sectorValueId"
                                                render={() => (
                                                    <FormItem>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="production"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
                                        >
                                            <p className="text-sm font-medium">2. Üretim grubunuzu seçin</p>
                                            <ScrollArea type="always" className="min-h-0 flex-1 rounded-lg border p-2 pr-3">
                                                <div className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2">
                                                    {visibleProductionGroups.map((value) => (
                                                        <button
                                                            key={value.id}
                                                            type="button"
                                                            onClick={() => {
                                                                form.setValue("productionGroupValueId", value.id, {
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                    shouldValidate: true,
                                                                })
                                                                form.setValue("usageAreaValueIds", [], {
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                })
                                                            }}
                                                            className={cn(
                                                                "rounded-lg border px-3 py-2 text-left text-sm transition",
                                                                selectedProductionGroupId === value.id
                                                                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                                                                    : "border-neutral-200 hover:border-neutral-300"
                                                            )}
                                                        >
                                                            {value.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                            <FormField
                                                control={form.control}
                                                name="productionGroupValueId"
                                                render={() => (
                                                    <FormItem>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="usage-area"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
                                        >
                                            <p className="text-sm font-medium">3. Kullanım alanlarınızı seçin (birden fazla olabilir)</p>
                                            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
                                                <div className="border-b p-2">
                                                    <Input
                                                        value={usageQuery}
                                                        onChange={(e) => setUsageQuery(e.target.value)}
                                                        placeholder="Kullanım alanı ara..."
                                                    />
                                                </div>

                                                <ScrollArea type="always" className="h-[320px] p-2 pr-3">
                                                    {filteredUsageAreas.length === 0 ? (
                                                        <div className="py-8 text-center text-sm text-neutral-500">Sonuç bulunamadı.</div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {filteredUsageAreas.map((value) => (
                                                                <div
                                                                    key={value.id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => toggleUsageArea(value.id)}
                                                                    onKeyDown={(event) => {
                                                                        if (event.key === "Enter" || event.key === " ") {
                                                                            event.preventDefault()
                                                                            toggleUsageArea(value.id)
                                                                        }
                                                                    }}
                                                                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40"
                                                                >
                                                                    <span>{value.name}</span>
                                                                    <span
                                                                        aria-hidden
                                                                        className={cn(
                                                                            "inline-flex h-4 w-4 items-center justify-center rounded border transition",
                                                                            selectedUsageAreaIds.includes(value.id)
                                                                                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                                                                                : "border-neutral-300 bg-white"
                                                                        )}
                                                                    >
                                                                        {selectedUsageAreaIds.includes(value.id) && (
                                                                            <Check className="h-3 w-3" />
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 4 && (
                                        <motion.div
                                            key="contact"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="grid gap-3"
                                        >
                                            <p className="text-sm font-medium">4. İletişim bilgilerinizi doldurun</p>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="companyName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Building2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                                                                    <Input {...field} placeholder="Firma adı (opsiyonel)" className="pl-9" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="fullName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <User2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                                                                    <Input {...field} placeholder="Ad Soyad *" className="pl-9" />
                                                                </div>
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
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                                                                    <Input {...field} placeholder="Telefon *" className="pl-9" />
                                                                </div>
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
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                                                                    <Input {...field} placeholder="E-posta *" type="email" className="pl-9" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="note"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <MessageSquare className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                                                                <Textarea
                                                                    {...field}
                                                                    placeholder="Notunuz / Numune talebiniz"
                                                                    rows={5}
                                                                    className="pl-9"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between border-t px-6 py-4">
                                {step === 0 ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={closeAndReset}
                                            disabled={form.formState.isSubmitting}
                                        >
                                            Daha Sonra
                                        </Button>
                                        <Button type="button" onClick={nextStep} className="bg-[var(--color-brand)] text-white">
                                            Başlayalım
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={prevStep}
                                            disabled={form.formState.isSubmitting}
                                        >
                                            Geri
                                        </Button>

                                        {step < 4 ? (
                                            <Button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={form.formState.isSubmitting}
                                                className="bg-[var(--color-brand)] text-white"
                                            >
                                                Devam Et
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[var(--color-brand)] text-white">
                                                {form.formState.isSubmitting ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <Spinner className="h-4 w-4" />
                                                        Kaydediliyor...
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Bilgileri Gönder
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
