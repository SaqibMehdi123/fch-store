-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "tracking_checked_at" TIMESTAMP(3),
ADD COLUMN     "tracking_events" JSONB,
ADD COLUMN     "tracking_status" TEXT;

