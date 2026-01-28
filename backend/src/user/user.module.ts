import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseService } from 'src/database/database.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';
@Module({
  imports:[FileUploadModule],
  controllers: [UserController],
  providers: [UserService,DatabaseService],
  exports:[UserService]
})
export class UserModule {}
