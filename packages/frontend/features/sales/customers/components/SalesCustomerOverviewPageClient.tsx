"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BadgePercent, CalendarClock, CreditCard, Mail, Phone, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { EditCustomerProfileDialog } from "@/features/admin/customers/components/EditCustomerProfileDialog"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { buildCustomerUpdatePayload, type CustomerEditorFormValues } from "@/features/admin/customers/schema/customerEditor"
import { useManagedCustomer } from "@/features/sales/customers/hooks/useManagedCustomer"
import { useManagedCompanyContacts } from "@/features/sales/customers/hooks/useManagedCompanyContacts"
import { useUpdateManagedCustomer } from "@/features/sales/customers/hooks/useUpdateManagedCustomer"
import { formatDiscountBadge, formatMoney, formatPaymentTermLabel } from "@/lib/customers/pricing"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    customerId: string
}

const HIERARCHY_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

export function SalesCustomerOverviewPageClient({ customerId }: Props) {
    const customerQuery = useManagedCustomer(customerId)
    const updateMutation = useUpdateManagedCustomer(customerId)
    const attrsQuery = useAttributesForFilter()
    const companyContactsQuery = useManagedCompanyContacts()
    const usersQuery = useUsers({ params: { page: 1, limit: 500 } })
    const [dialogOpen, setDialogOpen] = useState(false)

    const customer = customerQuery.data
    const attributes = useMemo(() => attrsQuery.data ?? [], [attrsQuery.data])
    const companyContacts = companyContactsQuery.data?.data ?? []
    const salesUsers = useMemo(
        () => (usersQuery.data?.data ?? [])
            .filter((user) => user.groups.includes("sales") || user.groups.includes("sales_director") || user.groups.includes("admin") || user.groups.includes("owner"))
            .map((user) => ({
                id: user.id,
                label: getUserDisplayName(user) || user.email,
            })),
        [usersQuery.data?.data],
    )
    const sectorValues = useMemo(
        () => attributes.find((attribute) => attribute.code === "sector")?.values ?? [],
        [attributes],
    )
    const allProductionGroupValues = useMemo(
        () => attributes.find((attribute) => attribute.code === "production_group")?.values ?? [],
        [attributes],
    )
    const allUsageAreaValues = useMemo(
        () => attributes.find((attribute) => attribute.code === "usage_area")?.values ?? [],
        [attributes],
    )
    const customerAssignableAttributes = useMemo(
        () => attributes.filter((attribute) => attribute.isCustomerAssignable),
        [attributes],
    )
    const genericProfileAssignments = useMemo(
        () => (customer?.attributeValueAssignments ?? []).filter((assignment) => !HIERARCHY_ATTRIBUTE_CODES.has(assignment.attributeValue.attribute?.code ?? "")),
        [customer?.attributeValueAssignments],
    )

    async function handleSave(values: CustomerEditorFormValues) {
        if (!customer) return

        try {
            await updateMutation.mutateAsync(buildCustomerUpdatePayload(customer.id, values))
            toast.success("Müşteri bilgileri güncellendi")
        } catch {
            toast.error("Müşteri bilgileri güncellenemedi")
            throw new Error("Customer update failed")
        }
    }

    if (customerQuery.isLoading) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border bg-white shadow-sm">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (!customer) {
        return <div className="rounded-3xl border bg-white p-8 text-sm text-red-600 shadow-sm">Müşteri bulunamadı.</div>
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-950">Satış Müşterisi Özeti</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            Saha ekibinin kullanacağı temel müşteri ve ödeme şartlarını buradan yönetin.
                        </p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>Müşteriyi Düzenle</Button>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                                <UserRound className="h-4 w-4" />
                                Yetkili
                            </div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">{customer.fullName}</div>
                            <div className="mt-1 text-xs text-neutral-500">{customer.companyName || "Firma bilgisi yok"}</div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                                <Mail className="h-4 w-4" />
                                İletişim
                            </div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">{customer.email}</div>
                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                                <BadgePercent className="h-4 w-4" />
                                Genel İskonto
                            </div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">
                                {formatDiscountBadge(customer.generalDiscountPercent) ?? "Tanımlı değil"}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                                <CalendarClock className="h-4 w-4" />
                                Ticari Şart
                            </div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">
                                {formatPaymentTermLabel(customer.defaultPaymentTermDays) ?? "Vade tanımsız"}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
                                <CreditCard className="h-3.5 w-3.5" />
                                {customer.creditLimit !== null && customer.creditLimit !== undefined
                                    ? `Limit ${formatMoney(customer.creditLimit)}`
                                    : "Kredi limiti tanımsız"}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Segment ve Atama</div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <div className="text-xs text-neutral-400">Satış Temsilcisi</div>
                                    <div className="mt-1 text-sm font-medium text-neutral-900">
                                        {customer.assignedSalesUser ? (getUserDisplayName(customer.assignedSalesUser) || customer.assignedSalesUser.email) : "Atama yok"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-400">Durum</div>
                                    <div className="mt-1">
                                        <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                                            {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-400">Sektör</div>
                                    <div className="mt-1 text-sm font-medium text-neutral-900">{customer.sectorValue?.name ?? "-"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-400">Üretim Grubu</div>
                                    <div className="mt-1 text-sm font-medium text-neutral-900">{customer.productionGroupValue?.name ?? "-"}</div>
                                </div>
                                <div className="sm:col-span-2">
                                    <div className="text-xs text-neutral-400">Ek Profil Alanları</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {genericProfileAssignments.length === 0 ? (
                                            <span className="text-sm text-neutral-500">Tanımlı ek profil alanı yok</span>
                                        ) : (
                                            genericProfileAssignments.map((assignment) => (
                                                <Badge key={assignment.id} variant="outline">
                                                    {assignment.attributeValue.attribute?.name ? `${assignment.attributeValue.attribute.name}: ` : ""}
                                                    {assignment.attributeValue.name}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <div className="text-xs text-neutral-400">Ceyhunlar İletişimleri</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(customer.companyContactAssignments ?? []).length === 0 ? (
                                            <span className="text-sm text-neutral-500">Atanmış departman iletişimi yok</span>
                                        ) : (
                                            customer.companyContactAssignments?.map((assignment) => (
                                                <Badge
                                                    key={assignment.id}
                                                    variant={assignment.isActive && assignment.companyContact.isActive ? "outline" : "secondary"}
                                                >
                                                    {assignment.companyContact.department}: {assignment.companyContact.name}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {customer.note ? (
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Not</div>
                                <div className="mt-2 text-sm leading-6 text-neutral-700">{customer.note}</div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <EditCustomerProfileDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                customer={customer}
                salesUsers={salesUsers}
                sectorValues={sectorValues}
                allProductionGroupValues={allProductionGroupValues}
                allUsageAreaValues={allUsageAreaValues}
                customerAssignableAttributes={customerAssignableAttributes}
                companyContacts={companyContacts}
                onSubmit={(values) => handleSave(values)}
                isPending={updateMutation.isPending}
            />
        </div>
    )
}
