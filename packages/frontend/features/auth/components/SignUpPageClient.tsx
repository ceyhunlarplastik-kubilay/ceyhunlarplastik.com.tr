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
import { useAuthSignUp } from "@/features/auth/hooks/useAuthSignUp"
import { getAuthErrorMessage } from "@/features/auth/lib/errors"
import { signUpSchema, type SignUpFormValues } from "@/features/auth/schema/signUp"

type Props = {
    callbackUrl: string
    initialEmail?: string
}

export function SignUpPageClient({ callbackUrl, initialEmail }: Props) {
    const router = useRouter()
    const mutation = useAuthSignUp()
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: initialEmail ?? "",
            password: "",
            confirmPassword: "",
        },
    })

    const errorCode = mutation.error instanceof AuthApiClientError ? mutation.error.code : undefined
    const errorMessage = getAuthErrorMessage(errorCode)
    const password = useWatch({ control: form.control, name: "password" })
    const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" })

    async function onSubmit(values: SignUpFormValues) {
        const result = await mutation.mutateAsync({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim().toLowerCase(),
            password: values.password,
        })

        toast.success("Doğrulama kodu e-posta adresinize gönderildi.")
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
                        <AuthField control={form.control} name="firstName" label="Ad" placeholder="Adınız" disabled={mutation.isPending} />
                        <AuthField control={form.control} name="lastName" label="Soyad" placeholder="Soyadınız" disabled={mutation.isPending} />
                    </div>

                    <AuthField control={form.control} name="email" label="E-posta" type="email" placeholder="ornek@ceyhunlar.com" disabled={mutation.isPending} />

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-900">Şifre</label>
                        <PasswordField
                            value={password ?? ""}
                            onChange={(value) => form.setValue("password", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                            placeholder="En az 8 karakter"
                            disabled={mutation.isPending}
                            showChecklist
                            showStrength
                            showGenerate
                            autoComplete="new-password"
                        />
                        {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-900">Şifre Tekrarı</label>
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
                        {mutation.isPending ? "Kayıt Oluşturuluyor..." : "Hesap Oluştur"}
                    </Button>
                </form>
            </Form>

            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                        Giriş yapın
                    </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="h-11 rounded-xl px-4 text-slate-600 hover:text-slate-950">
                    <Link href="/">
                        Ana sayfaya git
                    </Link>
                </Button>
            </div>
        </div>
    )
}
