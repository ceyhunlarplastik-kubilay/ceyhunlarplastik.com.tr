-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "allowedAttributeValueIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
