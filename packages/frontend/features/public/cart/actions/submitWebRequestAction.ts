"use server"

import { publicServerClient } from "@/lib/http/serverClient"
import { webRequestFormSchema, type WebRequestFormValues } from "@/features/public/cart/schema/webRequest"

type SubmitResult =
    | { ok: true; message: string }
    | { ok: false; message: string; fieldErrors?: Record<string, string[]> }

export async function submitWebRequestAction(input: WebRequestFormValues): Promise<SubmitResult> {
    const parsed = webRequestFormSchema.safeParse(input)

    if (!parsed.success) {
        return {
            ok: false,
            message: "Form doğrulaması başarısız.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        }
    }

    const payload = {
        ...parsed.data,
        phone: parsed.data.phone || undefined,
        message: parsed.data.message || undefined,
    }

    try {
        await publicServerClient().post("/web-requests", payload)
        return {
            ok: true,
            message: "Talebiniz başarıyla kaydedildi.",
        }
    } catch (error) {
        console.error("submitWebRequestAction error:", error)
        return {
            ok: false,
            message: "Talep gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        }
    }
}

