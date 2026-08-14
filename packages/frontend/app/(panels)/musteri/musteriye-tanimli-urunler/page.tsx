import { permanentRedirect } from "next/navigation"

/**
 * Sayfa "Favori Ürün Varyantlarım" olarak yeniden adlandırıldı ve
 * /musteri/favori-varyantlarim adresine taşındı. Bu route yalnız eski yer
 * imlerini ve dışarıda kalmış linkleri yönlendirmek için duruyor.
 */
export default function CustomerPortalAssignedProductsRedirectPage(): never {
    permanentRedirect("/musteri/favori-varyantlarim")
}
