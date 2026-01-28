/*
  Warnings:

  - You are about to drop the column `isCompleated` on the `Task` table. All the data in the column will be lost.
  - Added the required column `isCompleted` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "isCompleated",
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL;
