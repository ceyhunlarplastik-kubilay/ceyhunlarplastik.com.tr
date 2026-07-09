import { Logger } from "@aws-lambda-powertools/logger"

/**
 * Paylaşılan structured logger (AWS Lambda Powertools).
 *
 * - `serviceName` ve log seviyesi env'den okunur (POWERTOOLS_SERVICE_NAME /
 *   POWERTOOLS_LOG_LEVEL). Powertools bu env'leri otomatik okur; seviye
 *   verilmezse INFO'dur. Env'ler infra tarafında boundary'ye göre set edilir
 *   (pilot: yalnız PublicApi).
 * - Kendiliğinden log ÜRETMEZ; yalnız çağrıldığında (logger.info/error/…) yazar.
 *   Bu yüzden env set edilmeyen boundary'lerde ek maliyet doğurmaz.
 * - Tam event/response dump'ı BİLİNÇLİ olarak yapılmaz (maliyet nedeniyle);
 *   injectLambdaContext logEvent:false ile eklenir.
 */
export const logger = new Logger({
    serviceName: process.env.POWERTOOLS_SERVICE_NAME ?? "ceyhunlar-api",
})
