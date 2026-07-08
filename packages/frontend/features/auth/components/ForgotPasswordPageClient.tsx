"use client"

import { useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuthApiClientError } from "@/features/auth/api/types"
import { AuthField } from "@/features/auth/components/AuthField"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"
import { useTranslations } from "next-intl"
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword"
import { resolveAuthErrorKey } from "@/features/auth/lib/errors"
import { buildForgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schema/forgotPassword"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function ForgotPasswordPageClient({ callbackUrl, initialEmail }: Props) {
    const t = useTranslations("auth.forgotPassword")
    const te = useTranslations("auth.errors")
    const tv = useTranslations("auth.validation.forgotPassword")
    const router = useRouter()
    const mutation = useForgotPassword()
    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(useMemo(() => buildForgotPasswordSchema(tv), [tv])),
        defaultValues: {
            email: initialEmail ?? "",
        },
    })

    const errorCode = mutation.error instanceof AuthApiClientError ? mutation.error.code : undefined
    const errorKey = resolveAuthErrorKey(errorCode)
    const errorMessage = errorKey ? { title: te(`${errorKey}.title`), description: te(`${errorKey}.description`) } : null

    async function onSubmit(values: ForgotPasswordFormValues) {
        const result = await mutation.mutateAsync({
            email: values.email.trim().toLowerCase(),
        })

        toast.success(t("codeSentToast"))
        router.push(`/auth/reset-password?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }

    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="info"
                title={t("infoTitle")}
                description={t("infoDescription")}
            />

            {errorMessage ? (
                <AuthFeedbackMessage variant="error" title={errorMessage.title} description={errorMessage.description} />
            ) : null}

            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <AuthField control={form.control} name="email" label={t("emailLabel")} type="email" placeholder={t("emailPlaceholder")} disabled={mutation.isPending} />

                    <Button type="submit" variant="brand" size="lg" className="h-11 w-full rounded-xl" disabled={mutation.isPending}>
                        {mutation.isPending ? t("submitting") : t("submit")}
                    </Button>
                </form>
            </Form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-slate-700 hover:text-slate-950">
                    {t("backToSignIn")}
                </Link>
                <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="hover:text-slate-950">
                    {t("createAccount")}
                </Link>
            </div>
        </div>
    )
}
