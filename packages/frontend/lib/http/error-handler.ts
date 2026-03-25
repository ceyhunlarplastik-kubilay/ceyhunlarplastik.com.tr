import axios from "axios"
import { toast } from "sonner"

function notifyError(message: string) {
    if (typeof window === "undefined") {
        console.error(`[HTTP] ${message}`)
        return
    }

    if (typeof toast?.error === "function") {
        toast.error(message)
    }
}

export function handleApiError(error: unknown) {

    if (!axios.isAxiosError(error)) {
        notifyError("Beklenmeyen bir hata oluştu")
        return Promise.reject(error)
    }

    const status = error.response?.status
    const data = error.response?.data as any

    const message =
        data?.error?.message ||
        data?.message ||
        "Bir hata oluştu"

    if (status === 401) {
        notifyError("Yetkisiz erişim")
    }

    else if (status === 403) {
        notifyError("Bu işlem için yetkiniz yok")
    }

    else if (status === 404) {
        notifyError("Kayıt bulunamadı")
    }

    else if (status === 500) {
        notifyError("Sunucu hatası")
    }

    else {
        notifyError(message)
    }

    return Promise.reject(error)
}
