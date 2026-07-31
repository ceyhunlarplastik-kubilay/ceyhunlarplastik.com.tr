"use client"

import { useState } from "react"

import { ADMIN_DEFAULT_LOCALE, type AdminLocale } from "./adminLocales"

/**
 * Aktif çeviri dili; `resetKey` her değiştiğinde varsayılan dile döner.
 *
 * Dialog'larda `resetKey` olarak `open` geçilir: yeni bir kayıt açıldığında
 * önceki oturumdan kalan dil seçimi (ör. Korece) taşınmaz, form yine Türkçe
 * başlar.
 *
 * NEDEN EFFECT DEĞİL: sıfırlamayı `useEffect` içinde yapmak render → effect →
 * setState → yeniden render zinciri kuruyor ve React'in "you might not need an
 * effect" kuralı bunu haklı olarak hata sayıyor. Render sırasında prop
 * değişimine göre state düzeltmek React'in önerdiği desen: React aynı render
 * içinde yeniden çalışır, DOM'a fazladan bir tur yansımaz.
 */
export function useActiveTranslationLocale(resetKey: unknown) {
    const [locale, setLocale] = useState<AdminLocale>(ADMIN_DEFAULT_LOCALE)
    const [lastResetKey, setLastResetKey] = useState(resetKey)

    if (resetKey !== lastResetKey) {
        setLastResetKey(resetKey)
        setLocale(ADMIN_DEFAULT_LOCALE)
    }

    return [locale, setLocale] as const
}
