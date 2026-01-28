import { IsNumber, IsOptional, IsString } from "class-validator";
import { paginationDto } from "src/post/Dto/paginationDto";

export class Usersearchdto extends paginationDto{
    @IsString()
    @IsOptional()
    startDate?:string;

    @IsString()
    @IsOptional()
    endDate?:string;
}