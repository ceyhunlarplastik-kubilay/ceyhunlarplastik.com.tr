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

const z_name = z.string().min(2).max(300)
const z_email = z.email().min(5).max(300)

const createUserSchema = z.object({
  body: z
    .object({
      first_name: z_name,
      last_name: z_name.optional(),
      email: z_email,
    })
    .strict(),
})

export const createUserValidator = validatorWrapper(createUserSchema, {
  requiredRootFields: ['body'],
  requiredBodyFields: ['email', 'first_name'],
})