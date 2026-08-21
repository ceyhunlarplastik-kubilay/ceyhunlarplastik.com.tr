/**
 * Ölçü gösterim yardımcıları — uygulama CORE'dadır.
 *
 * Bu dosya yalnız mevcut import yollarını korumak için yeniden dışa aktarır;
 * kural burada YENİDEN YAZILMAZ (public katalog, portal ve admin aynı kaynağı
 * kullanmalı, bkz. core/helpers/productVariants/measurementDisplay.ts).
 */
export {
    buildMeasurementKey,
    formatMeasurementValue,
    resolveMeasurementName,
    resolveMeasurementUnit,
    toMeasurementLabel,
    type MeasurementDisplayInput,
} from "@core/helpers/productVariants/measurementDisplay"
