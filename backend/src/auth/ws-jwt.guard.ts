import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate{
    constructor(private readonly jwtService:JwtService,
      private readonly configService:ConfigService
    ){}

    async canActivate(context:ExecutionContext):Promise <boolean> {
          const client:Socket=context.switchToWs().getClient()

          
    const authHeader = client.handshake.headers.authorization;
    
          const token=this.extractToken(client)

          if(!token){
           
            throw new UnauthorizedException("Tokens not found")
          }

          try {
            const secret=this.configService.get<string>('JWT_SECRET')
            const payload=await this.jwtService.verifyAsync(token,{
                secret: secret
            })

            client['user']=payload
          } catch (e) {
           
            throw new UnauthorizedException("Token is invalid")
          }
          return true;
    }
    private extractToken(client:Socket):string | undefined {
        const [type,token]=client.handshake.headers.authorization?.split(' ') ?? [];
return type === 'Bearer' ? token :undefined;
    }
}