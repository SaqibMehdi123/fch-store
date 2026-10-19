-- Phase 5 — email_log idempotency + rendered-email storage.
-- 1) Remove legacy duplicate log rows (same order + template) so the unique
--    index below can be created. NULL order_id rows (contact stubs) are kept.
DELETE FROM "email_log" AS a
  USING "email_log" AS b
  WHERE a."order_id" IS NOT NULL
    AND a."order_id" = b."order_id"
    AND a."template" = b."template"
    AND a."id" < b."id";

-- 2) New columns: dedupe key + rendered subject/html for the admin preview.
ALTER TABLE "email_log" ADD COLUMN "dedupe_key" TEXT NOT NULL DEFAULT '';
ALTER TABLE "email_log" ADD COLUMN "subject" TEXT;
ALTER TABLE "email_log" ADD COLUMN "html" TEXT;

-- 3) Idempotency: one row per (order, template, dedupe key). Repeated
--    payment events (upload → reject → re-upload) pass the payment id as
--    the dedupe key so a *new* rejection still sends, while retries of the
--    same decision never duplicate.
CREATE UNIQUE INDEX "email_log_order_template_dedupe_key"
  ON "email_log"("order_id", "template", "dedupe_key");
