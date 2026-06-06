-- CreateEnum
CREATE TYPE "MenuLocation" AS ENUM ('MAIN', 'FOOTER', 'FOOTER_BOTTOM');

-- CreateEnum
CREATE TYPE "MenuLinkType" AS ENUM ('ANCHOR', 'ROUTE', 'EXTERNAL');

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "location" "MenuLocation" NOT NULL,
    "parent_id" UUID,
    "label" TEXT NOT NULL,
    "type" "MenuLinkType" NOT NULL DEFAULT 'ROUTE',
    "url" TEXT,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_items_location_parent_id_position_idx" ON "menu_items"("location", "parent_id", "position");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
