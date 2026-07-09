-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('STANDARD', 'CUSTOMIZED_FROM_EXISTING', 'FULLY_CUSTOM');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "baseProductId" INTEGER,
ADD COLUMN "modificationDetails" JSONB NOT NULL DEFAULT '[]';

-- Preserve existing rows as standard catalog products.
UPDATE "Product"
SET "productType" = 'STANDARD',
    "new_item" = false,
    "baseProductId" = NULL,
    "modificationDetails" = '[]'
WHERE "productType" = 'STANDARD';

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "Product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;