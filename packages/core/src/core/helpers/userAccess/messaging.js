const GROUP_LABELS = {
    owner: "Owner",
    admin: "Admin",
    user: "İnceleme Bekleyen Kullanıcı",
    supplier: "Tedarikçi",
    purchasing: "Satın Alma",
    sales: "Satış",
    sales_director: "Satış Direktörü",
    customer: "Müşteri Portalı",
};
const ACCESS_STATUS_LABELS = {
    PENDING_REVIEW: "İnceleniyor",
    ACTIVE: "Aktif",
    SUSPENDED: "Askıya Alındı",
    REJECTED: "Reddedildi",
};
export function getUserGroupLabel(group) {
    return GROUP_LABELS[group] ?? group;
}
export function getUserAccessStatusLabel(status) {
    return ACCESS_STATUS_LABELS[status] ?? status;
}
export function buildUserAccessChangedMessage(input) {
    const roleLabel = getUserGroupLabel(input.nextGroup);
    const statusLabel = getUserAccessStatusLabel(input.nextAccessStatus);
    const reasonSuffix = input.reason ? ` Not: ${input.reason}` : "";
    if (input.nextAccessStatus === "ACTIVE") {
        return {
            title: "Erişim yetkiniz güncellendi",
            message: `Hesabınız ${roleLabel} rolü ile aktif edildi.${reasonSuffix}`.trim(),
        };
    }
    return {
        title: "Hesap durumunuz güncellendi",
        message: `Hesap durumunuz ${statusLabel} olarak güncellendi.${reasonSuffix}`.trim(),
    };
}
