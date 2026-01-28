/*
  Warnings:

  - You are about to drop the column `AvatarPath` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "AvatarPath",
ADD COLUMN     "image" TEXT;
