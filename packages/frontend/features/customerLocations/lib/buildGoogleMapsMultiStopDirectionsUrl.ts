type LatLng = { lat: number; lng: number }

/**
 * Google Maps tüketici arayüzü (web/uygulama) toplam durak sayısını pratikte
 * sınırlar: başlangıç + bitiş + en fazla 8 ara durak. Bu sınırı aşan bir rota
 * linki eksik/başarısız açılabilir; UI bu sabitle kullanıcıyı uyarır.
 */
export const GOOGLE_MAPS_URL_MAX_INTERMEDIATE_STOPS = 8

/**
 * `waypoints` sırası olduğu gibi korunur — bu URL şeması otomatik yeniden
 * sıralama yapmaz, dolayısıyla Routes API'nin optimize ettiği sırayı burada
 * vermek Google Maps'te de aynı ziyaret sırasını açar.
 */
export function buildGoogleMapsMultiStopDirectionsUrl(
    origin: LatLng,
    destination: LatLng,
    waypoints: LatLng[],
) {
    const params = new URLSearchParams({
        api: "1",
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        travelmode: "driving",
    })

    if (waypoints.length) {
        params.set("waypoints", waypoints.map((point) => `${point.lat},${point.lng}`).join("|"))
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`
}
