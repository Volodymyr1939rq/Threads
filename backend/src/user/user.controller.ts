import { Body, Controller ,Get,Param,Post, UploadedFile, UseGuards, UseInterceptors,Request, Query, Patch, Req, Delete} from '@nestjs/common';
import { UserService } from './user.service';
import { userDto } from './dto/UserDto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { paginationDto } from 'src/post/Dto/paginationDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { Usersearchdto } from './dto/UserSearchDto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() dto:userDto){
    return this.userService.createUser(dto)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get('search')
  getAllUsers(@Query() dto:Usersearchdto,@Req() req){
    const currentUserId=req.user.userId
    return this.userService.getAllUsers(dto,currentUserId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('userprofile')
  getProfile(@Req() req){
    const userId=req.user.userId
    return this.userService.getUserById(userId)
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('notifications')
  getNotifications(@Req() req){
    const userId=req.user.userId
    return this.userService.getNotifications(userId)
  }
 

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  getUserById(@Param('id') id:string,@Req() req){
    const currentUserId=req.user?.userId
    return this.userService.getUserById(id,currentUserId)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Post(":id/follow")
  follow(@Param("id") targetUserId:string,@Req() req){
    const currentUserId=req.user.userId
    return this.userService.follow(currentUserId,targetUserId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/followers')
  async getAllFollowers(@Param('id') userId:string, @Req() req){
    const currentUserId=req.user.userId
    return this.userService.getAllFollowers(userId,currentUserId)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/following')
  async getAllFollowing(@Param('id') userId:string, @Req() req){
    const currentUserId=req.user.userId
    return this.userService.getAllFollwing(userId,currentUserId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Request() req, @UploadedFile() file:Express.Multer.File){
    return this.userService.uploadAvatar(req.user.userId,file)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  updateProfile(@Body() dto:UpdateUserDto,@Req() req){
    const userId=req.user.userId
    return this.userService.updateUserProfile(userId,dto)
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('avatarfile')
  deleteAvatar(@Req() req){
    const userId=req.user.userId
    return this.userService.deleteAvatar(userId)
  }
}