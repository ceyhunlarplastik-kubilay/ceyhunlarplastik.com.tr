-- Firma web sitesi. Opsiyonel ve normalize edilmiş biçimde saklanır
-- ("acme.com" → "https://acme.com"); kural core/helpers/crm/customerWebsite.ts.

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "websiteUrl" TEXT;
