import { z } from "zod"
import { PHONE_INPUT_REGEX } from "@/core/helpers/validation/phone"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createMyProfileImageUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            fileName: z.string().trim().min(1).max(255),
            contentType: z.string().trim().min(1).max(100),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["fileName", "contentType"],
    }
)

export const updateMyProfileImageValidator = validatorWrapper(
    z.object({
        body: z.object({
            imageKey: z.string().trim().min(1).nullable(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["imageKey"],
    }
)

export const updateMyProfileValidator = validatorWrapper(
    z.object({
        body: z.object({
            identifier: z.string().trim().min(2).max(120).optional(),
            firstName: z.string().trim().min(2).max(120).optional(),
            lastName: z.string().trim().min(2).max(120).optional(),
            phone: z.string().trim().regex(
                PHONE_INPUT_REGEX,
                "Telefon numarasi yalnizca rakam, bosluk, parantez, tire ve + karakteri icerebilir.",
            ).nullable().optional(),
            customerContactTitle: z.string().trim().max(120).nullable().optional(),
            customerContactDepartment: z.string().trim().max(120).nullable().optional(),
        }).superRefine((value, ctx) => {
            const hasFirstName = value.firstName !== undefined
            const hasLastName = value.lastName !== undefined

            if (hasFirstName !== hasLastName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [hasFirstName ? "lastName" : "firstName"],
                    message: "Ad ve soyad birlikte guncellenmelidir.",
                })
            }
        }),
    }),
    {
        requiredRootFields: ["body"],
    },
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

// Response Validators
//
// userSchema iki varyantı da karşılar: getUser/getMe raw UserWithRelations
// (userInclude relation'ları .loose() ile tolere edilir) ve
// mapAdminUserForApi/mapUserWithImage çıktısı (+imageUrl) → imageUrl nullish.
// accessStatus/groups permissive string — yeni rol/durum 500 üretmesin.
const userSchema = z.object({
    id: z.uuid(),
    cognitoSub: z.string(),
    email: z.string(),
    identifier: z.string(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    imageKey: z.string().nullish(),
    imageUrl: z.string().nullish(),
    phone: z.string().nullish(),
    groups: z.array(z.string()),
    accessStatus: z.string(),
    supplierId: z.uuid().nullish(),
    customerId: z.uuid().nullish(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// getUser / getMe / updateMyProfile / updateMyProfileImage → payload: { user }
export const userResponseValidator = z.toJSONSchema(
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

// listUsers → payload: { data, meta }
export const listUsersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(userSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose()
)

// getMyAccess → payload: { user, canAccessPanels }
export const myAccessResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                user: userSchema,
                canAccessPanels: z.boolean(),
            }),
        }),
    }).loose()
)

// UserNotification: `data` Json? alanı bilinçli olarak listelenmedi (her shape
// olabilir; loose tolere eder). type permissive string (enum büyüyebilir).
const notificationSchema = z.object({
    id: z.uuid(),
    userId: z.uuid(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    readAt: z.string().nullish(),
    createdAt: z.string(),
}).loose()

// listMyNotifications → payload: { data, meta, unreadCount } (unreadCount ekstra!)
export const listMyNotificationsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(notificationSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
                unreadCount: z.number(),
            }),
        }),
    }).loose()
)

// markMyNotificationRead → payload: { notification } (null → handler 404 atıyor)
export const notificationResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                notification: notificationSchema,
            }),
        }),
    }).loose()
)

// mePermissions → payload permission matrisinin kendisi; flags/can loose —
// yeni yetenek bayrağı eklemek validator değişikliği gerektirmesin.
export const mePermissionsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                roles: z.array(z.string()),
                flags: z.object({}).loose(),
                can: z.object({}).loose(),
            }),
        }),
    }).loose()
)
