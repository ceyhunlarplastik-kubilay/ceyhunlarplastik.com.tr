"use client"

import { Link } from "@/i18n/navigation"
import { useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2, Send, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useInquiryCartStore } from "@/features/public/cart/store/useInquiryCartStore"
import { submitWebRequestAction } from "@/features/public/cart/actions/submitWebRequestAction"
import { webRequestFormSchema, type WebRequestFormValues } from "@/features/public/cart/schema/webRequest"

const contactSchema = webRequestFormSchema.omit({ items: true })
type ContactFormValues = Omit<WebRequestFormValues, "items">

export default function InquiryCartPageClient() {
    const t = useTranslations("public.cart")
    const [isPending, startTransition] = useTransition()
    const [submitMessage, setSubmitMessage] = useState<string | null>(null)

    const items = useInquiryCartStore((state) => state.items)
    const removeItem = useInquiryCartStore((state) => state.removeItem)
    const clear = useInquiryCartStore((state) => state.clear)

    const totalItems = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items]
    )

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            message: "",
        },
    })

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
        reset,
    } = form

    const onSubmit = (values: ContactFormValues) => {
        setSubmitMessage(null)

        startTransition(async () => {
            const result = await submitWebRequestAction({
                ...values,
                items,
            })

            if (!result.ok) {
                if (result.fieldErrors) {
                    for (const [field, messages] of Object.entries(result.fieldErrors)) {
                        if (!messages?.length) continue
                        setError(field as keyof ContactFormValues, {
                            type: "server",
                            message: messages[0],
                        })
                    }
                }
                setSubmitMessage(result.message)
                toast.error(result.message)
                return
            }

            toast.success(result.message)
            setSubmitMessage(result.message)
            clear()
            reset({
                name: "",
                email: "",
                phone: "",
                message: "",
            })
        })
    }

    return (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                    <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
                        <p className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <ShoppingCart className="h-4 w-4" />
                            {t("itemsLabel")}
                        </p>
                        <Badge variant="secondary">{t("itemCount", { count: totalItems })}</Badge>
                    </div>

                    {items.length === 0 ? (
                        <div className="p-5 text-sm text-neutral-500">
                            {t("emptyText")}{" "}
                            <Link href="/urunler/filtre" className="text-[var(--color-brand)] underline">
                                {t("emptyLink")}
                            </Link>
                            .
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map((item) => (
                                <div key={`${item.productId}:${item.variantKey}:${item.variantId ?? ""}`} className="flex items-start justify-between gap-3 p-4 sm:p-5">
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-semibold text-neutral-900 truncate">{item.productName}</p>
                                        <p className="text-xs text-neutral-500">{t("codeLabel")} {item.productCode}</p>
                                        <p className="text-xs text-neutral-600">
                                            {t("variantLabel")} {item.variantFullCode || item.variantKey}
                                        </p>
                                        <p className="text-xs text-neutral-600">{t("quantityLabel")} {item.quantity}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label={t("removeAria")}
                                        onClick={() => removeItem(item.productId, item.variantKey, item.variantId)}
                                    >
                                        <Trash2 className="h-4 w-4 text-neutral-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-5">
                <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="text-lg font-semibold text-neutral-900">{t("formTitle")}</h2>
                    <p className="mt-1 text-sm text-neutral-500">{t("formSubtitle")}</p>

                    <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-1">
                            <Input placeholder={t("fields.name")} {...register("name")} />
                            {errors.name?.message && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Input type="email" placeholder={t("fields.email")} {...register("email")} />
                            {errors.email?.message && <p className="text-xs text-red-600">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Input placeholder={t("fields.phone")} {...register("phone")} />
                            {errors.phone?.message && <p className="text-xs text-red-600">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Textarea rows={4} placeholder={t("fields.message")} {...register("message")} />
                            {errors.message?.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
                        </div>

                        {submitMessage && (
                            <p className="text-sm text-neutral-600">{submitMessage}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending || items.length === 0}
                            className="h-11 w-full bg-[var(--color-brand)] text-white hover:opacity-95"
                        >
                            {isPending ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    {t("submitting")}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    {t("submit")}
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </section>
    )
}
