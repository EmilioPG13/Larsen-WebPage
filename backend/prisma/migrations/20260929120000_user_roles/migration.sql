-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INVENTARIO');

-- AlterTable: new profile columns.
ALTER TABLE "users" ADD COLUMN "name" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: convert "role" from TEXT to the "Role" enum in place. Written by
-- hand because the drop/add that Prisma would generate discards the role of the
-- existing admin account. The old default ('admin') is a text literal, so it
-- must be dropped before the type change and re-created afterwards. Existing
-- rows hold 'admin', which UPPER() turns into the enum value 'ADMIN'; any other
-- unexpected value makes the cast fail and the whole migration roll back.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING UPPER("role")::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
