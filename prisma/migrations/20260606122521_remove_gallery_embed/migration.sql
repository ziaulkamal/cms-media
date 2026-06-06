/*
  Warnings:

  - You are about to drop the column `embed_url` on the `gallery_photos` table. All the data in the column will be lost.
  - Made the column `media_id` on table `gallery_photos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "gallery_photos" DROP COLUMN "embed_url",
ALTER COLUMN "media_id" SET NOT NULL;
