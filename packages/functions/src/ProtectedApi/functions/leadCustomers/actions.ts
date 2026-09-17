import { lambdaHandler } from "@/core/middy"
import { getLeadCustomerHandler, listLeadCustomersHandler } from "@/functions/AdminApi/functions/leadCustomers/handlers"
import {
    getLeadCustomerValidator,
    leadCustomerDetailResponseValidator,
    listLeadCustomersResponseValidator,
    listLeadCustomersValidator,
} from "@/functions/AdminApi/validators/leadCustomers"
import type { IGetLeadCustomerEvent, IListLeadCustomersEvent } from "@/functions/AdminApi/types/leadCustomers"

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

/**
 * Detay — "Adresler & Eşleşen Ürünler" accordion'u için. AYNI handler/şema
 * AdminApi ile paylaşılıyor (`getLeadCustomer` adresleri + eşleşen ürünleri
 * tek payload'da döndürür, ayrı bir uç gerekmez). Salt-okunur: bu boundary'de
 * adres create/update/delete YOK (kullanıcı talebiyle — adres CRUD'u
 * veri girişi panelinin sorumluluğunda kalıyor).
 */
export const getManagedLeadCustomer = lambdaHandler(
    async (event) => getLeadCustomerHandler()(event as IGetLeadCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: getLeadCustomerValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)
