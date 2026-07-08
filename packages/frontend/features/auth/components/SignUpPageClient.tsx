"use client"

import { useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { PasswordField } from "@/components/ui/password-field"
import { AuthApiClientError } from "@/features/auth/api/types"
import { AuthField } from "@/features/auth/components/AuthField"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"
import { useAuthSignUp } from "@/features/auth/hooks/useAuthSignUp"
import { resolveAuthErrorKey } from "@/features/auth/lib/errors"
import { buildSignUpSchema, type SignUpFormValues } from "@/features/auth/schema/signUp"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function SignUpPageClient({ callbackUrl, initialEmail }: Props) {
    const t = useTranslations("auth.signUp")
    const te = useTranslations("auth.errors")
    const tv = useTranslations("auth.validation.signUp")
    const router = useRouter()
    const mutation = useAuthSignUp()
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(useMemo(() => buildSignUpSchema(tv), [tv])),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: initialEmail ?? "",
            password: "",
            confirmPassword: "",
        },
    })

    const errorCode = mutation.error instanceof AuthApiClientError ? mutation.error.code : undefined
    const errorKey = resolveAuthErrorKey(errorCode)
    const errorMessage = errorKey ? { title: te(`${errorKey}.title`), description: te(`${errorKey}.description`) } : null
    const password = useWatch({ control: form.control, name: "password" })
    const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" })

    async function onSubmit(values: SignUpFormValues) {
        const result = await mutation.mutateAsync({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim().toLowerCase(),
            password: values.password,
        })

        toast.success(t("codeSentToast"))
        router.push(`/auth/confirm-signup?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }

    return (
        <div className="space-y-5">
            {errorMessage ? (
                <AuthFeedbackMessage variant="error" title={errorMessage.title} description={errorMessage.description} />
            ) : null}

            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <AuthField control={form.control} name="firstName" label={t("firstNameLabel")} placeholder={t("firstNamePlaceholder")} disabled={mutation.isPending} />
                        <AuthField control={form.control} name="lastName" label={t("lastNameLabel")} placeholder={t("lastNamePlaceholder")} disabled={mutation.isPending} />
                    </div>

                    <AuthField control={form.control} name="email" label={t("emailLabel")} type="email" placeholder={t("emailPlaceholder")} disabled={mutation.isPending} />

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-900">{t("passwordLabel")}</label>
                        <PasswordField
                            value={password ?? ""}
                            onChange={(value) => form.setValue("password", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                            placeholder={t("passwordPlaceholder")}
                            disabled={mutation.isPending}
                            showChecklist
                            showStrength
                            showGenerate
                            autoComplete="new-password"
                        />
                        {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-900">{t("confirmPasswordLabel")}</label>
                        <PasswordField
                            value={confirmPassword ?? ""}
                            onChange={(value) => form.setValue("confirmPassword", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                            placeholder={t("confirmPasswordPlaceholder")}
                            disabled={mutation.isPending}
                            showStrength={false}
                            autoComplete="new-password"
                        />
                        {form.formState.errors.confirmPassword ? <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p> : null}
                    </div>

                    <Button type="submit" variant="brand" size="lg" className="h-11 w-full rounded-xl" disabled={mutation.isPending}>
                        {mutation.isPending ? t("submitting") : t("submit")}
                    </Button>
                </form>
            </Form>

            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                        {t("signInLink")}
                    </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="h-11 rounded-xl px-4 text-slate-600 hover:text-slate-950">
                    <Link href="/">
                        {t("goHome")}
                    </Link>
                </Button>
            </div>
        </div>
    )
}
