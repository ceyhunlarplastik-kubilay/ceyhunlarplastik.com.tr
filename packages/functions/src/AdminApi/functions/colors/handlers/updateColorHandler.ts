import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IColorDependencies, IUpdateColorEvent } from "@/functions/AdminApi/types/colors"

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/

function hexToRgb(hex: string) {
    const clean = hex.replace("#", "")
    const bigint = parseInt(clean, 16)

    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    }
}

export const updateColorHandler = ({ colorRepository }: IColorDependencies) => {
    return async (event: IUpdateColorEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least  one field must be provided");

        const allowedFields = ["system", "code", "name", "hex"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { system, code, name, hex } = body;
        const updateData: Prisma.ColorUpdateInput = {}

        // ---- Field level validation ----
        if (system) {
            updateData.system = system
        };
        if (code) {
            if (code.length < 1) {
                throw new createError.BadRequest("Code cannot be empty")
            }
            updateData.code = code
        }

        if (name) {
            if (name.length < 2) {
                throw new createError.BadRequest("Name must be at least 2 characters")
            }
            updateData.name = name
        }

        if (hex) {
            if (!HEX_REGEX.test(hex)) {
                throw new createError.BadRequest("Invalid hex format")
            }

            updateData.hex = hex

            const { r, g, b } = hexToRgb(hex)

            updateData.rgbR = r
            updateData.rgbG = g
            updateData.rgbB = b
        }

        try {
            const color = await colorRepository.updateColor(id, updateData);

            return apiResponseDTO({
                statusCode: 200,
                payload: { color },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Color not found")
                else if (err.code === "P2002") throw new createError.Conflict("Color with the same system and code already exist")
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update the color");
        }
    }
}
