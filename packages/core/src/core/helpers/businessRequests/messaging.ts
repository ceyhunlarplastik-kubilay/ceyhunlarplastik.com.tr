import type { ApprovalRole, BusinessRequestType } from "@/prisma/generated/prisma/client"

export function getBusinessRequestTypeLabel(type: BusinessRequestType) {
    switch (type) {
        case "CUSTOMER_PROFILE_CHANGE":
            return "Müşteri profil değişikliği"
        case "CUSTOMER_ORDER_REQUEST":
            return "Sipariş talebi"
        case "CUSTOMER_DOCUMENT_REQUEST":
            return "Doküman talebi"
        case "CUSTOMER_PRICING_REQUEST":
            return "Fiyat talebi"
        case "SUPPLIER_PROFILE_CHANGE":
            return "Tedarikçi profil değişikliği"
        case "SUPPLIER_PRICING_CHANGE":
            return "Tedarikçi fiyat değişikliği"
        case "SUPPLIER_CAPABILITY_CHANGE":
            return "Tedarikçi yetkinlik değişikliği"
        case "SUPPLIER_CATEGORY_CREATE":
            return "Tedarikçi kategori oluşturma"
        case "SUPPLIER_PRODUCT_CREATE":
            return "Tedarikçi ürün oluşturma"
        case "SUPPLIER_VARIANT_CREATE":
            return "Tedarikçi varyant oluşturma"
        case "OFFER_DISCOUNT_REQUEST":
            return "İskonto onay talebi"
        case "PAYMENT_TERM_REQUEST":
            return "Vade değişikliği talebi"
        default:
            return "İş akışı talebi"
    }
}

export function getApprovalRoleLabel(role: ApprovalRole) {
    switch (role) {
        case "CUSTOMER":
            return "Müşteri"
        case "SUPPLIER":
            return "Tedarikçi"
        case "SALES":
            return "Satış"
        case "SALES_DIRECTOR":
            return "Satış Direktörü"
        case "PURCHASING":
            return "Satın Alma"
        case "ADMIN":
            return "Admin"
        case "OWNER":
            return "Owner"
        default:
            return role
    }
}
