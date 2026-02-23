// import { User } from "@portfolio-kubilay/core/database/models" ?? Kullanacak yer kaldı mı?

// Old Version - Pure Json Schema
/* export const createUserValidator = {
    type: "object",
    properties: {
        body: {
            type: "object",
            properties: {
                first_name: { type: "string", minLength: 2, maxLength: 300 },
                last_name: { type: "string", minLength: 2, maxLength: 300 },
                email: { type: "string", format: "email", minLength: 5, maxLength: 300 }
            },
            required: ["first_name", "last_name", "email"]
        },
    },
    required: ["body"],
}; */

import { z } from "zod";
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/**
 * Zod şemasını JSON Schema'ya çevirip Middy validator olarak sarmalar.
 * Root seviyesinde:
 *  - Varsayılan "body" required olur (override edilebilir)
 *  - additionalProperties: true yapılır
 * Body seviyesinde:
 *  - İstenirse required alanları override edebilirsin
 *
 * @param schema - Zod şeması (ör. z.object({ body: ... }))
 * @param options.requiredRootFields - Root seviyede required olmasını istediğin alanlar (varsayılan: ["body"])
 * @param options.requiredBodyFields - Body içindeki alanlardan required yapılacaklar (opsiyonel)
 */

export const listUsersResponseValidator = z.toJSONSchema(
  z.object({
    statusCode: z.number(),
    body: z.object({
      statusCode: z.number(),
      payload: z.object({
        data: z.array(
          z.object({
            id: z.uuid(),
            email: z.string(),
            identifier: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })
        ),
        meta: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          totalPages: z.number(),
        })
      })
    })
  }).loose()
)

export const getUserResponseValidator = z.toJSONSchema(
  z.object({
    statusCode: z.number(),
    body: z.object({
      statusCode: z.number(),
      payload: z.object({
        user: z.object({
          id: z.uuid(),
          email: z.string(),
          identifier: z.string(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
      })
    })
  }).loose()
)


export const idValidator = validatorWrapper(
  z.object({
    pathParameters: z.object({
      id: z.uuid(),
    }),
  }),
  {
    requiredRootFields: ["pathParameters"],
  }
)