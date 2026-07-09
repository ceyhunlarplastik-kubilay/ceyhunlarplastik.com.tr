import middy from "@middy/core"
import warmupMiddleware from "@middy/warmup"

import httpEventNormalizer from "@middy/http-event-normalizer"
import httpHeaderNormalizer from "@middy/http-header-normalizer"

import httpContentNegotiation from "@middy/http-content-negotiation"
import httpUrlencodePathParser from "@middy/http-urlencode-path-parser"

import httpJsonBodyParser from "@middy/http-json-body-parser"
import httpUrlencodeBodyParser from "@middy/http-urlencode-body-parser"
import httpMultipartBodyParser from "@middy/http-multipart-body-parser"

import httpSecurityHeaders from "@middy/http-security-headers"
import httpContentEncoding from "@middy/http-content-encoding"
import httpPartialResponse from "@middy/http-partial-response"

import validator from "@middy/validator"
import { transpileSchema } from "@middy/validator/transpile"

import inputOutputLogger from "@middy/input-output-logger"

import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware"

import { Handler } from "aws-lambda"

import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import authMiddleware, { IAuthMiddlewareOptions } from "@/core/middleware/authMiddleware"
import httpErrorHandlerMiddleware from "@/core/middleware/httpErrorHandlerMiddleware"
import { logger } from "@/core/logger"

/**
 * Correlation id'yi (API Gateway HTTP requestId) invocation başına logger'a
 * iliştirir; böylece o isteğe ait tüm structured loglar aynı id ile korele olur.
 * jmespath bağımlılığı gerektiren correlationIdPath yerine manuel append —
 * daha hafif. resetKeys (injectLambdaContext) warm invocation'lar arası
 * sızmayı önler.
 */
const correlationIdMiddleware = () => ({
    before: (request: { event?: { requestContext?: { requestId?: string } } }) => {
        const requestId = request.event?.requestContext?.requestId
        if (requestId) {
            logger.appendKeys({ correlationId: requestId })
        }
    },
})

interface LambdaOptions {
    requestValidator?: object
    responseValidator?: object
    auth?: IAuthMiddlewareOptions | false
}

export const lambdaHandler = <TResponse = unknown>(
    handler: Handler<IAPIGatewayProxyEventWithUser, TResponse>,
    opts?: LambdaOptions,
) => {
    const chain = middy(handler)

    /* ------------------------
     * 1️⃣ Warmup (en başta)
     * ------------------------ */
    chain.use(warmupMiddleware())

    /* ------------------------
     * 2️⃣ Normalize
     * ------------------------ */
    chain
        .use(httpEventNormalizer())
        .use(httpHeaderNormalizer())

    /* ------------------------
     * 2.5️⃣ Structured logging context (Powertools)
     * injectLambdaContext: Lambda context + cold start alanlarını iliştirir;
     * logEvent:false → tam event dump'ı YOK (maliyet nedeniyle bilinçli).
     * resetKeys → warm invocation'lar arası key sızmasını önler.
     * Kendiliğinden log üretmez; yalnız logger.x() çağrıldığında yazar.
     * ------------------------ */
    chain
        .use(injectLambdaContext(logger, { logEvent: false, resetKeys: true }))
        .use(correlationIdMiddleware())

    /* ------------------------
     * 3️⃣ Content negotiation
     * ------------------------ */
    chain.use(
        httpContentNegotiation({
            availableLanguages: ["tr-TR", "en-US"],
            availableMediaTypes: ["application/json"],
        }),
    )

    /* ------------------------
     * 4️⃣ Params & Body parsing
     * ------------------------ */
    chain
        .use(httpUrlencodePathParser())
        .use(httpJsonBodyParser({ disableContentTypeError: true }))
        .use(httpUrlencodeBodyParser({ disableContentTypeError: true }))
        .use(httpMultipartBodyParser({ disableContentTypeError: true }))

    /* ------------------------
     * 5️⃣ REQUEST Validation (EARLY)
     * ------------------------ */
    if (opts?.requestValidator) {
        chain.use(validator({
            eventSchema: transpileSchema(opts.requestValidator, {
                allErrors: true,
                strict: true,
                coerceTypes: "array",
                useDefaults: "empty",
            })
        }))
    }

    /* ------------------------
    * 6️⃣ AUTH (BURAYA)
    * ------------------------ */
    if (opts?.auth !== false) {
        chain.use(authMiddleware(opts?.auth))
    }

    /* ------------------------
     * 7️⃣ Security headers
     * CORS burada DEĞİL: dört API'de de CORS, API Gateway seviyesinde uygulanıyor
     * (infra/cors.ts — stage'e göre origin listesi). AWS HTTP API'de CORS
     * configure edildiğinde backend'in döndürdüğü CORS header'ları yok sayılır;
     * bu yüzden koddan CORS header'ı eklemek hem ölü kod hem yanıltıcıdır.
     * API Gateway CORS'u kapatılırsa header hiç dönmez → fail-closed (güvenli yön).
     * ------------------------ */
    chain.use(httpSecurityHeaders())

    /* ------------------------
     * 8️⃣ Response SERIALIZATION & VALIDATION
     * ------------------------ */
    chain
        .use(httpContentEncoding())
        // Custom simple serializer to strictly ensure JSON stringification
        .use({
            after: (request) => {
                const { response } = request
                if (response && typeof response.body === 'object') {
                    response.body = JSON.stringify(response.body);
                }
            }
        })
        .use(httpPartialResponse())

    // 9️⃣ RESPONSE Validation (LATE - before serialization on response path)
    if (opts?.responseValidator) {
        chain.use(validator({
            responseSchema: transpileSchema(opts.responseValidator)
        }))
    }

    /* ------------------------
     * 9 Logging
     * ------------------------ */
    // Temporarily disabled because full event/response dumps make local admin flows noisy
    // and expose oversized requestContext logs during routine panel usage.
    // Re-enable behind an explicit debug flag if deep Lambda tracing is needed again.
    /* if (process.env.NODE_ENV !== "prod") {
        chain.use(inputOutputLogger())
    } */

    /* ------------------------
     * 10 Custom error handler (EN SON)
     * ------------------------ */
    // Not: eski @middy/error-logger kaldırıldı — httpErrorHandlerMiddleware'in
    // onError'ı (en son eklendiği için middy tarafından İLK çalışır) yanıtı set
    // edip zinciri durduruyordu; error-logger.onError hiç tetiklenmiyordu (ölü).
    // Yapısal hata logu artık httpErrorHandlerMiddleware içinde (Powertools).
    chain.use(httpErrorHandlerMiddleware())

    return chain
}
