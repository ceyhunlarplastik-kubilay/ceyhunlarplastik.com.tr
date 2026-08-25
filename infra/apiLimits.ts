/**
 * API sınırları — throttle (gateway) ve reserved concurrency (Lambda).
 *
 * ## Neden tek yerde
 * Dört sınırın üçünde AYNI `100 rps / 200 burst` yazılıydı ve OwnerApi'de hiç
 * yoktu — yani en yetkili yüzey en gevşek olandı (throttle tanımlanmayan API
 * hesabın API Gateway default'una düşer, bu binlerce rps'tir). Değerler artık
 * sınıra göre ayrışıyor ve gerekçesiyle birlikte burada duruyor.
 *
 * ## İki farklı mekanizma, iki farklı işi var
 * - **Throttle (gateway):** istek Lambda'yı TETİKLEMEDEN reddedilir → maliyet yok.
 *   Ama `defaultRouteSettings` AWS'de ROUTE BAŞINA uygulanır: 33 public route ×
 *   200 rps, toplamda 200 değil. Yani throttle tek başına hesabın eşzamanlılık
 *   kotasını korumaz.
 * - **Reserved concurrency (Lambda):** fonksiyon başına TAVAN + hesap havuzundan
 *   REZERVASYON. Kotanın tükenip panellerin aç kalmasını asıl bu engeller.
 *
 * ## Değerler tahmindir
 * Elde trafik verisi yok. Hepsi env ile ezilebilir ki ayarlamak için kod
 * değiştirmek ve deploy beklemek gerekmesin.
 */

function parsePositiveIntegerEnv(name: string, fallback: number): number {
    const value = process.env[name];
    if (!value) return fallback;

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

type ThrottleSettings = {
    throttlingRateLimit: number;
    throttlingBurstLimit: number;
};

function throttle(envPrefix: string, rate: number, burst: number): ThrottleSettings {
    return {
        throttlingRateLimit: parsePositiveIntegerEnv(`${envPrefix}_THROTTLE_RATE`, rate),
        throttlingBurstLimit: parsePositiveIntegerEnv(`${envPrefix}_THROTTLE_BURST`, burst),
    };
}

/**
 * PUBLIC — anonim ve DB'ye dokunan tek yüzey, ama sınırı en GENİŞ olan da bu.
 *
 * Sebebi SSR çarpanı: `urun/[slug]` bir sayfa render'ı için üç public çağrı
 * yapıyor (ürün, varyant tablosu, benzer ürünler). 100 rps bu sayfada ~33
 * görüntülemeye denk düşerdi ve 429 alan bir SSR çağrısı sayfayı hata durumuna
 * düşürür. ISR + `unstable_cache` çoğunu emiyor; sınır gerçek sele karşı.
 */
export const publicApiThrottle = throttle("PUBLIC_API", 200, 400);

/** PROTECTED — portal + satış/satın alma. JWT authorizer zaten kapıda. */
export const protectedApiThrottle = throttle("PROTECTED_API", 100, 200);

/** ADMIN — iç kullanıcı sayısı az; dar tutmak çalınmış token senaryosunda sigorta. */
export const adminApiThrottle = throttle("ADMIN_API", 50, 100);

/** OWNER — en yetkili ve en dar yüzey. Öncesinde HİÇ sınırı yoktu. */
export const ownerApiThrottle = throttle("OWNER_API", 20, 40);

/**
 * DB'ye dokunan public ürün route'ları için Lambda tavanı.
 *
 * Prod RDS **t4g.micro**: asıl darboğaz Lambda değil veritabanı. Bir anonim sel
 * bu route'larda takılıp kalsın, panelleri aç bırakmasın.
 *
 * Bütçe: hesap kotası 1000. Dört ağır route × 100 = 400 rezerve, panellere 600
 * kalır (AWS en az 100 ayrılmamış eşzamanlılık ister). Route sayısı artarsa bu
 * aritmetiği yeniden yapın — toplam rezervasyon 900'ü aşarsa deploy REDDEDİLİR.
 *
 * DİKKAT: rezervasyon aynı zamanda TAVANDIR. Aşılırsa o route 429 verir; sayfa
 * `{ variants, error }` kontratı sayesinde hata durumu gösterir, sessizce boş
 * kalmaz (bkz. P1.8f).
 */
export const publicProductReservedConcurrency = parsePositiveIntegerEnv(
    "PUBLIC_PRODUCT_ROUTE_RESERVED_CONCURRENCY",
    100,
);
