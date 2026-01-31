-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "originalCommentId" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_originalCommentId_fkey" FOREIGN KEY ("originalCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
