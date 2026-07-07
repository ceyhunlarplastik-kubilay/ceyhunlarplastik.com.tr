import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;

    // [locale] ağacının dışındaki route'larda (paneller, hesabim) requestLocale
    // undefined gelir — varsayılan TR'ye düşeriz ki oralarda yapılacak olası
    // next-intl çağrıları patlamasın.
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
