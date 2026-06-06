-- CreateTable
CREATE TABLE "live_streams" (
    "id" UUID NOT NULL,
    "youtube_id" TEXT NOT NULL,
    "sport_name" TEXT,
    "match_ref" TEXT,
    "title" TEXT NOT NULL,
    "venue_name" TEXT,
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_content" (
    "id" UUID NOT NULL,
    "venue_ref" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_media_id" UUID,
    "gallery" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_streams_is_live_sort_order_idx" ON "live_streams"("is_live", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "venue_content_venue_ref_key" ON "venue_content"("venue_ref");

-- AddForeignKey
ALTER TABLE "venue_content" ADD CONSTRAINT "venue_content_image_media_id_fkey" FOREIGN KEY ("image_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
