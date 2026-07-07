import config from "../config";

/**
 * Tek kaynak: tüm API Gateway'lerin izin verdiği browser origin'leri.
 *
 * AWS HTTP API'de CORS burada (API Gateway seviyesinde) uygulanır; CORS API'de
 * configure edildiğinde backend integration'ın döndürdüğü CORS header'ları
 * API Gateway tarafından YOK SAYILIR. Bu yüzden origin listesi yalnızca burada
 * tutulur — middy zincirine veya response helper'lara CORS header'ı eklemeyin
 * (bkz. IMPROVEMENT_PLAN.md P0.2).
 */
export const allowedOrigins =
    $app.stage === "prod"
        ? [`https://${config.DOMAIN}`, `https://www.${config.DOMAIN}`]
        : $app.stage === "dev"
            ? [`https://dev.${config.DOMAIN}`]
            : // Kişisel stage'ler (ör. kubi): frontend `next dev` ile lokalde çalışır.
            ["http://localhost:3000"];

export const apiCors = {
    allowOrigins: allowedOrigins,
};
