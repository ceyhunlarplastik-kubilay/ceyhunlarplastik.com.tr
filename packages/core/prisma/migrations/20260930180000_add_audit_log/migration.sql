-- Veri değişikliği denetim kaydı (kim, ne zaman, nereden, neyi, neyden neye). Yalnız yeni tablo:
-- mevcut tablolara dokunulmaz. Değişiklikle aynı transaction'da yazılır, yalnız EKLENİR.
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM');

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT,
    "action" "AuditAction" NOT NULL,
    "actorType" "AuditActorType" NOT NULL DEFAULT 'USER',
    "actorUserId" TEXT,
    "actorCognitoSub" TEXT,
    "actorEmail" TEXT,
    "actorName" TEXT,
    "actorGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
