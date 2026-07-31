import { z } from "zod"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, TARGET_LOCALES } from "@/core/i18n/locales"

/**
 * API sınırındaki locale doğrulaması için TEK kaynak.
 *
 * Bu modülden önce her validator dosyası kendi `z.enum(["tr","en"])`'ini
 * tanımlıyordu (16 kopya). Dil listesi büyüdüğünde hepsini tek tek güncellemek
 * gerekiyordu ve unutulan bir dosya, o uçta yeni dilleri sessizce 400'e
 * düşürüyordu — handler'lar zaten `getSupportedLocale` ile dilden bağımsız
 * çalıştığı için hata yalnız Zod katmanında görünüyordu.
 */
export const localeSchema = z.enum(SUPPORTED_LOCALES)

/** Varsayılan dil hariç — çeviri hedefleri (silinebilir/eklenebilir çeviriler). */
export const targetLocaleSchema = localeSchema.exclude([DEFAULT_LOCALE])

/**
 * Bir kaydın taşıyabileceği en fazla çeviri satırı = desteklenen dil sayısı.
 * Eskiden sabit `.max(10)`'du; 10'dan fazla dilde her tam-payload admin kaydı
 * 400 veriyordu.
 */
export const TRANSLATIONS_ARRAY_MAX = SUPPORTED_LOCALES.length

/** Tek istekte kaldırılabilecek en fazla çeviri = varsayılan dil dışındaki diller. */
export const REMOVABLE_TRANSLATION_LOCALES_MAX = TARGET_LOCALES.length
