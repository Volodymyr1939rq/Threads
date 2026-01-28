import { IsOptional, IsString } from "class-validator"

export class UpdateUserDto{
    @IsString({message:"your name must to contain at least 4 symbols"})
    @IsOptional()
    name?:string

    @IsString()
    @IsOptional()
    bio?:string
}