"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { PasswordField } from "@/components/ui/password-field"
import { AuthApiClientError } from "@/features/auth/api/types"
import { AuthField } from "@/features/auth/components/AuthField"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"
import { AuthOtpField } from "@/features/auth/components/AuthOtpField"
import { useTranslations } from "next-intl"
import { useConfirmForgotPassword } from "@/features/auth/hooks/useConfirmForgotPassword"
import { resolveAuthErrorKey } from "@/features/auth/lib/errors"
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/schema/resetPassword"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function ResetPasswordPageClient({ callbackUrl, initialEmail }: Props) {
    const router = useRouter()
    const mutation = useConfirmForgotPassword()
    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: initialEmail ?? "",
            code: "",
            password: "",
            confirmPassword: "",
        },
    })

    const te = useTranslations("auth.errors")
    const errorCode = mutation.error instanceof AuthApiClientError ? mutation.error.code : undefined
    const errorKey = resolveAuthErrorKey(errorCode)
    const errorMessage = errorKey ? { title: te(`${errorKey}.title`), description: te(`${errorKey}.description`) } : null
    const password = useWatch({ control: form.control, name: "password" })
    const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" })

    async function onSubmit(values: ResetPasswordFormValues) {
        const result = await mutation.mutateAsync({
            email: values.email.trim().toLowerCase(),
            code: values.code.trim(),
            password: values.password,
        })

        toast.success("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.")
        router.push(`/auth/signin?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}&notice=password-reset`)
    }

    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="info"
                title="Yeni şifre belirleyin"
                description="E-postanıza gelen kod ile yeni şifrenizi tanımlayın. AWS Cognito şifre sıfırlama kodları 1 saat geçerlidir."
            />

            {errorMessage ? (
                <AuthFeedbackMessage variant="error" title={errorMessage.title} description={errorMessage.description} />
            ) : null}

            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <AuthField control={form.control} name="email" label="E-posta" type="email" placeholder="ornek@ceyhunlar.com" disabled={mutation.isPending} />
                    <AuthOtpField
                        control={form.control}
                        name="code"
                        label="Doğrulama Kodu"
                        description="Kodun geçerlilik süresi 1 saattir."
                        disabled={mutation.isPending}
                    />

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-900">Yeni Şifre</label>
                        <PasswordField
                            value={password ?? ""}
                            onChange={(value) => form.setValue("password", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                            placeholder="En az 8 karakter"
                            disabled={mutation.isPending}
                            showChecklist
                            showStrength
                            autoComplete="new-password"
                        />
                        {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-900">Yeni Şifre Tekrarı</label>
                        <PasswordField
                            value={confirmPassword ?? ""}
                            onChange={(value) => form.setValue("confirmPassword", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                            placeholder="Şifreyi tekrar girin"
                            disabled={mutation.isPending}
                            showStrength={false}
                            autoComplete="new-password"
                        />
                        {form.formState.errors.confirmPassword ? <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p> : null}
                    </div>

                    <Button type="submit" variant="brand" size="lg" className="h-11 w-full rounded-xl" disabled={mutation.isPending}>
                        {mutation.isPending ? "Şifre Güncelleniyor..." : "Şifreyi Güncelle"}
                    </Button>
                </form>
            </Form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <Link href={`/auth/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(initialEmail ?? "")}`} className="font-medium text-slate-700 hover:text-slate-950">
                    Kodu yeniden iste
                </Link>
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="hover:text-slate-950">
                    Giriş ekranına dön
                </Link>
            </div>
        </div>
    )
}
