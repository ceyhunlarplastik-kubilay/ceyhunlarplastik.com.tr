import axios from "axios"
import { toast } from "sonner"

export function handleApiError(error: unknown) {

    if (!axios.isAxiosError(error)) {
        toast.error("Beklenmeyen bir hata oluştu")
        return Promise.reject(error)
    }

    const status = error.response?.status
    const data = error.response?.data as any

    const message =
        data?.error?.message ||
        data?.message ||
        "Bir hata oluştu"

    if (status === 401) {
        toast.error("Yetkisiz erişim")
    }

    else if (status === 403) {
        toast.error("Bu işlem için yetkiniz yok")
    }

    else if (status === 404) {
        toast.error("Kayıt bulunamadı")
    }

    else if (status === 500) {
        toast.error("Sunucu hatası")
    }

    else {
        toast.error(message)
    }

    return Promise.reject(error)
}