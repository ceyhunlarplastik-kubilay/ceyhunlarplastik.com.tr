"use client"

import { EntityAuditHistory } from "@/features/admin/auditLogs/components/EntityAuditHistory"
import { customerAuditPresenter } from "@/features/admin/customers/utils/customerAuditPresentation"

type Props = {
    customerId: string
}

/**
 * Müşterinin (potansiyel ya da cari) değişiklik geçmişi — yalnız admin / owner
 * (bkz. `canViewAuditLogs`). Kayıtlar referansları adıyla taşıdığı için sözlük yüklenmez.
 */
export function CustomerAuditHistory({ customerId }: Props) {
    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-neutral-950">Değişiklik Geçmişi</h2>
                <p className="text-sm text-neutral-500">
                    Kim, ne zaman, hangi alanı neyden neye değiştirdi. Potansiyel müşteri kaydı, adresler,
                    telefonlar, profil ve ticari şartlar dahil.
                </p>
            </div>
            <EntityAuditHistory entityType="Customer" entityId={customerId} presenter={customerAuditPresenter} />
        </div>
    )
}
