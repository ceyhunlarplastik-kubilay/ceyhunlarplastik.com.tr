"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EntityAssignmentSelect } from "@/features/admin/users/components/EntityAssignmentSelect"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import {
    ACCESS_STATUS_OPTIONS,
    buildUserEditorSubmission,
    type CustomerOption,
    getRoleOptions,
    GROUP_LABELS,
    ROLE_ASSIGNMENT_CONFIG,
    toUserEditorFormValues,
    type UserEditorFormValues,
    userEditorSchema,
} from "@/features/admin/users/schema/userEditor"
import { getUserDisplayName } from "@/lib/users/displayName"
import { cn } from "@/lib/utils"

const EMPTY_OPTION = "__none__"

type Props = {
    open: boolean
    user: AdminUser | null
    suppliers: Supplier[]
    customers: CustomerOption[]
    isOwnerViewer: boolean
    isSaving: boolean
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (user: AdminUser, values: UserEditorFormValues) => Promise<void>
}

const EMPTY_FORM_VALUES: UserEditorFormValues = {
    firstName: "",
    lastName: "",
    identifier: "",
    email: "",
    phone: null,
    group: "user",
    accessStatus: "PENDING_REVIEW",
    supplierId: null,
    customerId: null,
    customerContactTitle: null,
    customerContactDepartment: null,
    isPrimaryCustomerContact: false,
    assignedSupplierIds: [],
    assignedCustomerIds: [],
}

function getInitials(user: Pick<AdminUser, "identifier" | "email">) {
    const source = getUserDisplayName(user) || user.email || "??"
    return source.slice(0, 2).toUpperCase()
}

function formatUserDate(value?: string | null) {
    if (!value) return "Bilgi yok"

    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value))
}

