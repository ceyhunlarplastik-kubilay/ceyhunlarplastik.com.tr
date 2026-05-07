"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PasswordField } from "@/components/ui/password-field"
import { AuthApiClientError } from "@/features/auth/api/types"
import { AuthField } from "@/features/auth/components/AuthField"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"
import { useAuthSignIn } from "@/features/auth/hooks/useAuthSignIn"
import { getAuthErrorMessage } from "@/features/auth/lib/errors"
import { signInSchema, type SignInFormValues } from "@/features/auth/schema/signIn"

type Props = {
    callbackUrl: string
    error?: string
    initialEmail?: string
    notice?: string
}

const noticeMap: Record<string, { title: string; description: string }> = {
    confirmed: {
        title: "Hesabınız doğrulandı",
        description: "Şimdi e-posta adresiniz ve şifrenizle giriş yapabilirsiniz.",
    },
    "password-reset": {
        title: "Şifreniz güncellendi",
        description: "Yeni şifrenizle oturum açabilirsiniz.",
    },
}

export function SignInPageClient({ callbackUrl, error, initialEmail, notice }: Props) {
    const router = useRouter()
    const mutation = useAuthSignIn()
    const form = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: initialEmail ?? "",
            password: "",
        },
    })

    const runtimeErrorCode = mutation.error instanceof AuthApiClientError ? mutation.error.code : undefined
    const errorMessage = getAuthErrorMessage(runtimeErrorCode ?? error)
    const watchedEmail = useWatch({ control: form.control, name: "email" })
    const watchedPassword = useWatch({ control: form.control, name: "password" })
    const activeEmail = watchedEmail || initialEmail || ""
    const currentNotice = notice ? noticeMap[notice] : null

    async function onSubmit(values: SignInFormValues) {
        const result = await mutation.mutateAsync({
            email: values.email.trim().toLowerCase(),
            password: values.password,
            callbackUrl,
        })

        router.push(result.url ?? callbackUrl)
        router.refresh()
    }

    return (
        <div className="space-y-5">
            {currentNotice ? (
                <AuthFeedbackMessage variant="success" title={currentNotice.title} description={currentNotice.description} />
            ) : null}

            {errorMessage ? (
                <AuthFeedbackMessage variant="error" title={errorMessage.title} description={errorMessage.description} />
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                Merkezi Kimlik Doğrulama
                            </Badge>
                            <div className="text-sm leading-6 text-slate-500">
                                Giriş, kayıt ve şifre sıfırlama akışları uygulama içinde yönetilir.
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Mevcut hedef: <span className="font-medium text-slate-800">{callbackUrl}</span>
                        </div>
                    </div>

                    <Form {...form}>
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                            <AuthField control={form.control} name="email" label="E-posta" type="email" placeholder="ornek@ceyhunlar.com" disabled={mutation.isPending} />

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-900">Şifre</label>
                                <PasswordField
                                    value={watchedPassword ?? ""}
                                    onChange={(value) => form.setValue("password", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                                    placeholder="Şifrenizi girin"
                                    disabled={mutation.isPending}
                                    showStrength={false}
                                    autoComplete="current-password"
                                />
                                {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button type="submit" variant="brand" size="lg" className="h-11 flex-1 rounded-xl px-5" disabled={mutation.isPending}>
                                    {mutation.isPending ? <LockKeyhole className="h-4 w-4 animate-pulse" /> : <ShieldCheck className="h-4 w-4" />}
                                    {mutation.isPending ? "Giriş Yapılıyor..." : "Giriş Yap"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>

                                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                                    <Link href={`/auth/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(activeEmail)}`}>
                                        Şifremi Unuttum
                                    </Link>
                                </Button>
                            </div>

                            {runtimeErrorCode === "USER_NOT_CONFIRMED" ? (
                                <Button asChild variant="outline" className="h-10 w-full rounded-xl border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800">
                                    <Link href={`/auth/confirm-signup?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(activeEmail)}`}>
                                        Hesabımı Doğrula
                                    </Link>
                                </Button>
                            ) : null}
                        </form>
                    </Form>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(activeEmail)}`}>
                        Yeni hesap oluştur
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-4 text-slate-600 hover:text-slate-950">
                    <Link href="/">
                        Ana sayfaya git
                    </Link>
                </Button>
            </div>
        </div>
    )
}
