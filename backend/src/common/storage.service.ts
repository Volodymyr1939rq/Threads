import { DeleteBucketCommand, DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {v4 as uuidv4} from 'uuid'
@Injectable()

export class StorageService{
    private s3Client:S3Client;

    public constructor(private readonly configService:ConfigService){
        this.s3Client=new S3Client({
            region:'auto',
            endpoint:`https://${configService.get<string>("ACCOUNT_ID")}.r2.cloudflarestorage.com`,
            credentials:{
                accessKeyId:configService.get<string>("ACCESS_KEY")!,
                secretAccessKey:configService.get<string>("SECRET_KEY")!
            }
        })
    }

    async uploadFile(files:Express.Multer.File[]):Promise<string[]>{
        if(!files||files.length===0) return []

        const uploadPromise=files.map(async(file)=>{
            const fileExtension=file.originalname.split('.').pop()
            const filename=`${uuidv4()}.${fileExtension}`

            try {
                await this.s3Client.send(
                    new PutObjectCommand({
                        Bucket:this.configService.get<string>("CLOUDFLARE_BUCKET_NAME")!,
                        Key:filename,
                        Body:file.buffer,
                        ContentType:file.mimetype
                    })
                )
                return `${this.configService.get<string>("CLOUDFLARE_PUBLIC_URL")}/${filename}`
            } catch (error) {
                console.error("Помилка завантаження файлу в R2",error)
                throw new InternalServerErrorException("Не вдалося зберегти зображення")
            }
        })
        return Promise.all(uploadPromise)
    }
    
    async deleteFile(fileUrl:string):Promise<void>{
         try {
            const publicUrl=this.configService.get<string>("CLOUDFLARE_PUBLIC_URL")!
            const key=fileUrl.replace(`${publicUrl}/`,'')

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket:this.configService.get<string>("CLOUDFLARE_BUCKET_NAME")!,
                    Key:key
                })
            )
         } catch (error) {
            console.error("Помилка видалення файлу в R2",error)
         }
    }

}