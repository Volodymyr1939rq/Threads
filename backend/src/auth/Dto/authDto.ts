import { IsEmail, IsNumber, IsString, MinLength } from "class-validator";

export class authDto{
    @IsString({message:"Your username must be a string"})
    @MinLength(1)
    name!:string;

    @IsEmail()
    email!:string;

    @IsString()
    @MinLength(6,{message:"Your password must be at least 6 characters"})
    password!:string;
}