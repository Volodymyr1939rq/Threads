import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { DatabaseService } from 'src/database/database.service';
import { PostService } from 'src/post/post.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  imports:[FileUploadModule],
  controllers: [CommentController],
  providers: [CommentService,DatabaseService,PostService],
})
export class CommentModule {}
