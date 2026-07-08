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
import { useTranslations } from "next-intl"
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword"
import { resolveAuthErrorKey } from "@/features/auth/lib/errors"
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schema/forgotPassword"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function ForgotPasswordPageClient({ callbackUrl, initialEmail }: Props) {
    const router = useRouter()
    const mutation = useForgotPassword()
    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: initialEmail ?? "",
        },
    })

    const te = useTranslations("auth.errors")
    const errorCode = mutation.error instanceof AuthApiClientError ? mutation.error.code : undefined
    const errorKey = resolveAuthErrorKey(errorCode)
    const errorMessage = errorKey ? { title: te(`${errorKey}.title`), description: te(`${errorKey}.description`) } : null

    async function onSubmit(values: ForgotPasswordFormValues) {
        const result = await mutation.mutateAsync({
            email: values.email.trim().toLowerCase(),
        })

        toast.success("Şifre sıfırlama kodu gönderildi.")
        router.push(`/auth/reset-password?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }

    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="info"
                title="Şifre sıfırlama"
                description="Hesabınıza bağlı e-posta adresini girin. Yeni şifre belirlemeniz için doğrulama kodu gönderelim. AWS Cognito şifre sıfırlama kodları 1 saat geçerlidir."
            />

            {errorMessage ? (
                <AuthFeedbackMessage variant="error" title={errorMessage.title} description={errorMessage.description} />
            ) : null}

            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <AuthField control={form.control} name="email" label="E-posta" type="email" placeholder="ornek@ceyhunlar.com" disabled={mutation.isPending} />

                    <Button type="submit" variant="brand" size="lg" className="h-11 w-full rounded-xl" disabled={mutation.isPending}>
                        {mutation.isPending ? "Kod Gönderiliyor..." : "Sıfırlama Kodu Gönder"}
                    </Button>
                </form>
            </Form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-slate-700 hover:text-slate-950">
                    Giriş ekranına dön
                </Link>
                <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="hover:text-slate-950">
                    Yeni hesap oluştur
                </Link>
            </div>
        </div>
    )
}
