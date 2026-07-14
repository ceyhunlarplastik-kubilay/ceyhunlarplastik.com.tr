import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Lint CI'da BLOKLAYICI (P1.7). Hook kuralları (set-state-in-effect, refs)
    // tekrar error'a çekildi: mount-gate'ler useHydrated ile gerçek çözüldü,
    // kalan birkaç meşru effect satır bazında gerekçeli disable'landı — yeni
    // ihlal artık CI'ı kırar. no-explicit-any hâlâ warn (~66 mevcut kullanım,
    // çoğu eski api/handler tipleri; ayrı temizlik işi).
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // OpenNext (SST) build çıktısı — bundle'lanmış/minified kod; lint'lemek
    // on binlerce sahte hata üretiyordu (P1.7'deki dev lint sayısının
    // gerçek kaynağı buydu).
    ".open-next/**",
  ]),
]);

export default eslintConfig;
