import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { chatHistoryDto } from "./Dto/chatHistoryDto";

@Controller('chat')
export class ChatController{
    constructor(private readonly chatService:ChatService){}

    @Get(':id/messages')
    getChatHistory(@Param('id') chatId:string,@Query() query:chatHistoryDto){
    return this.chatService.GetChatHistory(chatId,query)
}
}