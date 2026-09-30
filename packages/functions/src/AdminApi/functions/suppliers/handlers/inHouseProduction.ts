import createError from "http-errors"
import { ISupplierDependencies } from "@/functions/AdminApi/types/suppliers"

/**
 * İç üretim tedarikçisi TEK olmalı: üretim planlama "bizim ürettiğimiz varyant"ı bu işaretle ayırır.
 * Başkası işaretliyken ikincisi reddedilir; değiştirmek için önce eskisinin işareti kaldırılır.
 */
export async function assertSingleInHouseProductionSupplier(
    supplierRepository: ISupplierDependencies["supplierRepository"],
    excludeId?: string,
) {
    const current = await supplierRepository.findInHouseProductionSupplier(excludeId)
    if (current) {
        throw new createError.Conflict(
            `İç üretim tedarikçisi zaten "${current.name}". Önce onun işaretini kaldırın; yalnız bir tedarikçi iç üretim olabilir.`,
        )
    }
}
