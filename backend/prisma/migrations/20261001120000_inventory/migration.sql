-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('DISPONIBLE', 'APARTADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "UnitModality" AS ENUM ('EN_BODEGA', 'BAJO_PEDIDO');

-- AlterTable
ALTER TABLE "machines" ADD COLUMN     "onOrder" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "inventoryUnitId" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "source" TEXT,
ALTER COLUMN "company" DROP NOT NULL,
ALTER COLUMN "budget" DROP NOT NULL,
ALTER COLUMN "purchaseDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "inventory_units" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "brandId" TEXT,
    "model" TEXT NOT NULL,
    "gauge" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "modality" "UnitModality" NOT NULL DEFAULT 'EN_BODEGA',
    "receivedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "notes" TEXT,
    "machineId" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" "UnitStatus",
    "toStatus" "UnitStatus",
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_externalId_key" ON "inventory_units"("externalId");

-- CreateIndex
CREATE INDEX "inventory_units_status_idx" ON "inventory_units"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_brand_serialNumber_key" ON "inventory_units"("brand", "serialNumber");

-- CreateIndex
CREATE INDEX "inventory_movements_unitId_createdAt_idx" ON "inventory_movements"("unitId", "createdAt");

-- CreateIndex
CREATE INDEX "leads_inventoryUnitId_idx" ON "leads"("inventoryUnitId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_inventoryUnitId_fkey" FOREIGN KEY ("inventoryUnitId") REFERENCES "inventory_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "inventory_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Aries is sold to order from Italy: flag the two existing spec sheets so the
-- catalog lists them without physical units. Idempotent and safe on a fresh
-- database (it just matches no rows).
UPDATE "machines" SET "onOrder" = true WHERE "id" IN ('aries-3', 'aries-6');
