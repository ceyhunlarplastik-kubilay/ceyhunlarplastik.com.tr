import * as React from "react"

const MOBILE_BREAKPOINT = 768

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * shadcn'in ürettiği hâlinden SAPMA (bilerek): orijinali `useState` + `useEffect`
 * içinde senkron `setState` çağırıyordu; bu hem projenin lint kuralını
 * ("Calling setState synchronously within an effect") ihlal ediyor hem de ilk
 * boyanmadan sonra fazladan bir render turu üretiyordu.
 *
 * `useSyncExternalStore` aynı işi tek turda yapar ve sunucu anlık görüntüsü
 * açıkça `false`'tur (sunucuda viewport bilinmez — masaüstü varsayılır, mobil
 * Sheet istemcide devreye girer).
 *
 * `npx shadcn add sidebar --overwrite` bu dosyayı geri alırsa lint yeniden düşer.
 */
function subscribe(onStoreChange: () => void) {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    mediaQuery.addEventListener("change", onStoreChange)
    return () => mediaQuery.removeEventListener("change", onStoreChange)
}

export function useIsMobile() {
    return React.useSyncExternalStore(
        subscribe,
        () => window.matchMedia(MOBILE_QUERY).matches,
        () => false,
    )
}
