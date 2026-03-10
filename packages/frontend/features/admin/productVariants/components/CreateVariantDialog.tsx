"use client";

import { useState } from "react";
import { Plus, Loader2, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { adminApiClient } from "@/lib/http/client";
import type { ProductVariant } from "@/features/admin/productVariants/server/getProductVariants";
import type {
    VariantReferences,
    Color,
    Material,
    Supplier,
    MeasurementType,
} from "@/features/admin/productVariants/server/getVariantReferences";

interface MeasurementEntry {
    measurementType: MeasurementType;
    value: string;
    label: string;
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    productId: string;
    references: VariantReferences;
    onCreated: (variant: ProductVariant) => void;
}

// ---------- small inline Combobox helper ----------
function SingleCombobox<T extends { id: string; name: string }>({
    label,
    placeholder,
    value,
    onChange,
    items,
    onCreate,
}: {
    label: string;
    placeholder: string;
    value: T | null;
    onChange: (item: T) => void;
    items: T[];
    onCreate?: (name: string) => Promise<T>;
}) {
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [localItems, setLocalItems] = useState<T[]>(items);
    const [query, setQuery] = useState("");

    const filtered = localItems.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleCreate = async () => {
        if (!onCreate || !newName.trim()) return;
        setCreating(true);
        try {
            const created = await onCreate(newName.trim());
            setLocalItems(prev => [...prev, created]);
            onChange(created);
            setNewName("");
            setOpen(false);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-1">
            <Label className="text-xs text-neutral-500">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal text-sm h-9"
                    >
                        {value?.name ?? <span className="text-neutral-400">{placeholder}</span>}
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
                                {filtered.map(item => (
                                    <CommandItem
                                        key={item.id}
                                        onSelect={() => {
                                            onChange(item);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                    >
                                        <Check className={`mr-2 w-4 h-4 ${value?.id === item.id ? "opacity-100" : "opacity-0"}`} />
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
                                                onChange={e => setNewName(e.target.value)}
                                                className="h-7 text-sm"
                                                onKeyDown={e => e.key === "Enter" && handleCreate()}
                                            />
                                            <Button
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={handleCreate}
                                                disabled={creating || !newName.trim()}
                                            >
                                                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
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
    );
}

// ---------- Multi-select combobox ----------
function MultiCombobox<T extends { id: string; name: string }>({
    label,
    placeholder,
    value,
    onChange,
    items,
    onCreate,
}: {
    label: string;
    placeholder: string;
    value: T[];
    onChange: (items: T[]) => void;
    items: T[];
    onCreate?: (name: string) => Promise<T>;
}) {
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [localItems, setLocalItems] = useState<T[]>(items);
    const [query, setQuery] = useState("");

    const filtered = localItems.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase())
    );

    const toggle = (item: T) => {
        const exists = value.find(v => v.id === item.id);
        if (exists) {
            onChange(value.filter(v => v.id !== item.id));
        } else {
            onChange([...value, item]);
        }
    };

    const handleCreate = async () => {
        if (!onCreate || !newName.trim()) return;
        setCreating(true);
        try {
            const created = await onCreate(newName.trim());
            setLocalItems(prev => [...prev, created]);
            onChange([...value, created]);
            setNewName("");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-1">
            <Label className="text-xs text-neutral-500">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal text-sm h-auto min-h-[36px] flex-wrap gap-1 px-3 py-1.5"
                    >
                        {value.length === 0 ? (
                            <span className="text-neutral-400">{placeholder}</span>
                        ) : (
                            value.map(v => (
                                <Badge
                                    key={v.id}
                                    variant="secondary"
                                    className="text-xs"
                                    onClick={e => {
                                        e.stopPropagation();
                                        toggle(v);
                                    }}
                                >
                                    {v.name}
                                    <X className="w-2.5 h-2.5 ml-1 cursor-pointer" />
                                </Badge>
                            ))
                        )}
                        <ChevronDown className="w-4 h-4 ml-auto shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Ara..." value={query} onValueChange={setQuery} />
                        <CommandList>
                            <CommandEmpty className="py-2 text-sm text-center text-neutral-500">Sonuç yok</CommandEmpty>
                            <CommandGroup>
                                {filtered.map(item => (
                                    <CommandItem key={item.id} onSelect={() => toggle(item)}>
                                        <Check className={`mr-2 w-4 h-4 ${value.find(v => v.id === item.id) ? "opacity-100" : "opacity-0"}`} />
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
                                                onChange={e => setNewName(e.target.value)}
                                                className="h-7 text-sm"
                                                onKeyDown={e => e.key === "Enter" && handleCreate()}
                                            />
                                            <Button
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={handleCreate}
                                                disabled={creating || !newName.trim()}
                                            >
                                                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
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
    );
}

// ---------- Main Dialog ----------
export function CreateVariantDialog({ open, onOpenChange, productId, references, onCreated }: Props) {
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [versionCode, setVersionCode] = useState("A");
    const [supplierCode, setSupplierCode] = useState("");
    const [variantIndex, setVariantIndex] = useState("1");
    const [color, setColor] = useState<Color | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
    const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementType | null>(null);

    const reset = () => {
        setName(""); setVersionCode("A"); setSupplierCode(""); setVariantIndex("1");
        setColor(null); setMaterials([]); setSuppliers([]); setMeasurements([]);
        setSelectedMeasurementType(null);
    };

    const handleClose = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    const addMeasurement = (mt: MeasurementType) => {
        if (!measurements.find(m => m.measurementType.id === mt.id)) {
            setMeasurements(prev => [...prev, { measurementType: mt, value: "", label: "" }]);
        }
        setSelectedMeasurementType(null);
    };

    const removeMeasurement = (id: string) => {
        setMeasurements(prev => prev.filter(m => m.measurementType.id !== id));
    };

    const updateMeasurement = (id: string, field: "value" | "label", val: string) => {
        setMeasurements(prev =>
            prev.map(m => m.measurementType.id === id ? { ...m, [field]: val } : m)
        );
    };

    // Inline create helpers
    const createColor = async (name: string): Promise<Color> => {
        const hexCode = `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")}`;
        const res = await adminApiClient.post<any>("/colors", { name, hexCode });
        return res.data.payload.color;
    };

    const createMaterial = async (name: string): Promise<Material> => {
        const res = await adminApiClient.post<any>("/materials", { name });
        return res.data.payload.material;
    };

    const createSupplier = async (name: string): Promise<Supplier> => {
        const code = name.slice(0, 3).toUpperCase();
        const res = await adminApiClient.post<any>("/suppliers", { name, code });
        return res.data.payload.supplier;
    };

    const createMeasurementType = async (name: string): Promise<MeasurementType> => {
        const code = name.slice(0, 4).toUpperCase().replace(/\s/g, "_");
        const res = await adminApiClient.post<any>("/measurement-types", {
            name,
            code,
            baseUnit: "mm",
            displayOrder: 999,
        });
        return res.data.payload.measurementType;
    };

    const handleSave = async () => {
        if (!name.trim() || !supplierCode.trim()) return;
        setSaving(true);
        try {
            const body: any = {
                productId,
                name,
                versionCode,
                supplierCode,
                variantIndex: parseInt(variantIndex) || 1,
                colorId: color?.id,
                materialIds: materials.map(m => m.id),
                suppliers: suppliers.map(s => ({ id: s.id, isActive: false })),
                measurements: measurements
                    .filter(m => m.value !== "")
                    .map(m => ({
                        measurementTypeId: m.measurementType.id,
                        value: parseFloat(m.value),
                        label: m.label || String(m.value),
                    })),
            };

            const res = await adminApiClient.post<any>("/product-variants", body);
            const variant = res.data.payload.productVariant;

            // Refetch variant with full relations
            const full = await adminApiClient.get<any>(`/product-variants/${variant.id}`);
            onCreated(full.data.payload.productVariant);
            reset();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Varyant oluşturulamadı.");
        } finally {
            setSaving(false);
        }
    };

    const availableMeasurementTypes = references.measurementTypes.filter(
        mt => !measurements.find(m => m.measurementType.id === mt.id)
    );

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Yeni Varyant Oluştur</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Basic fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label className="text-xs text-neutral-500">Varyant Adı *</Label>
                            <Input
                                placeholder="örn. Plastik Bilezik – 8mm"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Versiyon Kodu *</Label>
                            <Input placeholder="A" value={versionCode} onChange={e => setVersionCode(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Tedarikçi Kodu *</Label>
                            <Input placeholder="örn. 9" value={supplierCode} onChange={e => setSupplierCode(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-500">Varyant İndex</Label>
                            <Input type="number" min="1" value={variantIndex} onChange={e => setVariantIndex(e.target.value)} />
                        </div>
                    </div>

                    <hr className="border-neutral-100" />

                    {/* Color */}
                    <SingleCombobox<Color>
                        label="Renk"
                        placeholder="Renk seç veya oluştur..."
                        value={color}
                        onChange={setColor}
                        items={references.colors}
                        onCreate={createColor}
                    />

                    {/* Materials */}
                    <MultiCombobox<Material>
                        label="Ham Maddeler"
                        placeholder="Ham madde seç veya oluştur..."
                        value={materials}
                        onChange={setMaterials}
                        items={references.materials}
                        onCreate={createMaterial}
                    />

                    {/* Suppliers */}
                    <MultiCombobox<Supplier>
                        label="Tedarikçiler"
                        placeholder="Tedarikçi seç veya oluştur..."
                        value={suppliers}
                        onChange={setSuppliers}
                        items={references.suppliers}
                        onCreate={createSupplier}
                    />

                    <hr className="border-neutral-100" />

                    {/* Measurements */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-neutral-500">Ölçüler</Label>
                        </div>

                        {measurements.length > 0 && (
                            <div className="rounded-lg border border-neutral-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600 w-1/3">Ölçü Tipi</th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600 w-1/4">Değer</th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-600">Etiket (opsiyonel)</th>
                                            <th className="w-8" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {measurements.map(m => (
                                            <tr key={m.measurementType.id} className="border-t border-neutral-100">
                                                <td className="px-3 py-2">
                                                    <span className="font-medium text-neutral-700">{m.measurementType.code}</span>
                                                    <span className="ml-1 text-xs text-neutral-400">({m.measurementType.baseUnit})</span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0"
                                                        value={m.value}
                                                        onChange={e => updateMeasurement(m.measurementType.id, "value", e.target.value)}
                                                        className="h-7 w-24 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        placeholder={m.value || "örn. 8mm"}
                                                        value={m.label}
                                                        onChange={e => updateMeasurement(m.measurementType.id, "label", e.target.value)}
                                                        className="h-7 text-sm"
                                                    />
                                                </td>
                                                <td className="px-1 py-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-neutral-400 hover:text-red-500"
                                                        onClick={() => removeMeasurement(m.measurementType.id)}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Add measurement type */}
                        <SingleCombobox<MeasurementType>
                            label="Ölçü Tipi Ekle"
                            placeholder="Ölçü tipi seç veya oluştur..."
                            value={selectedMeasurementType}
                            onChange={mt => {
                                addMeasurement(mt);
                            }}
                            items={availableMeasurementTypes}
                            onCreate={createMeasurementType}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !name.trim() || !supplierCode.trim()}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Varyant Oluştur
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
