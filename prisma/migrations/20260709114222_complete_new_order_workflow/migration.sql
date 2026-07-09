-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "employeeId" INTEGER,
ADD COLUMN     "finalTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "manualTotalOverride" DECIMAL(10,2),
ADD COLUMN     "orderNote" TEXT,
ADD COLUMN     "originalTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "itemNote" TEXT,
ADD COLUMN     "modifications" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "sellingPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "new_item" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;
