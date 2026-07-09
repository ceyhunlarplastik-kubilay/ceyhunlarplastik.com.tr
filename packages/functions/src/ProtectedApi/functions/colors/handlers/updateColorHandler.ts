import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export const updateColorHandler =
    ({ colorRepository }: { colorRepository: IPrismaColorRepository }) =>
        async (event: any) => {
            const id = event.pathParameters?.id
            if (!id) throw createError.BadRequest("Missing color id")

            const body = event.body
            if (!body || Object.keys(body).length === 0) {
                throw new createError.BadRequest("At least one field must be provided")
            }

            // İzinli alanlar bu endpoint'in kapsamıyla (request validator: name/isActive)
            // sınırlı — AdminApi update'i system/code/hex ile ilgilenir, burası değil.
            const allowedFields = ["name", "isActive"] as const
            const invalidFields = Object.keys(body).filter(
                (key) => !allowedFields.includes(key as (typeof allowedFields)[number])
            )
            if (invalidFields.length > 0) {
                throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)
            }

            const { name, isActive } = body
            const updateData: Prisma.ColorUpdateInput = {}

            if (name !== undefined) {
                if (typeof name !== "string" || name.trim().length < 2) {
                    throw new createError.BadRequest("Name must be at least 2 characters")
                }
                updateData.name = name
            }

            if (isActive !== undefined) {
                if (typeof isActive !== "boolean") {
                    throw new createError.BadRequest("isActive must be a boolean")
                }
                updateData.isActive = isActive
            }

            try {
                const color = await colorRepository.updateColor(id, updateData)

                return apiResponseDTO({
                    statusCode: 200,
                    payload: { color },
                })
            } catch (err: any) {
                if (err instanceof HttpError) throw err
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === "P2025") throw new createError.NotFound("Color not found")
                    if (err.code === "P2002") throw new createError.Conflict("Color with the same system and code already exists")
                }
                console.error(err)
                throw new createError.InternalServerError("Failed to update the color")
            }
        }
