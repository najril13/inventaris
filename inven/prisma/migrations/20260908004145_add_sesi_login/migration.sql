/*
  Warnings:

  - You are about to drop the column `berat` on the `barang` table. All the data in the column will be lost.
  - You are about to drop the column `dimensi` on the `barang` table. All the data in the column will be lost.
  - You are about to drop the column `hargaBeli` on the `barang` table. All the data in the column will be lost.
  - You are about to drop the column `hargaJual` on the `barang` table. All the data in the column will be lost.
  - You are about to drop the column `minStok` on the `barang` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `barang` DROP COLUMN `berat`,
    DROP COLUMN `dimensi`,
    DROP COLUMN `hargaBeli`,
    DROP COLUMN `hargaJual`,
    DROP COLUMN `minStok`;

-- CreateTable
CREATE TABLE `Sesi` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `penggunaId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Sesi_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sesi` ADD CONSTRAINT `Sesi_penggunaId_fkey` FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
