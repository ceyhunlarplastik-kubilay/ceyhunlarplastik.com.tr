-- AlterEnum
-- İki yeni bileşik ölçü kodu: P-T ve W-L. Yalnız enum'a değer eklenir; mevcut kayıtlara dokunmaz.
-- With PostgreSQL versions 11 and earlier, adding more than one value to an enum in a single
-- migration is not possible; PostgreSQL 12+ (Neon, RDS) runs both statements in one migration.

ALTER TYPE "MeasurementCode" ADD VALUE 'P_T';
ALTER TYPE "MeasurementCode" ADD VALUE 'W_L';
