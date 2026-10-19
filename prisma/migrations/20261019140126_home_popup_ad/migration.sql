-- CreateTable
CREATE TABLE "popup_ads" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "headline" TEXT,
    "subline" TEXT,
    "link_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popup_ads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "popup_ads_is_active_created_at_idx" ON "popup_ads"("is_active", "created_at");
