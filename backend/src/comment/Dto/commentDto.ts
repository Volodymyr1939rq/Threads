import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class commentDto{
    @IsString()
    @IsNotEmpty()
    content:string

     @IsString()
    @IsNotEmpty()
    postId:string

     @IsString()
    @IsOptional()
    parentId?:string
}