"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * Sayfa geçiş animasyonu — tüm public rotalar.
 *
 * template.tsx layout'un AKSİNE her navigasyonda yeniden mount olur; App Router'da
 * sayfa geçişi animasyonunun idiomatik yeri burasıdır (aynı desen `(auth)` altında da var).
 * Navbar/Footer layout'ta kaldığı için geçişte yeniden animasyona girmez, yalnız içerik.
 *
 * Not: App Router template'i AnimatePresence ile sarılmadığı için `exit` çalışmaz —
 * bilerek eklenmedi. Giriş animasyonu kısa tutuldu (0.25s): daha uzunu, sayfa hazır
 * olmasına rağmen gecikme HİSSİ yaratır.
 */
export default function PublicTemplate({
    children,
}: {
    children: React.ReactNode
}) {
    const reduce = useReducedMotion()

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    )
}
