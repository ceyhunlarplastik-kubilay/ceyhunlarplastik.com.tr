"use client";
import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination";
import { useSupplierApprovalRequests } from "@/features/supplier/approvalRequests/hooks/useSupplierApprovalRequests";
function formatDate(value) {
    if (!value)
        return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "-";
    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}
const APPROVAL_STATUS_LABELS = {
    PENDING: "Bekliyor",
    APPROVED: "Onaylandı",
    REJECTED: "Reddedildi",
};
const APPROVAL_STATUS_STYLES = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
};
const APPROVAL_TYPE_LABELS = {
    SUPPLIER_PROFILE_UPDATE: "Profil Güncellemesi",
    VARIANT_PRICING_UPDATE: "Varyant Fiyatı",
};
function summarizeApprovalRequest(request) {
    if (request.type === "SUPPLIER_PROFILE_UPDATE") {
        return "Firma ve iletişim bilgileri değişikliği";
    }
    const variantLabel = request.productVariantSupplier?.variant?.fullCode
        ?? request.productVariantSupplier?.variant?.name
        ?? "Varyant";
    return `${variantLabel} için maliyet, stok ve satış şartı değişikliği`;
}
export function SupplierApprovalRequestsPageClient() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const query = useSupplierApprovalRequests({
        page,
        limit,
        search: search.trim() || undefined,
        sort: "createdAt",
        order: "desc",
    });
    const approvalRequests = useMemo(() => query.data?.data ?? [], [query.data?.data]);
    const meta = query.data?.meta;
    return (<div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            <ShieldCheck className="h-3.5 w-3.5"/>
                            Son Onay Talepleri
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Onay Talepleri</h1>
                        <p className="max-w-2xl text-sm leading-6 text-neutral-500">
                            Gönderdiğiniz güncelleme taleplerinin son durumunu buradan takip edebilirsiniz.
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/>
                        <Input value={search} onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
        }} placeholder="Talep tipi veya varyant ara" className="pl-9"/>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
                {query.isLoading ? (<div className="flex min-h-[240px] items-center justify-center">
                        <Spinner className="size-5"/>
                    </div>) : approvalRequests.length === 0 ? (<div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
                        Henüz görüntülenecek approval talebi bulunmuyor.
                    </div>) : (<div className="space-y-3">
                        {approvalRequests.map((request) => (<div key={request.id} className="rounded-2xl border border-neutral-200 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-neutral-900">
                                            {APPROVAL_TYPE_LABELS[request.type] ?? request.type}
                                        </div>
                                        <p className="text-sm text-neutral-500">
                                            {summarizeApprovalRequest(request)}
                                        </p>
                                    </div>

                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${APPROVAL_STATUS_STYLES[request.status] ?? "bg-neutral-100 text-neutral-700"}`}>
                                        {APPROVAL_STATUS_LABELS[request.status] ?? request.status}
                                    </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
                                    <span>Talep Tarihi: {formatDate(request.createdAt)}</span>
                                    {request.decidedAt ? <span>Karar Tarihi: {formatDate(request.decidedAt)}</span> : null}
                                    {request.decidedAt && request.reviewedByUser?.email ? (<span>İnceleyen: {request.reviewedByUser.email}</span>) : null}
                                </div>

                                {request.decisionNote ? (<div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                                        {request.decisionNote}
                                    </div>) : null}
                            </div>))}
                    </div>)}
            </div>

            <AdminListPagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} total={meta?.total} limit={limit} itemLabel="talep" onPageChange={setPage} onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
        }}/>
        </div>);
}
