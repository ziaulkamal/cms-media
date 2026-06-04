-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "seo_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
