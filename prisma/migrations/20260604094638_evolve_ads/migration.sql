/*
  Warnings:

  - You are about to drop the column `is_active` on the `ad_creatives` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ad_creatives` table. All the data in the column will be lost.
  - Added the required column `kind` to the `ad_creatives` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdCreativeKind" AS ENUM ('HOUSE_IMAGE', 'HOUSE_HTML', 'ADSENSE');

-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('WEB', 'AMP', 'BOTH');

-- CreateEnum
CREATE TYPE "AdCreativeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');

-- DropIndex
DROP INDEX "ad_creatives_slot_id_is_active_priority_idx";

-- AlterTable
ALTER TABLE "ad_creatives" DROP COLUMN "is_active",
DROP COLUMN "type",
ADD COLUMN     "ad_client" TEXT,
ADD COLUMN     "ad_format" TEXT,
ADD COLUMN     "ad_slot" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "kind" "AdCreativeKind" NOT NULL,
ADD COLUMN     "platform" "AdPlatform" NOT NULL DEFAULT 'WEB',
ADD COLUMN     "status" "AdCreativeStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "ad_slots" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "is_amp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "width" INTEGER;

-- DropEnum
DROP TYPE "AdCreativeType";

-- CreateIndex
CREATE INDEX "ad_creatives_slot_id_status_priority_idx" ON "ad_creatives"("slot_id", "status", "priority");
