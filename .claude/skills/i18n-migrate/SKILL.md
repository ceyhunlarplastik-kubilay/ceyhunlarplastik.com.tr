---
name: i18n-migrate
description: Migrate a page or feature's hardcoded Turkish strings to next-intl message catalogs in this repo, with the project's namespace conventions, getTranslations/useTranslations patterns, locale-aware metadata, and the hreflang/SEO checklist. Use this whenever the task involves translating UI to English, moving Turkish strings to tr.json/en.json, "i18n", "çeviri", "İngilizce ekle", "next-intl", "P1.1", localizing a route/component, or adding hreflang/sitemap entries for a localized page.
---

# i18n Migrate

Migrate one page/feature at a time from hardcoded Turkish strings to next-intl catalogs. This skill exists because the migration spans ~70-90 files in Phase 1 alone — consistency across all of them matters more than any single file. The strategy, phases, and constraints are defined in IMPROVEMENT_PLAN.md § i18n; this skill is the per-unit execution recipe.

## Non-negotiable project decisions (from IMPROVEMENT_PLAN.md)

- Library is **next-intl**, routing is `[locale]` segment with `localePrefix: "as-needed"` — Turkish URLs stay unprefixed (`/hakkimizda`), English lives under `/en/...`. Never change an existing TR URL.
- **Do not translate DB content** (product/category names, descriptions, `usageFunction`) in Phase 1. English pages showing Turkish product data is an accepted interim state.
- **Do not translate route slugs** in Phase 1 (`/en/hakkimizda` is fine; `pathnames` mapping comes later).
- Backend messages, notifications, and emails are Phase 3 — out of scope for this skill.
- Testing happens ONLY on `npx sst dev --stage kubi` with the local Docker Postgres. Never against dev/prod stages.

## Prerequisite check

If `next-intl` is not yet in `packages/frontend/package.json` or `app/[locale]/` does not exist, the Phase 1a infrastructure hasn't landed. Stop and do that first (or tell the user) — per-page migration without the `[locale]` tree has nowhere to put translations.

## Conventions

**Catalog files:** `packages/frontend/messages/tr.json` and `messages/en.json`. `tr.json` is the source of truth: the exact strings currently hardcoded move there verbatim (no rewriting during migration — separate content edits from mechanical migration so diffs stay reviewable).

**Namespaces mirror the feature tree**, one namespace per feature/page:

```json
{
  "public": {
    "about": { "heroTitle": "…", "metaTitle": "Hakkımızda | Ceyhunlar Plastik" }
  },
  "auth": {
    "signIn": { "title": "…", "errors": { "invalidCredentials": "…" } }
  },
  "common": { "actions": { "save": "Kaydet", "cancel": "İptal" } }
}
```

- Key names describe **role, not content**: `heroTitle`, not `plastikUretimBaslik`.
- Only hoist a string to `common` when it appears in 3+ features. Premature sharing couples unrelated screens.
- Interpolation uses ICU: `"itemCount": "{count} ürün bulundu"` — never string-concatenate translated fragments, word order differs between TR and EN.

## Per-unit migration process

### 1. Inventory the unit's strings
Grep the page + its feature components for Turkish characters: `grep -rn '[ğüşıöçĞÜŞİÖÇ]' <files>`. Also catch Turkish-only words without special chars (e.g. "Ürünler" has them, "Anasayfa" doesn't) by reading JSX text nodes, `title`/`alt`/`placeholder`/`aria-label` attributes, metadata exports, and Zod schema messages. Miss-prone spots: `sonner` toast calls, empty-state texts, button `aria-label`s.

### 2. Move strings to `tr.json`, then translate into `en.json`
Both files must have identical key structure — a key present in one and missing in the other is a runtime fallback bug waiting to be found by a customer. After editing, diff the key sets.

### 3. Replace usages by component type
- **Server Component** (default): `const t = await getTranslations("public.about")` then `t("heroTitle")`.
- **Client Component** (`"use client"`): `const t = useTranslations("public.about")`. Never import `getTranslations` in a client file.
- **Metadata**: convert `export const metadata` to `generateMetadata({ params })` using `getTranslations({ locale, namespace })`. Title/description/OG all come from the catalog.
- **Zod schemas** (module scope, no hook access): keep the schema message as a **key**, translate at render time where the error is displayed — or build the schema via a factory that receives `t`. Follow whichever of the two the first migrated auth schema established; do not mix both styles.
- **Dates/numbers**: replace manual `toLocaleDateString("tr-TR")`-style calls with next-intl's `format` utilities so locale switches automatically.

### 4. SEO checklist (public pages only)
- `generateMetadata` returns `alternates.languages` with both locale URLs (hreflang) and a canonical.
- `openGraph.locale` derives from the active locale (`tr_TR` / `en_US`).
- The page is registered in `app/sitemap.ts` with both language variants (create the sitemap entry if the page predates it).
- `<html lang>` must already be locale-driven from Phase 1a — if you find it hardcoded, that's a Phase 1a regression; flag it.

### 5. Verify on stage kubi
Run the local stage and check **both** locales: the unprefixed TR route (pixel-identical to before the migration — TR output must not change at all) and the `/en/...` route (fully English chrome; TR product data acceptable). Check the browser tab title and view-source for hreflang tags on public pages.

## Definition of done for one unit
- Zero Turkish characters left in the migrated files (`grep -c '[ğüşıöçĞÜŞİÖÇ]'` → 0), excluding DB-driven content.
- `tr.json`/`en.json` key sets identical.
- TR route renders byte-for-byte the same text as before.
- One page/feature per PR — reviewers verify translations, not hunt through mixed concerns.
