import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { DatabaseService } from 'src/database/database.service';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[JwtModule.register({
  secret: 'SECRET_KEY_123',
  signOptions: { expiresIn: '15m' }
})],
  controllers:[ChatController],
  providers: [ChatGateway, ChatService,DatabaseService],
})
export class ChatModule {}
