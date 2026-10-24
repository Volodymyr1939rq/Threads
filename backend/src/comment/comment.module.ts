import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { DatabaseService } from 'src/database/database.service';
import { PostService } from 'src/post/post.service';
import { StorageService } from 'storage.service';


@Module({
  imports:[],
  controllers: [CommentController],
  providers: [CommentService,DatabaseService,PostService,StorageService],
})
export class CommentModule {}
