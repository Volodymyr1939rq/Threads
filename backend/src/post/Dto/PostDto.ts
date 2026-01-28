import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class postDto{
    @IsOptional()
    @IsString()
    title?:string
    
    @IsNotEmpty()
    @IsString()
    description:string

}