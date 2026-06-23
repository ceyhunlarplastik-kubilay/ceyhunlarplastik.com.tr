"use client"

import type { ReactNode } from "react"
import { PencilLine, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { EntityAssignmentSelect } from "@/features/admin/users/components/EntityAssignmentSelect"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import {
    formatUserDateTime,
    getCustomerContactMeta,
    getInitials,
    getPortalLinkSummary,
} from "@/features/admin/users/lib/userDisplay"
import {
    getEffectiveDraft,
    isUserDraftDirty,
    validateUserDraft,
    type UserAccessDraft,
} from "@/features/admin/users/lib/userDrafts"
import type { CustomerOption } from "@/features/admin/users/schema/userEditor"
import {
    ACCESS_STATUS_OPTIONS,
    GROUP_LABELS,
    ROLE_ASSIGNMENT_CONFIG,
    getDefaultAccessStatusForGroup,
    getRoleOptions,
    getUserDisplayGroup,
    type AccessStatus,
    type UserGroup,
} from "@/features/admin/users/schema/userEditor"
import { getUserDisplayName } from "@/lib/users/displayName"

const EMPTY_OPTION = "__none__"

type Props = {
    open: boolean
    user: AdminUser | null
    draft: UserAccessDraft | undefined
    suppliers: Supplier[]
    customers: CustomerOption[]
    isOwnerViewer: boolean
    isSaving: boolean
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    onOpenChange: (open: boolean) => void
    onDraftChange: (patch: UserAccessDraft) => void
    onClearDraft: () => void
    onSave: () => void
}

function Section({
    title,
    description,
    children,
}: {
    title: string
    description: string
    children: ReactNode
}) {
    return (
        <section className="border-t border-neutral-200 px-6 py-5 first:border-t-0">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>
                <p className="text-xs text-neutral-500">{description}</p>
            </div>
            {children}
        </section>
    )
}

export function UserAccessEditorDialog({
    open,
    user,
    draft,
    suppliers,
    customers,
    isOwnerViewer,
    isSaving,
    isLoadingSuppliers,
    isLoadingCustomers,
    onOpenChange,
    onDraftChange,
    onClearDraft,
    onSave,
}: Props) {
    if (!user) return null

    const effective = getEffectiveDraft(user, draft)
    const roleOptions = getRoleOptions(user, isOwnerViewer)
    const roleConfig = ROLE_ASSIGNMENT_CONFIG[effective.group]
    const roleSelectDisabled = !isOwnerViewer && ["admin", "owner"].includes(getUserDisplayGroup(user))
    const displayName = getUserDisplayName(user) || user.email
    const isDirty = isUserDraftDirty(user, draft)
    const validationError = validateUserDraft(user, draft)
    const portalSummary = getPortalLinkSummary(user, draft, suppliers, customers)
    const customerMeta = getCustomerContactMeta(user)

    function handleGroupChange(group: UserGroup) {
        const nextConfig = ROLE_ASSIGNMENT_CONFIG[group]

        onDraftChange({
            group,
            accessStatus: getDefaultAccessStatusForGroup(group),
            supplierId: nextConfig.requiresPortalSupplier ? effective.supplierId : null,
            customerId: nextConfig.requiresPortalCustomer ? effective.customerId : null,
            assignedSupplierIds: nextConfig.canAssignSuppliers ? effective.assignedSupplierIds : [],
            assignedCustomerIds: nextConfig.canAssignCustomers ? effective.assignedCustomerIds : [],
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto rounded-[28px] border border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] p-6">
                    <DialogHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <Avatar size="lg" className="size-16 ring-1 ring-neutral-200">
                                    <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                                        <PencilLine className="h-3.5 w-3.5" />
                                        Yetki ve Bağ Düzenleme
                                    </div>
                                    <DialogTitle className="mt-3 truncate text-2xl font-semibold text-neutral-950">
                                        {displayName}
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 truncate text-sm text-neutral-500">
                                        {user.email} • @{user.identifier}
                                    </DialogDescription>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
                                            {GROUP_LABELS[effective.group]}
                                        </Badge>
                                        <UserAccessStatusBadge status={effective.accessStatus} />
                                        {isDirty ? (
                                            <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                                                Taslak değişiklik
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <Section
                    title="Kimlik / Profil Özeti"
                    description="Bu alan yalnızca özet amaçlıdır. Profil alanlarını ayrı diyalogdan düzenleyin."
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-700">
                            <div><span className="font-medium text-neutral-950">Ad soyad:</span> {displayName}</div>
                            <div><span className="font-medium text-neutral-950">E-posta:</span> {user.email}</div>
                            <div><span className="font-medium text-neutral-950">Telefon:</span> {user.phone ?? "Tanımlanmadı"}</div>
                            {effective.customerId === user.customerId && customerMeta ? (
                                <div><span className="font-medium text-neutral-950">Müşteri iletişimi:</span> {customerMeta}</div>
                            ) : null}
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-700">
                            <div><span className="font-medium text-neutral-950">Kayıt:</span> {formatUserDateTime(user.createdAt)}</div>
                            <div><span className="font-medium text-neutral-950">Güncelleme:</span> {formatUserDateTime(user.updatedAt)}</div>
                            <div><span className="font-medium text-neutral-950">Erişim kararı:</span> {formatUserDateTime(user.accessStatusChangedAt)}</div>
                        </div>
                    </div>
                </Section>

                <Section
                    title="Rol & Erişim"
                    description="Rol değişimi portal bağı ve operasyon atama gereksinimlerini etkiler."
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Rol</div>
                            <Select
                                disabled={roleSelectDisabled}
                                value={effective.group}
                                onValueChange={(value) => handleGroupChange(value as UserGroup)}
                            >
                                <SelectTrigger className="h-11 rounded-xl bg-white">
                                    <SelectValue placeholder="Rol seç" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isOwnerViewer && ["admin", "owner"].includes(getUserDisplayGroup(user)) ? (
                                <p className="text-xs text-neutral-500">Owner olmayan kullanıcılar admin ve owner rollerini değiştiremez.</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Erişim Durumu</div>
                            <div className="flex items-center gap-2">
                                <UserAccessStatusBadge status={effective.accessStatus} />
                            </div>
                            <Select
                                value={effective.accessStatus}
                                onValueChange={(value) => onDraftChange({ accessStatus: value as AccessStatus })}
                            >
                                <SelectTrigger className="h-11 rounded-xl bg-white">
                                    <SelectValue placeholder="Durum seç" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCESS_STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Section>

                <Section
                    title="Portal Bağları"
                    description="Portal rolleri için ilgili tedarikçi veya müşteri bağlantısı zorunludur."
                >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Portal Tedarikçi</div>
                            <Select
                                disabled={!roleConfig.requiresPortalSupplier || isLoadingSuppliers}
                                value={effective.supplierId ?? EMPTY_OPTION}
                                onValueChange={(value) => onDraftChange({
                                    supplierId: value === EMPTY_OPTION ? null : value,
                                })}
                            >
                                <SelectTrigger className="h-11 rounded-xl bg-white">
                                    <SelectValue placeholder="Bağ yok" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={EMPTY_OPTION}>Bağ yok</SelectItem>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Portal Müşteri</div>
                            <Select
                                disabled={!roleConfig.requiresPortalCustomer || isLoadingCustomers}
                                value={effective.customerId ?? EMPTY_OPTION}
                                onValueChange={(value) => onDraftChange({
                                    customerId: value === EMPTY_OPTION ? null : value,
                                })}
                            >
                                <SelectTrigger className="h-11 rounded-xl bg-white">
                                    <SelectValue placeholder="Bağ yok" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={EMPTY_OPTION}>Bağ yok</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.companyName || customer.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-sm text-neutral-700">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Aktif Özet</div>
                            <div className="mt-3 space-y-2">
                                <div><span className="font-medium text-neutral-950">Tedarikçi:</span> {portalSummary.supplierName ?? "Bağ yok"}</div>
                                <div><span className="font-medium text-neutral-950">Müşteri:</span> {portalSummary.customerName ?? "Bağ yok"}</div>
                                {effective.customerId === user.customerId && customerMeta ? (
                                    <div><span className="font-medium text-neutral-950">İletişim:</span> {customerMeta}</div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </Section>

                <Section
                    title="Operasyon Atamaları"
                    description="Satın alma kullanıcılarına tedarikçi, satış kullanıcılarına müşteri atamaları tanımlanır."
                >
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Satın Alma Atamaları</div>
                            <EntityAssignmentSelect
                                disabled={!roleConfig.canAssignSuppliers || isLoadingSuppliers}
                                value={effective.assignedSupplierIds}
                                options={suppliers.map((supplier) => ({
                                    id: supplier.id,
                                    label: supplier.name,
                                    caption: supplier.contactName || supplier.taxNumber || undefined,
                                }))}
                                placeholder="Tedarikçi seç"
                                emptyLabel="Tedarikçi bulunamadı"
                                onChange={(assignedSupplierIds) => onDraftChange({ assignedSupplierIds })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Satış Atamaları</div>
                            <EntityAssignmentSelect
                                disabled={!roleConfig.canAssignCustomers || isLoadingCustomers}
                                value={effective.assignedCustomerIds}
                                options={customers.map((customer) => ({
                                    id: customer.id,
                                    label: customer.companyName || customer.fullName,
                                    caption: customer.fullName,
                                }))}
                                placeholder="Müşteri seç"
                                emptyLabel="Müşteri bulunamadı"
                                onChange={(assignedCustomerIds) => onDraftChange({ assignedCustomerIds })}
                            />
                        </div>
                    </div>
                </Section>

                <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                        {validationError ? (
                            <p className="text-rose-600">{validationError}</p>
                        ) : isDirty ? (
                            <p className="text-amber-600">Kaydedilmemiş değişiklikler bu kullanıcı için ayrı bir taslak olarak tutuluyor.</p>
                        ) : (
                            <p className="text-neutral-500">Bu kullanıcı için bekleyen değişiklik yok.</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {isDirty ? (
                            <Button type="button" variant="ghost" onClick={onClearDraft}>
                                Taslağı Temizle
                            </Button>
                        ) : null}
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Kapat
                        </Button>
                        <Button type="button" disabled={!isDirty || Boolean(validationError) || isSaving} onClick={onSave}>
                            {isSaving ? <Spinner className="size-4" /> : <Save className="h-4 w-4" />}
                            Kaydet
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
