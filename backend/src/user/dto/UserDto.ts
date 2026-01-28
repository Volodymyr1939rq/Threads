import { IsString } from "class-validator";

export class userDto{
    @IsString()
    name:string

    @IsString()
    email:string

    @IsString()
    password:string

    @IsString()
    bio?:string


}