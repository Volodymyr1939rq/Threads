/*
  Warnings:

  - A unique constraint covering the columns `[userId,commentId]` on the table `Reactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reactions" ADD COLUMN     "commentId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reactions_userId_commentId_key" ON "Reactions"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
