"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const FIELD_LABELS = {
    name: "Firma Adı",
    contactName: "Yetkili",
    phone: "Telefon",
    address: "Adres",
    taxNumber: "Vergi No",
    defaultPaymentTermDays: "Varsayılan Vade",
    price: "Maliyet",
    operationalCostRate: "Operasyonel Maliyet %",
    netCost: "Net Maliyet",
    profitRate: "Kar Oranı %",
    listPrice: "Liste Fiyatı",
    paymentTermDays: "Vade",
    supplierVariantCode: "Tedarikçi Varyant Kodu",
    supplierNote: "Tedarikçi Notu",
    minOrderQty: "Minimum Sipariş",
    stockQty: "Stok",
    currency: "Para Birimi",
};
function areValuesEqual(left, right) {
    if (left === right)
        return true;
    if ((left === null || left === undefined || left === "")
        && (right === null || right === undefined || right === "")) {
        return true;
    }
    try {
        return JSON.stringify(left) === JSON.stringify(right);
    }
    catch {
        return false;
    }
}
function renderValue(value) {
    if (value === null || value === undefined || value === "")
        return "-";
    if (typeof value === "boolean")
        return value ? "Evet" : "Hayır";
    if (Array.isArray(value))
        return value.length > 0 ? value.map(renderValue).join(", ") : "-";
    return String(value);
}
function buildDiffRows(currentSnapshot, requestedPayload) {
    const keys = Array.from(new Set([
        ...Object.keys(currentSnapshot),
        ...Object.keys(requestedPayload),
    ]));
    return keys
        .map((key) => {
        const currentValue = currentSnapshot[key];
        const requestedValue = Object.prototype.hasOwnProperty.call(requestedPayload, key)
            ? requestedPayload[key]
            : currentValue;
        return {
            key,
            label: FIELD_LABELS[key] ?? key,
            currentValue,
            requestedValue,
            changed: !areValuesEqual(currentValue, requestedValue),
        };
    })
        .sort((left, right) => {
        if (left.changed !== right.changed)
            return left.changed ? -1 : 1;
        return left.label.localeCompare(right.label, "tr");
    });
}
function getProductPreview(request) {
    const product = request.productVariantSupplier?.variant?.product;
    if (!product)
        return null;
    const primaryAsset = (product.assets ?? []).find((asset) => asset.role === "PRIMARY")
        ?? (product.assets ?? []).find((asset) => asset.type === "IMAGE")
        ?? null;
    return {
        id: product.id,
        code: product.code,
        name: product.name,
        imageUrl: primaryAsset?.url ?? null,
    };
}
export function SupplierApprovalRequestDiffPanel({ request, currentSnapshot, requestedPayload, showAllFields, onToggleShowAll, }) {
    const rows = buildDiffRows(currentSnapshot ?? {}, requestedPayload ?? {});
    const changedRows = rows.filter((row) => row.changed);
    const hiddenCount = Math.max(0, rows.length - changedRows.length);
    const visibleRows = showAllFields
        ? rows
        : changedRows.length > 0
            ? changedRows
            : rows;
    const productPreview = getProductPreview(request);
    return (<div className="mx-auto max-w-none space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                        <Sparkles className="h-3.5 w-3.5"/>
                        Değişiklik Özeti
                    </div>
                    <p className="text-sm text-neutral-600">
                        {changedRows.length > 0
            ? `${changedRows.length} alan değişiyor${hiddenCount > 0 && !showAllFields ? `, ${hiddenCount} aynı alan gizleniyor` : ""}.`
            : "Fark bulunamadı. Talep ile mevcut kayıt aynı görünüyor."}
                    </p>
                </div>

                {hiddenCount > 0 ? (<Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onToggleShowAll}>
                        {showAllFields ? "Sadece değişenleri göster" : `Tüm alanları göster (${rows.length})`}
                    </Button>) : null}
            </div>

            {request.type === "VARIANT_PRICING_UPDATE" && productPreview ? (<div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                            {productPreview.imageUrl ? (<Image src={productPreview.imageUrl} alt={productPreview.name} fill className="object-cover" sizes="64px"/>) : (<div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                                    Görsel yok
                                </div>)}
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Bağlı Ürün</p>
                            <p className="truncate text-sm font-semibold text-neutral-900">{productPreview.name}</p>
                            <p className="truncate text-xs text-neutral-500">{productPreview.code}</p>
                        </div>
                    </div>

                    <Button asChild variant="outline" size="sm" className="shrink-0">
                        <Link href={`/admin/products/${productPreview.id}/variants`}>
                            Ürüne Git
                            <ArrowUpRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </div>) : null}

            <div className="space-y-2">
                {visibleRows.map((row) => (<div key={row.key} className={cn("rounded-xl border p-3 transition-colors", row.changed
                ? "border-amber-200 bg-white shadow-sm"
                : "border-neutral-200 bg-white/80")}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-neutral-900">{row.label}</h3>
                            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium", row.changed
                ? "bg-amber-100 text-amber-800"
                : "bg-neutral-100 text-neutral-600")}>
                                {row.changed ? "Değişiyor" : "Aynı"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className={cn("rounded-lg border px-2.5 py-1.5", row.changed
                ? "border-rose-200 bg-rose-50/80"
                : "border-neutral-200 bg-neutral-50")}>
                                <div className="mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                                    <Minus className="h-3.5 w-3.5"/>
                                    Mevcut
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 font-medium text-neutral-900">
                                    {renderValue(row.currentValue)}
                                </p>
                            </div>

                            <div className={cn("rounded-lg border px-2.5 py-1.5", row.changed
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-neutral-200 bg-neutral-50")}>
                                <div className="mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                                    <Plus className="h-3.5 w-3.5"/>
                                    Talep
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 font-medium text-neutral-900">
                                    {renderValue(row.requestedValue)}
                                </p>
                            </div>
                        </div>
                    </div>))}
            </div>
        </div>);
}
