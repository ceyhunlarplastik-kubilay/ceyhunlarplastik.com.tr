import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Lint CI'da BLOKLAYICI (P1.7). Mevcut borç iki kuralda warn'a indirildi —
    // görünür kalır ama build kırmaz; sıfırlamak ayrı temizlik işidir:
    // - no-explicit-any: ~66 mevcut kullanım (çoğu eski api/handler tipleri)
    // - set-state-in-effect: ~6 bileşen; davranışa dokunan dikkatli refactor ister
    // - refs: 1 bileşen ("latest ref" deseni, ProductIndustrialUsageEditor)
    // Bunlar dışında yeni her lint hatası CI'ı kırar.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
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
