import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const addUserToGroupValidator = validatorWrapper(
    z.object({
        body: z.object({
            group: z.enum(["owner", "admin", "user", "supplier", "purchasing", "sales", "sales_director", "customer", "content_editor"]),
            accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
            supplierId: z.uuid().nullable().optional(),
            customerId: z.uuid().nullable().optional(),
            reason: z.string().trim().max(500).nullable().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["group"],
    },
)

// Response Validators
// updateUserAccess -> userRepository.updateAssignments -> UserWithRelations
// (User + userInclude relation'ları). .loose() ZORUNLU: include edilen
// relation'lar aksi halde additionalProperties:false ile reddedilirdi.
// accessStatus permissive string — yeni bir erişim durumu eklendiğinde
// çalışan endpoint 500'e düşmesin.
const userSchema = z.object({
    id: z.uuid(),
    cognitoSub: z.string(),
    email: z.string(),
    identifier: z.string(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    imageKey: z.string().nullish(),
    phone: z.string().nullish(),
    groups: z.array(z.string()),
    accessStatus: z.string(),
    accessStatusChangedAt: z.string().nullish(),
    accessStatusReason: z.string().nullish(),
    supplierId: z.uuid().nullish(),
    customerId: z.uuid().nullish(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// updateUserGroups → payload: { user }
export const updateUserGroupsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                user: userSchema,
            }),
        }),
    }).loose()
)
