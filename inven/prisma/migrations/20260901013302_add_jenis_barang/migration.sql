/*
  Warnings:

  - You are about to drop the column `kategori` on the `barang` table. All the data in the column will be lost.
  - Added the required column `kategoriId` to the `Barang` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `barang` DROP COLUMN `kategori`,
    ADD COLUMN `kategoriId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `JenisBarang` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `JenisBarang_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Barang` ADD CONSTRAINT `Barang_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `JenisBarang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
