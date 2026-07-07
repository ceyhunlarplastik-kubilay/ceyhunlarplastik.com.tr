import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * [locale] ağacındaki sayfalarda next/link ve next/navigation yerine BUNLARI kullanın:
 * locale prefix'ini otomatik yönetirler (TR'de prefixsiz, EN'de /en'li).
 * Panel route'ları [locale] dışında olduğundan oralarda next/link kullanılmaya devam eder.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
