"use client"

import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { formatColorLabel } from "@/lib/color/formatColorLabel"

import { useCreateProductVariant } from "@/features/admin/productVariants/hooks/useCreateProductVariant"
import { useUpdateProductVariant } from "@/features/admin/productVariants/hooks/useUpdateProductVariant"
import { useCreateColorReference } from "@/features/admin/productVariants/hooks/useCreateColorReference"
import { useCreateMaterialReference } from "@/features/admin/productVariants/hooks/useCreateMaterialReference"
import { useCreateSupplierReference } from "@/features/admin/productVariants/hooks/useCreateSupplierReference"
import { useCreateMeasurementTypeReference } from "@/features/admin/productVariants/hooks/useCreateMeasurementTypeReference"

import type {
    ProductVariant,
    VariantReferences,
    ColorReference,
    MaterialReference,
    SupplierReference,
    MeasurementTypeReference,
} from "@/features/admin/productVariants/api/types"

const measurementSchema = z.object({
    measurementTypeId: z.string().min(1),
    value: z.string(),
    label: z.string(),
})

const variantSchema = z.object({
    name: z.string().min(1, "Varyant adı zorunludur"),
    versionCode: z.string().regex(/^V[0-9]+$/, "Versiyon kodu V<number> formatında olmalı (örn. V1)"),
    supplierCode: z.string().regex(/^[A-Z]$/, "Tedarikçi kodu tek büyük harf olmalı (örn. B)"),
    variantIndex: z.coerce.number().int().min(1, "Varyant indeksi en az 1 olmalı"),
    colorId: z.string().optional().default(""),
    materialIds: z.array(z.string()).default([]),
    supplierIds: z.array(z.string()).default([]),
    primarySupplierId: z.string().optional().default(""),
    supplierPricing: z.array(z.object({
        supplierId: z.string(),
        price: z.string().optional().default(""),
        currency: z.string().optional().default("TRY"),
    })).default([]),
    measurements: z.array(measurementSchema).default([]),
})

const measurementTypeCreateSchema = z.object({
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
    name: z.string().min(2, "Ölçü tipi adı gerekli"),
    baseUnit: z.string().min(1, "Birim gerekli"),
})

const colorCreateSchema = z.object({
    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
    code: z.string().min(3, "Kod en az 3 karakter olmalı").max(20, "Kod en fazla 20 karakter olabilir"),
    name: z.string().min(2, "Renk adı gerekli"),
    hex: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Hex formatı #RRGGBB olmalı"),
})

const materialCreateSchema = z.object({
    name: z.string().min(1, "Malzeme adı gerekli"),
    code: z.string().optional(),
})

const supplierCreateSchema = z.object({
    name: z.string().min(2, "Tedarikçi adı gerekli"),
    isActive: z.boolean().default(true),
})

type VariantFormValues = z.infer<typeof variantSchema>
type MeasurementTypeCreateValues = z.infer<typeof measurementTypeCreateSchema>
type ColorCreateValues = z.infer<typeof colorCreateSchema>
type MaterialCreateValues = z.infer<typeof materialCreateSchema>
type SupplierCreateValues = z.infer<typeof supplierCreateSchema>

type Props = {
    mode?: "create" | "edit"
    open: boolean
    onOpenChange: (v: boolean) => void
    productId: string
    productCode?: string
    references: VariantReferences
    variant?: ProductVariant | null
}

function parseDecimalLikeToString(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return String(value)
    if (typeof value === "string") return value

    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return ""

    if (exponent >= digits.length - 1) {
        const zeros = "0".repeat(exponent - (digits.length - 1))
        return `${sign}${digits}${zeros}`
    }

    if (exponent < 0) {
        const zeros = "0".repeat(Math.abs(exponent) - 1)
        return `${sign}0.${zeros}${digits}`
    }

    const intPart = digits.slice(0, exponent + 1)
    const fracPart = digits.slice(exponent + 1)
    return `${sign}${intPart}.${fracPart}`
}

