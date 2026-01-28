
import { IsBoolean,IsString } from "class-validator";

export class reactionDto{
    @IsBoolean()
    isLiked:boolean;
   
}