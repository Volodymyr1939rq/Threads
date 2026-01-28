import { Body, Controller, Post, UseGuards,Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './Dto/loginDto';
import { refreshTokenDto } from './Dto/RefreshTokenDto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
    login(@Body() dto:loginDto){
        return this.authService.login(dto)
    }

  @Post('refresh')
  refresh(@Body() dto:refreshTokenDto){
    return this.authService.refresh(dto)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Request() req){
    const userId=req.user.userId
    return this.authService.logout(userId)
  }
}
