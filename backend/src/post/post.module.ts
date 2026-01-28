import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { DatabaseService } from 'src/database/database.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';
import { DatabaseModule } from 'src/database/database.module';
import { CommentModule } from 'src/comment/comment.module';
import { CommentService } from 'src/comment/comment.service';

@Module({
  imports:[FileUploadModule,DatabaseModule,CommentModule],
  controllers: [PostController],
  providers: [PostService, DatabaseService,CommentService],
})
export class PostModule {}
