import { IsBoolean, IsNotEmpty } from "class-validator";

export class reactionCommentDto{

    @IsNotEmpty()
    @IsBoolean()
    isLiked:boolean
}