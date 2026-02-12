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
import httpCors from "@middy/http-cors"
import httpContentEncoding from "@middy/http-content-encoding"
import httpPartialResponse from "@middy/http-partial-response"

import validator from "@middy/validator"
import { transpileSchema } from "@middy/validator/transpile"

import inputOutputLogger from "@middy/input-output-logger"
import errorLogger from "@middy/error-logger"

import { Handler } from "aws-lambda"

import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import authMiddleware, { IAuthMiddlewareOptions } from "@/core/middleware/authMiddleware"
import httpErrorHandlerMiddleware from "@/core/middleware/httpErrorHandlerMiddleware"

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
     * 7️⃣ Security / CORS
     * ------------------------ */
    chain
        .use(httpSecurityHeaders())
        .use(
            httpCors({
                origin: "*", // prod’da domain’e düşürürüz
                // origin: ["https://ceyhunlarplastik.com.tr"],
                credentials: true,
            }),
        )

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
    if (process.env.NODE_ENV !== "prod") {
        chain.use(inputOutputLogger())
    }

    chain.use(errorLogger())

    /* ------------------------
     * 10 Custom error handler (EN SON)
     * ------------------------ */
    chain.use(httpErrorHandlerMiddleware())

    return chain
}
