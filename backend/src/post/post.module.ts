import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { DatabaseService } from 'src/database/database.service';
import { DatabaseModule } from 'src/database/database.module';
import { CommentModule } from 'src/comment/comment.module';
import { CommentService } from 'src/comment/comment.service';
import { StorageService } from 'src/common/storage.service';

@Module({
  imports:[DatabaseModule,CommentModule],
  controllers: [PostController],
  providers: [PostService, DatabaseService,CommentService,StorageService],
})
export class PostModule {}
