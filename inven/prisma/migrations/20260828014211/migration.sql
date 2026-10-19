/*
  Warnings:

  - You are about to drop the column `kodeBarang` on the `barang` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Barang` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `Barang` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Barang_kodeBarang_key` ON `barang`;

-- AlterTable
ALTER TABLE `barang` DROP COLUMN `kodeBarang`,
    ADD COLUMN `berat` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `deskripsi` TEXT NULL,
    ADD COLUMN `dimensi` VARCHAR(191) NULL,
    ADD COLUMN `hargaBeli` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hargaJual` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `kondisi` VARCHAR(191) NOT NULL DEFAULT 'BARU',
    ADD COLUMN `lokasiRak` VARCHAR(191) NULL,
    ADD COLUMN `merek` VARCHAR(191) NULL,
    ADD COLUMN `minStok` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `sku` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'TERSEDIA';

-- CreateIndex
CREATE UNIQUE INDEX `Barang_sku_key` ON `Barang`(`sku`);
