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
import { AuthOtpField } from "@/features/auth/components/AuthOtpField"
import { useConfirmSignUp } from "@/features/auth/hooks/useConfirmSignUp"
import { useTranslations } from "next-intl"
import { useResendConfirmation } from "@/features/auth/hooks/useResendConfirmation"
import { resolveAuthErrorKey } from "@/features/auth/lib/errors"
import { buildConfirmSignUpSchema, type ConfirmSignUpFormValues } from "@/features/auth/schema/confirmSignUp"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function ConfirmSignUpPageClient({ callbackUrl, initialEmail }: Props) {
    const t = useTranslations("auth.confirmSignUp")
    const tv = useTranslations("auth.validation.confirmSignUp")
    const router = useRouter()
    const confirmMutation = useConfirmSignUp()
    const resendMutation = useResendConfirmation()

    const form = useForm<ConfirmSignUpFormValues>({
        resolver: zodResolver(useMemo(() => buildConfirmSignUpSchema(tv), [tv])),
        defaultValues: {
            email: initialEmail ?? "",
            code: "",
        },
    })

    const activeError = confirmMutation.error instanceof AuthApiClientError
        ? confirmMutation.error
        : resendMutation.error instanceof AuthApiClientError
            ? resendMutation.error
            : null

    const te = useTranslations("auth.errors")
    const errorKey = resolveAuthErrorKey(activeError?.code)
    const errorMessage = errorKey ? { title: te(`${errorKey}.title`), description: te(`${errorKey}.description`) } : null

    async function onSubmit(values: ConfirmSignUpFormValues) {
        const result = await confirmMutation.mutateAsync({
            email: values.email.trim().toLowerCase(),
            code: values.code.trim(),
        })

        toast.success(t("successToast"))
        router.push(`/auth/awaiting-approval?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }

    async function handleResend() {
        const email = form.getValues("email").trim().toLowerCase()
        if (!email) {
            form.setError("email", { message: t("emailRequiredError") })
            return
        }

        await resendMutation.mutateAsync({ email })
        toast.success(t("resendToast"))
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
                    <AuthField control={form.control} name="email" label={t("emailLabel")} type="email" placeholder={t("emailPlaceholder")} disabled={confirmMutation.isPending || resendMutation.isPending} />
                    <AuthOtpField
                        control={form.control}
                        name="code"
                        label={t("codeLabel")}
                        description={t("codeDescription")}
                        disabled={confirmMutation.isPending || resendMutation.isPending}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button type="submit" variant="brand" size="lg" className="h-11 flex-1 rounded-xl" disabled={confirmMutation.isPending || resendMutation.isPending}>
                            {confirmMutation.isPending ? t("submitting") : t("submit")}
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="h-11 rounded-xl px-5" disabled={confirmMutation.isPending || resendMutation.isPending} onClick={() => void handleResend()}>
                            {resendMutation.isPending ? t("resending") : t("resend")}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-slate-700 hover:text-slate-950">
                    {t("backToSignIn")}
                </Link>
                <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(initialEmail ?? "")}`} className="hover:text-slate-950">
                    {t("editEmail")}
                </Link>
            </div>
        </div>
    )
}
