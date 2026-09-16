import { lambdaHandler } from "@/core/middy"
import { listLeadCustomersHandler } from "@/functions/AdminApi/functions/leadCustomers/handlers"
import {
    listLeadCustomersResponseValidator,
    listLeadCustomersValidator,
} from "@/functions/AdminApi/validators/leadCustomers"
import type { IListLeadCustomersEvent } from "@/functions/AdminApi/types/leadCustomers"

/**
 * Satış tarafı: potansiyel müşteriler (LEAD) için salt-okunur, TÜM havuzu
 * gösteren liste ucu. AdminApi'deki `/lead-customers` ile AYNI handler ve
 * şemaları kullanır (bkz. AGENTS.md CRM sınırı — `content_editor`/`admin`
 * ucunun ticari alan taşımayan tasarımı zaten satış için de uygun) — kod/veri
 * tekilliği korunur, yalnız auth sınırı ve boundary farklı.
 *
 * Yazma (create/update/delete) BU boundary'de YOK; satış temsilcisi yalnız
 * listeler (kullanıcı talebiyle: "potansiyel müşterilerin şimdilik hepsini
 * listeleyebilsin" — `assignedSalesUserId` gibi bir sahiplik kısıtı da YOK,
 * havuz herkese açık).
 */
export const listManagedLeadCustomers = lambdaHandler(
    async (event) => listLeadCustomersHandler()(event as IListLeadCustomersEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: listLeadCustomersValidator,
        responseValidator: listLeadCustomersResponseValidator,
    },
)
