-- AlterTable
ALTER TABLE "gallery_photos" ADD COLUMN     "embed_url" TEXT,
ALTER COLUMN "media_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "venue_content" ADD COLUMN     "gallery_visible" BOOLEAN NOT NULL DEFAULT true;