function getDefaultValues(variant?: ProductVariant | null): VariantFormValues {
    const supplierPricing =
        variant?.variantSuppliers.map((supplier) => ({
            supplierId: supplier.supplier.id,
            price:
                supplier.price === undefined || supplier.price === null
                    ? ""
                    : parseDecimalLikeToString(supplier.price),
            currency: supplier.currency ?? "TRY",
        })) ?? []

    return {
        name: variant?.name ?? "",
        versionCode: variant?.versionCode ?? "V1",
        supplierCode: variant?.supplierCode ?? "",
        variantIndex: variant?.variantIndex ?? 1,
        colorId: variant?.color?.id ?? "",
        materialIds: variant?.materials.map((material) => material.id) ?? [],
        supplierIds:
            variant?.variantSuppliers.map((supplier) => supplier.supplier.id) ?? [],
        primarySupplierId:
            variant?.variantSuppliers.find((supplier) => supplier.isActive)?.supplier.id ?? "",
        supplierPricing,
        measurements:
            variant?.measurements.map((measurement) => ({
                measurementTypeId: measurement.measurementType.id,
                value:
                    (measurement.measurementType.code === "D" ||
                        measurement.measurementType.code === "M") &&
                        measurement.label
                        ? measurement.label
                        : String(measurement.value),
                label: measurement.label ?? "",
            })) ?? [],
    }
}

function parseMeasurementInput(
    rawValue: string,
    measurementCode?: string
): { value: number; normalizedLabel: string } | null {
    const normalized = rawValue.trim()
    if (!normalized) return null

    const isMetricThreadCode = measurementCode === "D" || measurementCode === "M"

    if (isMetricThreadCode) {
        const match = normalized.match(/^M?\s*(\d+(?:[.,]\d+)?)$/i)
        if (!match) return null

        const numericValue = Number(match[1].replace(",", "."))
        if (!Number.isFinite(numericValue)) return null

        return {
            value: numericValue,
            normalizedLabel: normalized.toUpperCase().startsWith("M")
                ? normalized.toUpperCase()
                : `M${match[1].replace(",", ".")}`,
        }
    }

    const numericValue = Number(normalized.replace(",", "."))
    if (!Number.isFinite(numericValue)) return null

    return {
        value: numericValue,
        normalizedLabel: normalized,
    }
}

