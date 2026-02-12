import middy from "@middy/core"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpError, isHttpError } from "http-errors"

import { errorResponse } from "@/core/helpers/utils/api/response"


interface MiddyValidatorErrorCause {
  package: "@middy/validator"
  data: {
    instancePath: string
    message: string
    keyword: string
    params: {
      additionalProperty?: string
    }
  }[]
}

function isMiddyValidatorError(err: any): err is {
  cause: MiddyValidatorErrorCause
} {
  return (
    err &&
    typeof err === "object" &&
    err.cause &&
    err.cause.package === "@middy/validator" &&
    Array.isArray(err.cause.data)
  )
}

const httpErrorHandlerMiddleware = () => {
  const onError: middy.MiddlewareFn<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = (request) => {
    const err = request.error
    console.error("HttpErrorHandler Caught Error:", JSON.stringify(err, null, 2))
    if (err) console.error("Error Raw:", err);

    // Custom validation error
    if (isMiddyValidatorError(err)) {
      const errors = err.cause.data.map((e) => {
        let message = e.message
        let field = e.instancePath.replace(/\//g, ".").slice(1)

        // 🔥 UUID humanization
        if (e.keyword === "format" && e.instancePath.includes("id")) {
          message = "Invalid UUID format"
        }

        if (e.keyword === "additionalProperties" && e.params?.additionalProperty) {
          const forbiddenProp = e.params.additionalProperty;
          message = `must NOT have additional properties: ${forbiddenProp}`;
        }

        if (e.keyword === "required") {
          message = `Missing required field`
          // Try to extract missing field name from message
          const match = e.message.match(/'(.+)'/) // e.g. "should have required property 'body'"
          if (match && match[1]) {
            field = match[1]
          }
        }

        return {
          field,
          message,
          keyword: e.keyword,
        }
      })

      return errorResponse({
        statusCode: 400,
        detail: {
          message: "Validation failed",
          errors,
        },
      })
    }

    // Http Error
    if (isHttpError(err)) {
      const httpErr = err as HttpError

      return errorResponse({
        statusCode: httpErr.statusCode ?? 500,
        detail: {
          message: httpErr.message,
          cause: httpErr.cause
            ? JSON.stringify(httpErr.cause)
            : undefined,
        },
      })
    }

    // Fallback
    return errorResponse({
      statusCode: 500,
      detail: { message: "Internal Server Error" },
    })
  }

  return { onError }
}

export default httpErrorHandlerMiddleware
