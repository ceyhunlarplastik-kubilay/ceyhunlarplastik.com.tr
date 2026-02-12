import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export const createColorHandler =
    ({ colorRepository }: { colorRepository: IPrismaColorRepository }) =>
        async (event: any) => {
            const body = event.body

            try {
                const color = await colorRepository.createColor({
                    system: body.system,
                    code: body.code,
                    name: body.name,
                    hex: body.hex,
                    rgbR: body.rgbR,
                    rgbG: body.rgbG,
                    rgbB: body.rgbB,
                })

                return apiResponse({
                    statusCode: 201,
                    payload: { color },
                })
            } catch (err: any) {
                if (err.code === "P2002") {
                    throw createError.Conflict("Color already exists")
                }
                throw err
            }
        }
