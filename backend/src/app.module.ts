import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from 'src/common/storage.service';


@Module({
  providers: [AppService,StorageService],
  controllers: [AppController],
  imports: [DatabaseModule, UserModule, PostModule, AuthModule, CommentModule, ChatModule,ConfigModule.forRoot({isGlobal:true})],
  
})
export class AppModule {}
