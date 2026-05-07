"use client"

import Link from "next/link"
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
import { useResendConfirmation } from "@/features/auth/hooks/useResendConfirmation"
import { getAuthErrorMessage } from "@/features/auth/lib/errors"
import { confirmSignUpSchema, type ConfirmSignUpFormValues } from "@/features/auth/schema/confirmSignUp"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function ConfirmSignUpPageClient({ callbackUrl, initialEmail }: Props) {
    const router = useRouter()
    const confirmMutation = useConfirmSignUp()
    const resendMutation = useResendConfirmation()

    const form = useForm<ConfirmSignUpFormValues>({
        resolver: zodResolver(confirmSignUpSchema),
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

    const errorMessage = getAuthErrorMessage(activeError?.code)

    async function onSubmit(values: ConfirmSignUpFormValues) {
        const result = await confirmMutation.mutateAsync({
            email: values.email.trim().toLowerCase(),
            code: values.code.trim(),
        })

        toast.success("Hesabınız doğrulandı. Giriş yapabilirsiniz.")
        router.push(`/auth/signin?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}&notice=confirmed`)
    }

    async function handleResend() {
        const email = form.getValues("email").trim().toLowerCase()
        if (!email) {
            form.setError("email", { message: "Kod gönderebilmek için e-posta adresi gerekli." })
            return
        }

        await resendMutation.mutateAsync({ email })
        toast.success("Yeni doğrulama kodu gönderildi.")
    }

    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="info"
                title="Hesabınızı doğrulayın"
                description="E-posta adresinize gelen doğrulama kodunu girin. Kod ulaşmadıysa yeni kod talep edebilirsiniz. AWS Cognito doğrulama kodları 24 saat geçerlidir."
            />

            {errorMessage ? (
                <AuthFeedbackMessage variant="error" title={errorMessage.title} description={errorMessage.description} />
            ) : null}

            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <AuthField control={form.control} name="email" label="E-posta" type="email" placeholder="ornek@ceyhunlar.com" disabled={confirmMutation.isPending || resendMutation.isPending} />
                    <AuthOtpField
                        control={form.control}
                        name="code"
                        label="Doğrulama Kodu"
                        description="Kod e-postadaki mesajda yer alır ve 24 saat boyunca geçerlidir."
                        disabled={confirmMutation.isPending || resendMutation.isPending}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button type="submit" variant="brand" size="lg" className="h-11 flex-1 rounded-xl" disabled={confirmMutation.isPending || resendMutation.isPending}>
                            {confirmMutation.isPending ? "Doğrulanıyor..." : "Hesabı Doğrula"}
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="h-11 rounded-xl px-5" disabled={confirmMutation.isPending || resendMutation.isPending} onClick={() => void handleResend()}>
                            {resendMutation.isPending ? "Gönderiliyor..." : "Kodu Yeniden Gönder"}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-slate-700 hover:text-slate-950">
                    Giriş ekranına dön
                </Link>
                <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(initialEmail ?? "")}`} className="hover:text-slate-950">
                    E-postayı düzenle
                </Link>
            </div>
        </div>
    )
}
