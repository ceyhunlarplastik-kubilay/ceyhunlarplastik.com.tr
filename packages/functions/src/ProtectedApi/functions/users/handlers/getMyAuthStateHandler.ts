import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import type { IGetMyAccessDependencies, IGetMyAccessEvent } from "@/functions/ProtectedApi/types/users"

/**
 * Oturumun ihtiyaç duyduğu DAR erişim durumu.
 *
 * `/me/access`'ten ayrı bir uç olmasının sebebi payload: o uç dört ilişki
 * taşıyor (`assignedSalesCustomers` SINIRSIZ) ve iki istemci tüketicisi tam
 * `AdminUser` şeklini okuduğu için daraltılamıyor.
 *
 * Bu okuma AUTH YOLUNDA: her girişte, token yenilemede ve oturum başına birkaç
 * dakikada bir çalışıyor. Bir satış temsilcisinin tüm müşteri listesini o
 * sıklıkta taşımak israf olurdu (AGENTS.md: "dar, amaca özel uç").
 *
 * `allowInactive: true` ile açılır — askıya alınmış kullanıcı da kendi durumunu
 * öğrenebilmeli, aksi hâlde `/hesabim` sayfası çalışmazdı.
 */
export const getMyAuthStateHandler =
    ({ userRepository }: IGetMyAccessDependencies) =>
        async (event: IGetMyAccessEvent) => {
            const authUser = event.user

            if (!authUser) {
                throw createError.Unauthorized("User context missing")
            }

            const user = await userRepository.getAuthStateById(authUser.id)
            if (!user) {
                throw createError.NotFound("User not found")
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user: {
                        id: user.id,
                        email: user.email,
                        identifier: user.identifier,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageKey ? buildAssetUrl(user.imageKey) : null,
                        groups: user.groups,
                        accessStatus: user.accessStatus,
                        customerId: user.customerId,
                        supplierId: user.supplierId,
                        isActive: user.isActive,
                    },
                },
            })
        }
