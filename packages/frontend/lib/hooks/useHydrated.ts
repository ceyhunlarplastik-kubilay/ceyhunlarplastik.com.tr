import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * SSR-güvenli "hydrate oldum mu" bayrağı.
 *
 * Sunucuda ve ilk client render'ında `false`, hydration sonrası `true` döner —
 * eski `useState(false)` + `useEffect(() => setMounted(true), [])` deseniyle
 * BİREBİR aynı davranış, ama setState-in-effect üretmez (React'in hydration
 * tespiti için önerdiği useSyncExternalStore yaklaşımı).
 *
 * Kullanım: yalnız client'ta anlamlı olan, aksi halde hydration mismatch
 * yaratacak içerikleri (Radix üretimi id'ler, persist edilmiş store sayaçları)
 * geciktirmek için.
 */
export function useHydrated() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    )
}
