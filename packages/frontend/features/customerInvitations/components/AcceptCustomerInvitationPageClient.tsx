"use client"

import axios from "axios"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { PasswordField } from "@/components/ui/password-field"
import { Spinner } from "@/components/ui/spinner"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"
import { useAcceptCustomerInvitation } from "@/features/customerInvitations/hooks/useAcceptCustomerInvitation"
import { useCustomerInvitation } from "@/features/customerInvitations/hooks/useCustomerInvitation"
import {
    acceptCustomerInvitationSchema,
    type AcceptCustomerInvitationFormValues,
} from "@/features/customerInvitations/schema/acceptCustomerInvitation"

type Props = {
    initialToken?: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
        return data?.error?.message || data?.message || error.message || fallback
    }

    if (error instanceof Error) {
        return error.message
    }

    return fallback
}

function formatExpiresAt(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(date)
}

export function AcceptCustomerInvitationPageClient({ initialToken = "" }: Props) {
    const router = useRouter()
    const token = initialToken.trim()
    const invitationQuery = useCustomerInvitation(token)
    const acceptMutation = useAcceptCustomerInvitation()
    const form = useForm<AcceptCustomerInvitationFormValues>({
        resolver: zodResolver(acceptCustomerInvitationSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })
    const password = useWatch({ control: form.control, name: "password" })
    const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" })
    const invitation = invitationQuery.data

    const errorMessage = !token
        ? "Davet baglantisinda token bulunamadi."
        : invitationQuery.isError
            ? getApiErrorMessage(invitationQuery.error, "Davet bilgisi yuklenemedi.")
            : acceptMutation.isError
                ? getApiErrorMessage(acceptMutation.error, "Davet kabul edilemedi.")
                : null

    async function onSubmit(values: AcceptCustomerInvitationFormValues) {
        if (!token) return

        const result = await acceptMutation.mutateAsync({
            token,
            password: values.password,
        })

        toast.success("Davet kabul edildi. Yeni sifrenizle giris yapabilirsiniz.")
        router.push(`/auth/signin?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent("/musteri")}&notice=invite-accepted`)
    }

    return (
        <div className="space-y-6">
            {!token ? (
                <AuthFeedbackMessage
                    variant="error"
                    title="Gecersiz davet baglantisi"
                    description="Link eksik veya bozuk gorunuyor. Daveti yeniden istemeniz gerekebilir."
                />
            ) : invitationQuery.isLoading ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
                    <Spinner className="size-5" />
                </div>
            ) : invitation ? (
                <AuthFeedbackMessage
                    variant="info"
                    title="Davetiniz hazir"
                    description={`${invitation.customerName} musteri portali icin sifrenizi belirleyip giris yapabilirsiniz.`}
                />
            ) : null}

            {errorMessage ? (
                <AuthFeedbackMessage
                    variant="error"
                    title="Davet kullanilamadi"
                    description={errorMessage}
                />
            ) : null}

            {invitation ? (
                <>
                    <section className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Davet Ozeti
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Musteri</div>
                                <div className="mt-2 text-sm font-semibold text-slate-950">{invitation.customerName}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">E-posta</div>
                                <div className="mt-2 text-sm font-semibold text-slate-950">{invitation.email}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Gorev</div>
                                <div className="mt-2 text-sm font-semibold text-slate-950">
                                    {invitation.customerContactTitle || "Portal kullanicisi"}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Departman</div>
                                <div className="mt-2 text-sm font-semibold text-slate-950">
                                    {invitation.customerContactDepartment || "Belirtilmedi"}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Son Gecerlilik</div>
                                <div className="mt-2 text-sm font-semibold text-slate-950">{formatExpiresAt(invitation.expiresAt)}</div>
                            </div>
                        </div>
                    </section>

                    <Form {...form}>
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-900">Sifre</label>
                                <PasswordField
                                    value={password ?? ""}
                                    onChange={(value) => form.setValue("password", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                                    placeholder="En az 8 karakter"
                                    disabled={acceptMutation.isPending}
                                    showChecklist
                                    showStrength
                                    showGenerate
                                    autoComplete="new-password"
                                />
                                {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-900">Sifre Tekrari</label>
                                <PasswordField
                                    value={confirmPassword ?? ""}
                                    onChange={(value) => form.setValue("confirmPassword", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                                    placeholder="Sifreyi tekrar girin"
                                    disabled={acceptMutation.isPending}
                                    showStrength={false}
                                    autoComplete="new-password"
                                />
                                {form.formState.errors.confirmPassword ? <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p> : null}
                            </div>

                            <Button type="submit" variant="brand" size="lg" className="h-11 w-full rounded-xl" disabled={acceptMutation.isPending}>
                                {acceptMutation.isPending ? "Davet Kabul Ediliyor..." : "Daveti Kabul Et"}
                            </Button>
                        </form>
                    </Form>
                </>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <Link href="/auth/signin" className="font-medium text-slate-700 hover:text-slate-950">
                    Giris ekranina don
                </Link>
                <Link href="/" className="hover:text-slate-950">
                    Ana sayfaya git
                </Link>
            </div>
        </div>
    )
}
