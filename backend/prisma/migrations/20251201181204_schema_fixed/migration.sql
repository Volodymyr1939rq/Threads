/*
  Warnings:

  - You are about to drop the column `type` on the `Reactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reactions" DROP COLUMN "type",
ADD COLUMN     "isLiked" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "TypeReactions";
