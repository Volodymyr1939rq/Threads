import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { sendMessageDto } from './Dto/sendMessageDto';
import { connect } from 'http2';
import { chatHistoryDto } from './Dto/chatHistoryDto';

@Injectable()
export class ChatService {
    constructor(private readonly databaseService : DatabaseService){}

    async sendMessage(dto:sendMessageDto,senderId:string,chatId:string){
        const {content}=dto;
        const message=await this.databaseService.message.create({
            data:{content:content,
                senderId:senderId,
                chatId:chatId
            },
            include:{
                sender:{
                    select:{id:true,name:true,avatarPath:true}
                }
            }
        })
        await this.databaseService.chat.update({
            where:{id:chatId},
            data:{updatedAt:new Date()}
        })
        return message;
    }

    async GetChatHistory(chatId:string,query:chatHistoryDto){
        const {page=1,limit=20}=query
        const skip=(page-1)*limit
        const findChat=await this.databaseService.chat.findUnique({
            where:{
                id:chatId
            }
        })
    if(!findChat){
        throw new NotFoundException("chat not found")
    }
     const message=await this.databaseService.message.findMany({
        where:{
           chatId:chatId
        },
        orderBy:{
           createdAt:'desc'
        },
        take:limit,
        skip:skip,
        include:{
            sender:{select:{id:true,avatarPath:true,name:true}}
        }
    })
    return message;
    }

    async MarkMessage(chatId:string,currentUserId:string){

        await this.databaseService.message.updateMany({
            where:{
                chatId:chatId,
                senderId:{not:currentUserId},
                isRead:false
            },
            data:{
                isRead:true
            }
        })
    }
}