function SingleCombobox<T extends { id: string; name: string }>({
    label,
    placeholder,
    value,
    onChange,
    items,
    onCreate,
    onPlusClick,
    getItemLabel,
}: {
    label: string
    placeholder: string
    value: T | null
    onChange: (item: T) => void
    items: T[]
    onCreate?: (name: string) => Promise<T>
    onPlusClick?: () => void
    getItemLabel?: (item: T) => string
}) {
    const [open, setOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [query, setQuery] = useState("")

    const getLabel = (item: T) => getItemLabel?.(item) ?? item.name
    const filtered = items.filter((item) =>
        getLabel(item).toLowerCase().includes(query.toLowerCase())
    )

    const handleCreate = async () => {
        if (!onCreate || !newName.trim()) return

        setCreating(true)

        try {
            const created = await onCreate(newName.trim())
            onChange(created)
            setNewName("")
            setQuery("")
            setOpen(false)
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-neutral-500">{label}</Label>
                {(onCreate || onPlusClick) && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                            if (onCreate) {
                                setOpen(true)
                                return
                            }
                            onPlusClick?.()
                        }}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal text-sm h-9"
                    >
                        {value ? getLabel(value) : (
                            <span className="text-neutral-400">{placeholder}</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Ara..."
                            value={query}
                            onValueChange={setQuery}
                        />

                        <CommandList>
                            <CommandEmpty className="py-2 text-sm text-center text-neutral-500">
                                Sonuç yok
                            </CommandEmpty>

                            <CommandGroup>
                                {filtered.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        onSelect={() => {
                                            onChange(item)
                                            setOpen(false)
                                            setQuery("")
                                        }}
                                    >
                                        <Check
                                            className={`mr-2 w-4 h-4 ${value?.id === item.id ? "opacity-100" : "opacity-0"
                                                }`}
                                        />
                                        {getLabel(item)}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {onCreate && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <div className="flex gap-1 px-2 py-1">
                                            <Input
                                                placeholder="Yeni ekle..."
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="h-7 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        void handleCreate()
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={() => void handleCreate()}
                                                disabled={creating || !newName.trim()}
                                            >
                                                {creating ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Plus className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function MultiCombobox<T extends { id: string; name: string }>({
    label,
    placeholder,
    value,
    onChange,
    items,
    onCreate,
    onPlusClick,
}: {
    label: string
    placeholder: string
    value: T[]
    onChange: (items: T[]) => void
    items: T[]
    onCreate?: (name: string) => Promise<T>
    onPlusClick?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [query, setQuery] = useState("")

    const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
    )

    const toggle = (item: T) => {
        const exists = value.find((selected) => selected.id === item.id)

        if (exists) {
            onChange(value.filter((selected) => selected.id !== item.id))
            return
        }

        onChange([...value, item])
    }

    const handleCreate = async () => {
        if (!onCreate || !newName.trim()) return

        setCreating(true)

        try {
            const created = await onCreate(newName.trim())
            onChange([...value, created])
            setNewName("")
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-neutral-500">{label}</Label>
                {(onCreate || onPlusClick) && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                            if (onCreate) {
                                setOpen(true)
                                return
                            }
                            onPlusClick?.()
                        }}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal text-sm h-auto min-h-[36px] flex-wrap gap-1 px-3 py-1.5"
                    >
                        {value.length === 0 ? (
                            <span className="text-neutral-400">{placeholder}</span>
                        ) : (
                            value.map((item) => (
                                <Badge
                                    key={item.id}
                                    variant="secondary"
                                    className="text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggle(item)
                                    }}
                                >
                                    {item.name}
                                    <X className="w-2.5 h-2.5 ml-1 cursor-pointer" />
                                </Badge>
                            ))
                        )}
                        <ChevronDown className="w-4 h-4 ml-auto shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Ara..."
                            value={query}
                            onValueChange={setQuery}
                        />

                        <CommandList>
                            <CommandEmpty className="py-2 text-sm text-center text-neutral-500">
                                Sonuç yok
                            </CommandEmpty>

                            <CommandGroup>
                                {filtered.map((item) => (
                                    <CommandItem key={item.id} onSelect={() => toggle(item)}>
                                        <Check
                                            className={`mr-2 w-4 h-4 ${value.find((selected) => selected.id === item.id)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                }`}
                                        />
                                        {item.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {onCreate && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <div className="flex gap-1 px-2 py-1">
                                            <Input
                                                placeholder="Yeni ekle..."
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="h-7 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        void handleCreate()
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={() => void handleCreate()}
                                                disabled={creating || !newName.trim()}
                                            >
                                                {creating ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Plus className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export function CreateVariantDialog({
    mode = "create",
    open,
    onOpenChange,
    productId,
    productCode,
    references,
    variant,
}: Props) {
    const createMutation = useCreateProductVariant(productId)
    const updateMutation = useUpdateProductVariant(productId)

    const createColorMutation = useCreateColorReference()
    const createMaterialMutation = useCreateMaterialReference()
    const createSupplierMutation = useCreateSupplierReference()
    const createMeasurementTypeMutation = useCreateMeasurementTypeReference()

    const [colorCreateOpen, setColorCreateOpen] = useState(false)
    const [materialCreateOpen, setMaterialCreateOpen] = useState(false)
    const [supplierCreateOpen, setSupplierCreateOpen] = useState(false)

    const [localReferences, setLocalReferences] = useState<VariantReferences>({
        colors: [],
        materials: [],
        suppliers: [],
        measurementTypes: [],
    })
    const [selectedMeasurementType, setSelectedMeasurementType] =
        useState<MeasurementTypeReference | null>(null)

    const form = useForm<VariantFormValues>({
        resolver: zodResolver(variantSchema) as any,
        defaultValues: getDefaultValues(variant),
    })

    const measurementTypeForm = useForm<MeasurementTypeCreateValues>({
        resolver: zodResolver(measurementTypeCreateSchema) as any,
        defaultValues: {
            code: "D",
            name: "",
            baseUnit: "mm",
        },
    })

    const colorCreateForm = useForm<ColorCreateValues>({
        resolver: zodResolver(colorCreateSchema) as any,
        defaultValues: {
            system: "CUSTOM",
            code: "",
            name: "",
            hex: "#000000",
        },
    })

    const materialCreateForm = useForm<MaterialCreateValues>({
        resolver: zodResolver(materialCreateSchema) as any,
        defaultValues: {
            name: "",
            code: "",
        },
    })

    const supplierCreateForm = useForm<SupplierCreateValues>({
        resolver: zodResolver(supplierCreateSchema) as any,
        defaultValues: {
            name: "",
            isActive: true,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "measurements",
    })

    const colorId = useWatch({ control: form.control, name: "colorId" })
    const materialIds = useWatch({ control: form.control, name: "materialIds" })
    const supplierIds = useWatch({ control: form.control, name: "supplierIds" })
    const primarySupplierId = useWatch({
        control: form.control,
        name: "primarySupplierId",
    })
    const supplierPricing = useWatch({
        control: form.control,
        name: "supplierPricing",
    })
    const measurements = useWatch({ control: form.control, name: "measurements" })
    const supplierCode = useWatch({ control: form.control, name: "supplierCode" })
    const versionCode = useWatch({ control: form.control, name: "versionCode" })
    const variantIndex = useWatch({ control: form.control, name: "variantIndex" })
    const measurementTypeCode = useWatch({
        control: measurementTypeForm.control,
        name: "code",
    })
    const colorCreateSystem = useWatch({
        control: colorCreateForm.control,
        name: "system",
    })
    const supplierCreateIsActive = useWatch({
        control: supplierCreateForm.control,
        name: "isActive",
    })

    useEffect(() => {
        if (!open) return

        form.reset(getDefaultValues(variant))
        measurementTypeForm.reset({
            code: "D",
            name: "",
            baseUnit: "mm",
        })
        colorCreateForm.reset({
            system: "CUSTOM",
            code: "",
            name: "",
            hex: "#000000",
        })
        materialCreateForm.reset({
            name: "",
            code: "",
        })
        supplierCreateForm.reset({
            name: "",
            isActive: true,
        })
    }, [
        open,
        variant,
        form,
        measurementTypeForm,
        colorCreateForm,
        materialCreateForm,
        supplierCreateForm,
    ])

    const referenceState = useMemo<VariantReferences>(() => {
        const mergeById = <T extends { id: string }>(base: T[], local: T[]) => {
            const map = new Map<string, T>()
            for (const item of base) map.set(item.id, item)
            for (const item of local) map.set(item.id, item)
            return Array.from(map.values())
        }

        const variantSuppliersAsReferences: SupplierReference[] =
            (variant?.variantSuppliers ?? []).map((item) => ({
                id: item.supplier.id,
                name: item.supplier.name,
                isActive: true,
            }))

        return {
            colors: mergeById(references.colors, localReferences.colors),
            materials: mergeById(references.materials, localReferences.materials),
            suppliers: mergeById(
                mergeById(references.suppliers, variantSuppliersAsReferences),
                localReferences.suppliers
            ),
            measurementTypes: mergeById(
                references.measurementTypes,
                localReferences.measurementTypes
            ),
        }
    }, [references, localReferences])

    const selectedColor =
        referenceState.colors.find((color) => color.id === colorId) ?? null

    const selectedMaterials = referenceState.materials.filter((material) =>
        (materialIds ?? []).includes(material.id)
    )

    const selectedSuppliers = referenceState.suppliers.filter((supplier) =>
        (supplierIds ?? []).includes(supplier.id)
    )

    const supplierPricingById = useMemo(() => {
        const map = new Map<string, { supplierId: string; price?: string; currency?: string }>()
        for (const item of supplierPricing ?? []) {
            map.set(item.supplierId, item)
        }
        return map
    }, [supplierPricing])

    const usedMeasurementTypeIds = new Set(
        (measurements ?? []).map((measurement) => measurement.measurementTypeId)
    )

    const availableMeasurementTypes = referenceState.measurementTypes.filter(
        (measurementType) => !usedMeasurementTypeIds.has(measurementType.id)
    )

    useEffect(() => {
        const selectedIds = supplierIds ?? []
        const current = form.getValues("supplierPricing") ?? []
        const next = selectedIds.map((supplierId) => {
            const existing = current.find((item) => item.supplierId === supplierId)
            return {
                supplierId,
                price: existing?.price ?? "",
                currency: existing?.currency ?? "TRY",
            }
        })

        form.setValue("supplierPricing", next, { shouldDirty: false })
    }, [form, supplierIds])

    const isEdit = mode === "edit" && Boolean(variant)
    const isSaving = createMutation.isPending || updateMutation.isPending
    const fullCodePreview = `${productCode ?? "ÜRÜN_KODU"}.${(supplierCode ?? "").toUpperCase()}.${(versionCode ?? "").toUpperCase()}.${variantIndex ?? ""}`

    const onCreateColor = colorCreateForm.handleSubmit(async (values) => {
        const created = await createColorMutation.mutateAsync(values)

        setLocalReferences((prev) => ({
            ...prev,
            colors: [...prev.colors, created],
        }))

        form.setValue("colorId", created.id, { shouldDirty: true })

        colorCreateForm.reset({
            system: "CUSTOM",
            code: "",
            name: "",
            hex: "#000000",
        })
        setColorCreateOpen(false)
    })

    const onCreateMaterial = materialCreateForm.handleSubmit(async (values) => {
        const created = await createMaterialMutation.mutateAsync({
            name: values.name,
            code: values.code || undefined,
        })

        setLocalReferences((prev) => ({
            ...prev,
            materials: [...prev.materials, created],
        }))

        const current = form.getValues("materialIds")
        if (!current.includes(created.id)) {
            form.setValue("materialIds", [...current, created.id], { shouldDirty: true })
        }

        materialCreateForm.reset({
            name: "",
            code: "",
        })
        setMaterialCreateOpen(false)
    })

    const onCreateSupplier = supplierCreateForm.handleSubmit(async (values) => {
        const created = await createSupplierMutation.mutateAsync(values)

        setLocalReferences((prev) => ({
            ...prev,
            suppliers: [...prev.suppliers, created],
        }))

        const current = form.getValues("supplierIds")
        if (!current.includes(created.id)) {
            const nextIds = [...current, created.id]
            form.setValue("supplierIds", nextIds, { shouldDirty: true })
            if (!form.getValues("primarySupplierId")) {
                form.setValue("primarySupplierId", created.id, { shouldDirty: true })
            }
        }

        supplierCreateForm.reset({
            name: "",
            isActive: true,
        })
        setSupplierCreateOpen(false)
    })

    function addMeasurementType(measurementType: MeasurementTypeReference) {
        append({
            measurementTypeId: measurementType.id,
            value: "",
            label: "",
        })
        setSelectedMeasurementType(null)
    }

    const onCreateMeasurementType = measurementTypeForm.handleSubmit(
        async (values) => {
            const created = await createMeasurementTypeMutation.mutateAsync({
                code: values.code,
                name: values.name,
                baseUnit: values.baseUnit,
                displayOrder: 0,
            })

            setLocalReferences((prev) => ({
                ...prev,
                measurementTypes: [...prev.measurementTypes, created],
            }))

            measurementTypeForm.reset({
                code: "D",
                name: "",
                baseUnit: "mm",
            })

            addMeasurementType(created)
        }
    )

    const onSubmit = form.handleSubmit(async (values) => {
        form.clearErrors("measurements")

        const parsedMeasurements: Array<{
            measurementTypeId: string
            value: number
            label: string
        }> = []

        for (const [index, measurement] of (values.measurements ?? []).entries()) {
            if (!measurement.value.trim()) continue

            const measurementType = referenceState.measurementTypes.find(
                (item) => item.id === measurement.measurementTypeId
            )

            const parsed = parseMeasurementInput(
                measurement.value,
                measurementType?.code
            )

            if (!parsed) {
                const isMetricThread =
                    measurementType?.code === "D" || measurementType?.code === "M"
                form.setError(`measurements.${index}.value`, {
                    type: "manual",
                    message: isMetricThread
                        ? "Bu ölçü tipi için M4, M8 gibi bir değer girin."
                        : "Geçerli bir sayısal değer girin.",
                })
                return
            }

            parsedMeasurements.push({
                measurementTypeId: measurement.measurementTypeId,
                value: parsed.value,
                label: measurement.label || parsed.normalizedLabel,
            })
        }

        const supplierPricingById = new Map(
            (values.supplierPricing ?? []).map((item) => [item.supplierId, item])
        )

        for (const supplierId of values.supplierIds) {
            const rawPrice = supplierPricingById.get(supplierId)?.price?.trim() ?? ""
            if (!rawPrice) continue

            const parsedPrice = Number(rawPrice.replace(",", "."))
            if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
                form.setError("supplierPricing", {
                    type: "manual",
                    message: "Tedarikçi fiyatları 0 veya pozitif sayı olmalıdır.",
                })
                return
            }
        }

        const payload = {
            productId,
            name: values.name,
            versionCode: values.versionCode.toUpperCase(),
            supplierCode: values.supplierCode.toUpperCase(),
            variantIndex: values.variantIndex,
            colorId: values.colorId || undefined,
            materialIds: values.materialIds,
            suppliers: values.supplierIds.map((id) => ({
                ...(() => {
                    const priceInput = supplierPricingById.get(id)?.price?.trim() ?? ""
                    const parsed = priceInput ? Number(priceInput.replace(",", ".")) : undefined
                    return {
                        ...(parsed !== undefined && Number.isFinite(parsed) ? { price: parsed } : {}),
                        ...(supplierPricingById.get(id)?.currency
                            ? { currency: supplierPricingById.get(id)?.currency?.toUpperCase() }
                            : {}),
                    }
                })(),
                id,
                isActive: (values.primarySupplierId || values.supplierIds[0] || "") === id,
            })),
            measurements: parsedMeasurements,
        }

        if (isEdit && variant) {
            await updateMutation.mutateAsync({
                id: variant.id,
                ...payload,
            })
        } else {
            await createMutation.mutateAsync(payload)
        }

        onOpenChange(false)
    })

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setSelectedMeasurementType(null)
                        setLocalReferences({
                            colors: [],
                            materials: [],
                            suppliers: [],
                            measurementTypes: [],
                        })
                    }
                    onOpenChange(nextOpen)
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? "Varyantı Güncelle" : "Yeni Varyant Oluştur"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={onSubmit} className="space-y-6 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label className="text-xs text-neutral-500">Varyant Adı *</Label>
                            <Input
                                placeholder="örn. Plastik Bilezik – 8mm"
                                {...form.register("name")}
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Versiyon Kodu *</Label>
                            <Input
                                placeholder="V1"
                                {...form.register("versionCode", {
                                    onChange: (e) => {
                                        form.setValue("versionCode", String(e.target.value).toUpperCase(), {
                                            shouldDirty: true,
                                        })
                                    },
                                })}
                            />
                            {form.formState.errors.versionCode && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.versionCode.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Tedarikçi Kodu *</Label>
                            <Input
                                placeholder="B"
                                maxLength={1}
                                {...form.register("supplierCode", {
                                    onChange: (e) => {
                                        const normalized = String(e.target.value).replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 1)
                                        form.setValue("supplierCode", normalized, {
                                            shouldDirty: true,
                                        })
                                    },
                                })}
                            />
                            {form.formState.errors.supplierCode && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.supplierCode.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Varyant İndeksi</Label>
                            <Input type="number" min="1" {...form.register("variantIndex")} />
                            {form.formState.errors.variantIndex && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.variantIndex.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <p className="text-[11px] text-neutral-500">Oluşacak Kod</p>
                        <p className="font-mono text-sm text-neutral-800">{fullCodePreview}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            Format: ÜrünKodu.TedarikçiKodu.Versiyon.VaryantIndex
                        </p>
                    </div>

                    <hr className="border-neutral-100" />

                    <SingleCombobox<ColorReference>
                        label="Renk"
                        placeholder="Renk seç veya oluştur..."
                        value={selectedColor}
                        onChange={(color) => {
                            form.setValue("colorId", color.id, { shouldDirty: true })
                        }}
                        items={referenceState.colors}
                        onPlusClick={() => setColorCreateOpen(true)}
                        getItemLabel={(color) => formatColorLabel(color)}
                    />

                    <MultiCombobox<MaterialReference>
                        label="Ham Maddeler"
                        placeholder="Ham madde seç veya oluştur..."
                        value={selectedMaterials}
                        onChange={(items) => {
                            form.setValue(
                                "materialIds",
                                items.map((item) => item.id),
                                { shouldDirty: true }
                            )
                        }}
                        items={referenceState.materials}
                        onPlusClick={() => setMaterialCreateOpen(true)}
                    />

                    <MultiCombobox<SupplierReference>
                        label="Tedarikçiler"
                        placeholder="Tedarikçi seç veya oluştur..."
                        value={selectedSuppliers}
                        onChange={(items) => {
                            const nextIds = items.map((item) => item.id)
                            const currentPrimary = form.getValues("primarySupplierId") || ""
                            const resolvedPrimary =
                                nextIds.includes(currentPrimary) ? currentPrimary : (nextIds[0] ?? "")

                            form.setValue(
                                "supplierIds",
                                nextIds,
                                { shouldDirty: true }
                            )
                            form.setValue("primarySupplierId", resolvedPrimary, { shouldDirty: true })
                        }}
                        items={referenceState.suppliers}
                        onPlusClick={() => setSupplierCreateOpen(true)}
                    />

                    {selectedSuppliers.length > 0 && (
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Kodda kullanılacak tedarikçi</Label>
                            <select
                                value={primarySupplierId || ""}
                                onChange={(e) =>
                                    form.setValue("primarySupplierId", e.target.value, {
                                        shouldDirty: true,
                                    })
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {selectedSuppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-neutral-500">
                                Bu seçim backend&apos;de aktif tedarikçiyi belirler.
                            </p>
                        </div>
                    )}

                    {selectedSuppliers.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs text-neutral-500">Tedarikçi Fiyatları</Label>
                            <div className="rounded-lg border border-neutral-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600">Tedarikçi</th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600 w-40">Fiyat</th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600 w-32">Para Birimi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedSuppliers.map((supplier) => {
                                            const pricing = supplierPricingById.get(supplier.id)
                                            return (
                                                <tr key={supplier.id} className="border-t border-neutral-100">
                                                    <td className="px-3 py-2 text-neutral-700">{supplier.name}</td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            placeholder="örn. 3.10"
                                                            value={pricing?.price ?? ""}
                                                            onChange={(e) => {
                                                                const normalized = e.target.value.replace(",", ".")
                                                                form.setValue(
                                                                    "supplierPricing",
                                                                    (form.getValues("supplierPricing") ?? []).map((item) =>
                                                                        item.supplierId === supplier.id
                                                                            ? { ...item, price: normalized }
                                                                            : item
                                                                    ),
                                                                    { shouldDirty: true }
                                                                )
                                                            }}
                                                            className="h-8"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={pricing?.currency ?? "TRY"}
                                                            onChange={(e) => {
                                                                form.setValue(
                                                                    "supplierPricing",
                                                                    (form.getValues("supplierPricing") ?? []).map((item) =>
                                                                        item.supplierId === supplier.id
                                                                            ? { ...item, currency: e.target.value }
                                                                            : item
                                                                    ),
                                                                    { shouldDirty: true }
                                                                )
                                                            }}
                                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                                                        >
                                                            <option value="TRY">TRY</option>
                                                            <option value="USD">USD</option>
                                                            <option value="EUR">EUR</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[11px] text-neutral-500">
                                Boş bırakılan fiyatlar API&apos;ye gönderilmez. Girilen değerler tedarikçi-varyant fiyatına kaydedilir.
                            </p>
                            {form.formState.errors.supplierPricing?.message && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.supplierPricing.message}
                                </p>
                            )}
                        </div>
                    )}

                    <hr className="border-neutral-100" />

                    <div className="space-y-3">
                        <Label className="text-xs text-neutral-500">Ölçüler</Label>

                        {fields.length > 0 && (
                            <div className="rounded-lg border border-neutral-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600 w-1/3">
                                                Ölçü Tipi
                                            </th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600 w-1/4">
                                                Değer
                                            </th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600">
                                                Etiket
                                            </th>
                                            <th className="w-8" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field, index) => {
                                            const measurementType =
                                                referenceState.measurementTypes.find(
                                                    (item) => item.id === field.measurementTypeId
                                                )

                                            return (
                                                <tr key={field.id} className="border-t border-neutral-100">
                                                    <td className="px-3 py-2">
                                                        <span className="font-medium text-neutral-700">
                                                            {measurementType?.code ?? "-"}
                                                        </span>
                                                        <span className="ml-1 text-xs text-neutral-400">
                                                            ({measurementType?.baseUnit ?? ""})
                                                        </span>
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        {form.formState.errors.measurements?.[index]?.value && (
                                                            <p className="mb-1 text-[11px] text-red-500">
                                                                {form.formState.errors.measurements[index]?.value?.message}
                                                            </p>
                                                        )}
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            placeholder={
                                                                measurementType?.code === "D" || measurementType?.code === "M"
                                                                    ? "örn. M8"
                                                                    : "örn. 20"
                                                            }
                                                            {...form.register(`measurements.${index}.value`)}
                                                            className="h-7 w-24 text-sm"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <Input
                                                            placeholder="örn. 8mm"
                                                            {...form.register(`measurements.${index}.label`)}
                                                            className="h-7 text-sm"
                                                        />
                                                    </td>

                                                    <td className="px-1 py-2">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-neutral-400 hover:text-red-500"
                                                            onClick={() => remove(index)}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <SingleCombobox<MeasurementTypeReference>
                            label="Mevcut Ölçü Tipi Ekle"
                            placeholder="Ölçü tipi seç..."
                            value={selectedMeasurementType}
                            onChange={(measurementType) => {
                                addMeasurementType(measurementType)
                            }}
                            items={availableMeasurementTypes}
                        />

                        <div className="rounded-lg border border-neutral-200 p-3 space-y-3">
                            <div className="text-xs font-medium text-neutral-600">
                                Yeni ölçü tipi oluştur
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-neutral-500">Kod</Label>
                                    <select
                                        value={measurementTypeCode}
                                        onChange={(e) =>
                                            measurementTypeForm.setValue(
                                                "code",
                                                e.target.value as MeasurementTypeCreateValues["code"],
                                                { shouldDirty: true }
                                            )
                                        }
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="D">D</option>
                                        <option value="D1">D1</option>
                                        <option value="D2">D2</option>
                                        <option value="R">R</option>
                                        <option value="R1">R1</option>
                                        <option value="R2">R2</option>
                                        <option value="L">L</option>
                                        <option value="L1">L1</option>
                                        <option value="L2">L2</option>
                                        <option value="T">T</option>
                                        <option value="A">A</option>
                                        <option value="W">W</option>
                                        <option value="H">H</option>
                                        <option value="H1">H1</option>
                                        <option value="H2">H2</option>
                                        <option value="PT">PT</option>
                                        <option value="M">M</option>
                                        <option value="R_L">R_L</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-neutral-500">Ad</Label>
                                    <Input
                                        placeholder="örn. Çap"
                                        {...measurementTypeForm.register("name")}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-neutral-500">Birim</Label>
                                    <Input
                                        placeholder="mm"
                                        {...measurementTypeForm.register("baseUnit")}
                                    />
                                </div>
                            </div>

                            {(measurementTypeForm.formState.errors.name ||
                                measurementTypeForm.formState.errors.baseUnit) && (
                                    <div className="space-y-1">
                                        {measurementTypeForm.formState.errors.name && (
                                            <p className="text-xs text-red-500">
                                                {measurementTypeForm.formState.errors.name.message}
                                            </p>
                                        )}
                                        {measurementTypeForm.formState.errors.baseUnit && (
                                            <p className="text-xs text-red-500">
                                                {measurementTypeForm.formState.errors.baseUnit.message}
                                            </p>
                                        )}
                                    </div>
                                )}

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void onCreateMeasurementType()}
                                    disabled={createMeasurementTypeMutation.isPending}
                                >
                                    {createMeasurementTypeMutation.isPending && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    )}
                                    Ölçü Tipi Oluştur
                                </Button>
                            </div>
                        </div>
                    </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                            >
                                İptal
                            </Button>

                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isEdit ? "Varyantı Güncelle" : "Varyant Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={colorCreateOpen} onOpenChange={setColorCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeni Renk Oluştur</DialogTitle>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={(e) => void onCreateColor(e)}>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Sistem</Label>
                            <select
                                value={colorCreateSystem}
                                onChange={(e) =>
                                    colorCreateForm.setValue(
                                        "system",
                                        e.target.value as ColorCreateValues["system"],
                                        { shouldDirty: true }
                                    )
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="CUSTOM">CUSTOM</option>
                                <option value="RAL">RAL</option>
                                <option value="PANTONE">PANTONE</option>
                                <option value="NCS">NCS</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Kod</Label>
                            <Input placeholder="örn. 9005" {...colorCreateForm.register("code")} />
                            {colorCreateForm.formState.errors.code && (
                                <p className="text-xs text-red-500">{colorCreateForm.formState.errors.code.message}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Ad</Label>
                            <Input placeholder="örn. Siyah" {...colorCreateForm.register("name")} />
                            {colorCreateForm.formState.errors.name && (
                                <p className="text-xs text-red-500">{colorCreateForm.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Hex</Label>
                            <Input placeholder="#000000" {...colorCreateForm.register("hex")} />
                            {colorCreateForm.formState.errors.hex && (
                                <p className="text-xs text-red-500">{colorCreateForm.formState.errors.hex.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setColorCreateOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={createColorMutation.isPending}>
                                {createColorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Oluştur
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={materialCreateOpen} onOpenChange={setMaterialCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeni Malzeme Oluştur</DialogTitle>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={(e) => void onCreateMaterial(e)}>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Ad</Label>
                            <Input placeholder="örn. Polipropilen" {...materialCreateForm.register("name")} />
                            {materialCreateForm.formState.errors.name && (
                                <p className="text-xs text-red-500">{materialCreateForm.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Kod (Opsiyonel)</Label>
                            <Input placeholder="örn. PP" {...materialCreateForm.register("code")} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setMaterialCreateOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={createMaterialMutation.isPending}>
                                {createMaterialMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Oluştur
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={supplierCreateOpen} onOpenChange={setSupplierCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeni Tedarikçi Oluştur</DialogTitle>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={(e) => void onCreateSupplier(e)}>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Ad</Label>
                            <Input placeholder="örn. Örnek Tedarikçi" {...supplierCreateForm.register("name")} />
                            {supplierCreateForm.formState.errors.name && (
                                <p className="text-xs text-red-500">{supplierCreateForm.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Durum</Label>
                            <select
                                value={supplierCreateIsActive ? "active" : "inactive"}
                                onChange={(e) =>
                                    supplierCreateForm.setValue("isActive", e.target.value === "active", {
                                        shouldDirty: true,
                                    })
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Pasif</option>
                            </select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSupplierCreateOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={createSupplierMutation.isPending}>
                                {createSupplierMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Oluştur
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