export function UserEditDialog({
    open,
    user,
    suppliers,
    customers,
    isOwnerViewer,
    isSaving,
    isLoadingSuppliers,
    isLoadingCustomers,
    onOpenChange,
    onSubmit,
}: Props) {
    const fallbackValues = user ? toUserEditorFormValues(user) : EMPTY_FORM_VALUES

    const form = useForm<UserEditorFormValues>({
        resolver: zodResolver(userEditorSchema),
        defaultValues: fallbackValues,
    })

    useEffect(() => {
        if (user && open) {
            form.reset(toUserEditorFormValues(user))
        }
    }, [form, open, user])

    const watchedValues = useWatch({
        control: form.control,
        defaultValue: fallbackValues,
    })
    const values: UserEditorFormValues = {
        firstName: watchedValues.firstName ?? fallbackValues.firstName,
        lastName: watchedValues.lastName ?? fallbackValues.lastName,
        identifier: watchedValues.identifier ?? fallbackValues.identifier,
        email: watchedValues.email ?? fallbackValues.email,
        phone: watchedValues.phone ?? fallbackValues.phone,
        group: watchedValues.group ?? fallbackValues.group,
        accessStatus: watchedValues.accessStatus ?? fallbackValues.accessStatus,
        supplierId: watchedValues.supplierId ?? fallbackValues.supplierId,
        customerId: watchedValues.customerId ?? fallbackValues.customerId,
        customerContactTitle: watchedValues.customerContactTitle ?? fallbackValues.customerContactTitle,
        customerContactDepartment: watchedValues.customerContactDepartment ?? fallbackValues.customerContactDepartment,
        isPrimaryCustomerContact: watchedValues.isPrimaryCustomerContact ?? fallbackValues.isPrimaryCustomerContact,
        assignedSupplierIds: watchedValues.assignedSupplierIds ?? fallbackValues.assignedSupplierIds,
        assignedCustomerIds: watchedValues.assignedCustomerIds ?? fallbackValues.assignedCustomerIds,
    }
    const hasCustomerLink = Boolean(values.customerId)
    const roleConfig = ROLE_ASSIGNMENT_CONFIG[values.group]
    const roleOptions = useMemo(
        () => (user ? getRoleOptions(user, isOwnerViewer) : []),
        [isOwnerViewer, user],
    )
    const displayName = user ? (getUserDisplayName(user) || user.email) : ""

    if (!user) return null

    const plan = buildUserEditorSubmission(user, values)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto rounded-[30px] border border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] p-6">
                    <DialogHeader>
                        <DialogTitle>Kullanıcı Profili ve Yetki Düzenleme</DialogTitle>
                        <DialogDescription>
                            Kimlik, iletişim, portal bağlantıları ve operasyon atamalarını tek pencereden yönetin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5 flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white/90 p-4 sm:flex-row sm:items-center">
                        <Avatar size="lg" className="size-20 ring-1 ring-neutral-200">
                            <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-lg font-semibold text-neutral-950">
                                {displayName}
                            </div>
                            <div className="mt-1 truncate text-sm text-neutral-500" title={user.email}>
                                {user.email}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <UserAccessStatusBadge status={values.accessStatus} />
                                <Badge variant="outline" className="rounded-full">
                                    {GROUP_LABELS[values.group]}
                                </Badge>
                                {!user.isActive ? (
                                    <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                                        Pasif kayıt
                                    </Badge>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-2 text-xs text-neutral-500 sm:min-w-[220px]">
                            <div>Kayıt: {formatUserDate(user.createdAt)}</div>
                            <div>Güncelleme: {formatUserDate(user.updatedAt)}</div>
                            <div>Erişim kararı: {formatUserDate(user.accessStatusChangedAt)}</div>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={form.handleSubmit(async (nextValues) => {
                        await onSubmit(user, nextValues)
                    })}
                    className="space-y-6 p-6"
                >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <section className="space-y-4 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-neutral-900">Profil Bilgileri</h3>
                                <p className="text-xs text-neutral-500">Cognito ve uygulama verisinde saklanan temel kullanıcı alanları.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Ad</Label>
                                    <Input id="firstName" {...form.register("firstName")} className="rounded-xl" />
                                    {form.formState.errors.firstName ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.firstName.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Soyad</Label>
                                    <Input id="lastName" {...form.register("lastName")} className="rounded-xl" />
                                    {form.formState.errors.lastName ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.lastName.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="identifier">Görünen İsim</Label>
                                    <Input id="identifier" {...form.register("identifier")} className="rounded-xl" />
                                    {form.formState.errors.identifier ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.identifier.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefon</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="+90 555 123 45 67"
                                        value={values.phone ?? ""}
                                        onChange={(event) => form.setValue("phone", event.target.value.trim() ? event.target.value : null, { shouldDirty: true, shouldValidate: true })}
                                        className="rounded-xl"
                                    />
                                    <p className="text-xs text-neutral-500">
                                        Cognito icin numara otomatik olarak E.164 formatina normalize edilir.
                                    </p>
                                    {form.formState.errors.phone ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.phone.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" type="email" {...form.register("email")} className="rounded-xl" />
                                <p className="text-xs text-neutral-500">
                                    Bu alan değişirse Cognito kullanıcı e-postası da aynı anda güncellenir.
                                </p>
                                {form.formState.errors.email ? (
                                    <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
                                ) : null}
                            </div>
                        </section>

                        <section className="space-y-4 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-neutral-900">Yetki ve Erişim</h3>
                                <p className="text-xs text-neutral-500">Rol seçimi erişim akışını ve zorunlu portal bağlantılarını belirler.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Rol</Label>
                                    <Controller
                                        control={form.control}
                                        name="group"
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    field.onChange(value)
                                                    form.setValue("accessStatus", value === "user" ? "PENDING_REVIEW" : "ACTIVE", { shouldDirty: true })
                                                }}
                                            >
                                                <SelectTrigger className="h-11 rounded-xl">
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
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Erişim Durumu</Label>
                                    <Controller
                                        control={form.control}
                                        name="accessStatus"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="h-11 rounded-xl">
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
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
                                Rol değişikliği bu kullanıcı için portal bağı veya operasyon ataması zorunlu kılıyorsa aşağıdaki alanlar aktifleşir.
                            </div>
                        </section>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <section className="space-y-4 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-neutral-900">Portal Bağlantıları</h3>
                                <p className="text-xs text-neutral-500">Supplier ve customer portal kullanıcıları için birebir kayıt bağlantıları.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Portal Tedarikçi</Label>
                                    <Controller
                                        control={form.control}
                                        name="supplierId"
                                        render={({ field }) => (
                                            <Select
                                                disabled={!roleConfig.requiresPortalSupplier || isLoadingSuppliers}
                                                value={field.value ?? EMPTY_OPTION}
                                                onValueChange={(value) => field.onChange(value === EMPTY_OPTION ? null : value)}
                                            >
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder="Atama yok" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={EMPTY_OPTION}>Atama yok</SelectItem>
                                                    {suppliers.map((supplier) => (
                                                        <SelectItem key={supplier.id} value={supplier.id}>
                                                            {supplier.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {form.formState.errors.supplierId ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.supplierId.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Portal Müşteri</Label>
                                    <Controller
                                        control={form.control}
                                        name="customerId"
                                        render={({ field }) => (
                                            <Select
                                                disabled={!roleConfig.requiresPortalCustomer || isLoadingCustomers}
                                                value={field.value ?? EMPTY_OPTION}
                                                onValueChange={(value) => field.onChange(value === EMPTY_OPTION ? null : value)}
                                            >
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder="Atama yok" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={EMPTY_OPTION}>Atama yok</SelectItem>
                                                    {customers.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id}>
                                                            {customer.companyName || customer.fullName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {form.formState.errors.customerId ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.customerId.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="customerContactTitle">İletişim Ünvanı / Rolü</Label>
                                    <Input
                                        id="customerContactTitle"
                                        disabled={!hasCustomerLink}
                                        value={values.customerContactTitle ?? ""}
                                        onChange={(event) => form.setValue("customerContactTitle", event.target.value.trim() ? event.target.value : null, { shouldDirty: true, shouldValidate: true })}
                                        className="rounded-xl"
                                        placeholder="Örn. Müşteri Yetkilisi"
                                    />
                                    {form.formState.errors.customerContactTitle ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.customerContactTitle.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customerContactDepartment">Departman</Label>
                                    <Input
                                        id="customerContactDepartment"
                                        disabled={!hasCustomerLink}
                                        value={values.customerContactDepartment ?? ""}
                                        onChange={(event) => form.setValue("customerContactDepartment", event.target.value.trim() ? event.target.value : null, { shouldDirty: true, shouldValidate: true })}
                                        className="rounded-xl"
                                        placeholder="Örn. Muhasebe"
                                    />
                                    {form.formState.errors.customerContactDepartment ? (
                                        <p className="text-xs text-rose-600">{form.formState.errors.customerContactDepartment.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="isPrimaryCustomerContact"
                                        checked={values.isPrimaryCustomerContact}
                                        disabled={!hasCustomerLink}
                                        onCheckedChange={(checked) => form.setValue("isPrimaryCustomerContact", Boolean(checked), { shouldDirty: true, shouldValidate: true })}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="isPrimaryCustomerContact" className="text-sm font-medium text-neutral-900">
                                            Ana Yetkili
                                        </Label>
                                        <p className="text-xs leading-5 text-neutral-500">
                                            Aynı müşteri altında yalnızca bir kullanıcı ana yetkili olabilir. Bu seçim overview kartlarında ilk sırada gösterilir.
                                        </p>
                                        {!hasCustomerLink ? (
                                            <p className="text-xs leading-5 text-neutral-400">
                                                Bu alanlar yalnızca portal müşteriye bağlı kullanıcılar için aktiftir.
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-neutral-900">Operasyon Atamaları</h3>
                                <p className="text-xs text-neutral-500">Satın alma kullanıcılarına tedarikçi, satış kullanıcılarına müşteri atayın.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Satın Alma Atamaları</Label>
                                    <Controller
                                        control={form.control}
                                        name="assignedSupplierIds"
                                        render={({ field }) => (
                                            <EntityAssignmentSelect
                                                disabled={!roleConfig.canAssignSuppliers || isLoadingSuppliers}
                                                value={field.value}
                                                options={suppliers.map((supplier) => ({
                                                    id: supplier.id,
                                                    label: supplier.name,
                                                    caption: supplier.contactName || supplier.taxNumber || undefined,
                                                }))}
                                                placeholder="Tedarikçi seç"
                                                emptyLabel="Tedarikçi bulunamadı"
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Satış Atamaları</Label>
                                    <Controller
                                        control={form.control}
                                        name="assignedCustomerIds"
                                        render={({ field }) => (
                                            <EntityAssignmentSelect
                                                disabled={!roleConfig.canAssignCustomers || isLoadingCustomers}
                                                value={field.value}
                                                options={customers.map((customer) => ({
                                                    id: customer.id,
                                                    label: customer.companyName || customer.fullName,
                                                    caption: customer.fullName,
                                                }))}
                                                placeholder="Müşteri seç"
                                                emptyLabel="Müşteri bulunamadı"
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4">
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Değişiklik Özeti</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className={cn("rounded-full", plan.profileChanged ? "border-sky-200 bg-sky-50 text-sky-700" : "border-neutral-200 bg-white text-neutral-500")}>
                                {plan.profileChanged ? "Profil güncellenecek" : "Profil aynı"}
                            </Badge>
                            <Badge variant="outline" className={cn("rounded-full", plan.roleChanged ? "border-amber-200 bg-amber-50 text-amber-700" : "border-neutral-200 bg-white text-neutral-500")}>
                                {plan.roleChanged ? "Rol/erişim güncellenecek" : "Rol aynı"}
                            </Badge>
                            <Badge variant="outline" className={cn("rounded-full", plan.assignmentsChanged ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-white text-neutral-500")}>
                                {plan.assignmentsChanged ? "Atamalar güncellenecek" : "Atamalar aynı"}
                            </Badge>
                        </div>
                    </div>

                    <DialogFooter className="border-t border-neutral-200 pt-5">
                        <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
                            Vazgeç
                        </Button>
                        <Button type="submit" className="min-w-36 rounded-xl" disabled={isSaving || (!plan.profileChanged && !plan.roleChanged && !plan.assignmentsChanged)}>
                            {isSaving ? <Spinner className="size-4" /> : null}
                            {isSaving ? "Kaydediliyor" : "Değişiklikleri Kaydet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
