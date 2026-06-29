/*
  Warnings:

  - You are about to drop the `Menu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MenuPage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MenuPage" DROP CONSTRAINT "MenuPage_menuId_fkey";

-- DropForeignKey
ALTER TABLE "MenuPage" DROP CONSTRAINT "MenuPage_pageId_fkey";

-- DropTable
DROP TABLE "Menu";

-- DropTable
DROP TABLE "MenuPage";
