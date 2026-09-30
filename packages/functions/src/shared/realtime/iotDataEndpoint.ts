/**
 * IoT veri uç noktasının Lambda'dan kullanılacak adresi.
 *
 * SST `Realtime` bileşeni uç noktayı ŞEMASIZ host adı olarak verir
 * ("xxxx-ats.iot.<bölge>.amazonaws.com" — tarayıcı onu `wss://…/mqtt` ile kullanır). AWS SDK v3
 * şemasız adresi `TypeError: Invalid URL` ile reddeder (yerelde ölçüldü, 2026-09-28): Lambda'daki
 * yayıncılar `https://` önekiyle bağlanmalı.
 */
export function iotDataEndpointUrl(endpoint: string): string {
    const trimmed = endpoint.trim()
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
