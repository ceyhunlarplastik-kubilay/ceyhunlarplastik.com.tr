"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
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
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import type { AdminUser } from "@/features/admin/users/api/types"
import {
    buildUserEditorSubmission,
    GROUP_LABELS,
    toUserEditorFormValues,
    type UserEditorFormValues,
    userEditorSchema,
} from "@/features/admin/users/schema/userEditor"
import { getUserDisplayName } from "@/lib/users/displayName"
import { cn } from "@/lib/utils"

type Props = {
    open: boolean
    user: AdminUser | null
    mode?: "admin" | "self"
    isSaving: boolean
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
    mode = "admin",
    isSaving,
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
    const isSelfMode = mode === "self"
    const hasCustomerLink = Boolean(values.customerId)
    const displayName = user ? (getUserDisplayName(user) || user.email) : ""

    if (!user) return null

    const plan = buildUserEditorSubmission(user, values)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto rounded-[30px] border border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] p-6">
                    <DialogHeader>
                        <DialogTitle>{isSelfMode ? "Profilimi Düzenle" : "Kullanıcı Profili Düzenleme"}</DialogTitle>
                        <DialogDescription>
                            {isSelfMode
                                ? "Ad, soyad, görünen isim ve iletişim bilgilerinizi güncelleyin."
                                : "Kimlik ve iletişim alanlarını yetki ayarlarından ayrı, daha net bir yüzeyde yönetin."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5 flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white/90 p-4 sm:flex-row sm:items-center">
                        <Avatar size="lg" className="size-20 ring-1 ring-neutral-200">
                            <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-lg font-semibold text-neutral-950">{displayName}</div>
                            <div className="mt-1 truncate text-sm text-neutral-500" title={user.email}>
                                {isSelfMode ? user.email : `${user.email} • @${user.identifier}`}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <UserAccessStatusBadge status={values.accessStatus} />
                                <Badge variant="outline" className="rounded-full">
                                    {GROUP_LABELS[values.group]}
                                </Badge>
                                {user.customerId ? (
                                    <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
                                        Portal müşteri bağlı
                                    </Badge>
                                ) : null}
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
                                <p className="text-xs text-neutral-500">
                                    {isSelfMode
                                        ? "Bu bilgiler portal ve sistem içindeki görünen kullanıcı kartlarında kullanılır."
                                        : "Cognito ve uygulama verisinde saklanan temel kullanıcı alanları."}
                                </p>
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

                            {!isSelfMode ? (
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
                            ) : null}
                        </section>

                        <section className="space-y-4 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-neutral-900">Durum Özeti</h3>
                                <p className="text-xs text-neutral-500">Yetki, erişim ve portal bağlamı burada özetlenir.</p>
                            </div>

                            <div className="grid gap-3 text-sm text-neutral-700">
                                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Rol</div>
                                    <div className="mt-1 font-semibold text-neutral-950">{GROUP_LABELS[values.group]}</div>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Erişim</div>
                                    <div className="mt-2">
                                        <UserAccessStatusBadge status={values.accessStatus} />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Portal Bağı</div>
                                    <div className="mt-1 font-semibold text-neutral-950">
                                        {user.customer?.companyName || user.customer?.fullName || "Portal müşteri bağlı değil"}
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Yetki, portal bağı ve operasyon atamaları için ayrı `Yetki` dialogunu kullanın.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {user.customerId ? (
                        <section className="space-y-4 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-neutral-900">Müşteri İletişim Bilgileri</h3>
                                <p className="text-xs text-neutral-500">
                                    {isSelfMode
                                        ? "Portal müşteri hesabınızın iletişim kartında görünen rol ve departman bilgileri."
                                        : "Portal müşteriye bağlı kullanıcıların iletişim kartında görünen alanlar."}
                                </p>
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

                            {isSelfMode ? (
                                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
                                    {user.isPrimaryCustomerContact
                                        ? "Bu hesap şu anda ana müşteri yetkilisi olarak işaretli. Bu durum Ceyhunlar ekibi tarafından yönetilir."
                                        : "Ana yetkili seçimi bu ekrandan değiştirilemez; gerekirse Ceyhunlar ekibi tarafından güncellenir."}
                                </div>
                            ) : (
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
                                                Aynı müşteri altında yalnızca bir kullanıcı ana yetkili olabilir. Bu seçim müşteri özetlerinde öncelikli görünür.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : null}

                    <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4">
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Değişiklik Özeti</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className={cn("rounded-full", plan.profileChanged ? "border-sky-200 bg-sky-50 text-sky-700" : "border-neutral-200 bg-white text-neutral-500")}>
                                {plan.profileChanged ? "Profil güncellenecek" : "Bekleyen değişiklik yok"}
                            </Badge>
                        </div>
                    </div>

                    <DialogFooter className="border-t border-neutral-200 pt-5">
                        <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
                            Vazgeç
                        </Button>
                        <Button type="submit" className="min-w-36 rounded-xl" disabled={isSaving || !plan.profileChanged}>
                            {isSaving ? <Spinner className="size-4" /> : null}
                            {isSaving ? "Kaydediliyor" : "Profili Kaydet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
