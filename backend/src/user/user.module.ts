import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseService } from 'src/database/database.service';
import { StorageService } from 'src/common/storage.service';

@Module({
  imports:[],
  controllers: [UserController],
  providers: [UserService,DatabaseService,StorageService],
  exports:[UserService]
})
export class UserModule {}
