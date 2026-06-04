-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "tsv" tsvector;

-- CreateIndex
CREATE INDEX "articles_tsv_idx" ON "articles" USING GIN ("tsv");

-- Fungsi pengisi tsv: judul (A) + excerpt (B) + body (C). Config 'simple' agar netral bahasa.
CREATE OR REPLACE FUNCTION articles_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.body::text, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Sinkronkan tsv setiap insert/update pada kolom sumber.
CREATE TRIGGER articles_tsv_trigger
BEFORE INSERT OR UPDATE OF title, excerpt, body ON "articles"
FOR EACH ROW EXECUTE FUNCTION articles_tsv_update();
