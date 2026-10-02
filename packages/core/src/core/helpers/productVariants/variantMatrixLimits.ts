/**
 * Varyant matrisi istek sınırı — TEK KAYNAK.
 *
 * Saf modül — hiçbir import YOK: frontend `@core/helpers/productVariants/variantMatrixLimits` ile okur.
 *
 * Matris uçları (`PUT /products/{id}/variant-matrix` kaydı ve `…/variant-matrix/bulk-delete`) tek
 * istekte en fazla bu kadar satır kabul eder: iş tek transaction'da yürüdüğü için süre ve bellek
 * bütçesi. Arayüz aynı sınırı istek ATILMADAN uygular — toplu kopya ve "filtredeki tümünü seç"
 * birkaç tıkla yüzlerce satır üretebildiği için kullanıcı sınırı 400 almadan önce görmeli.
 */
export const VARIANT_MATRIX_MAX_ROWS_PER_REQUEST = 500
