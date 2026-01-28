import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket,Server } from 'socket.io';
import { sendMessageDto } from './Dto/sendMessageDto';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';
import { typingDto } from './Dto/typingDto';


@WebSocketGateway({cors:true})
export class ChatGateway implements OnGatewayConnection,OnGatewayDisconnect {
  @WebSocketServer() server:Server;
  constructor(private readonly chatService: ChatService) {}

  handleConnection(client:Socket){
    console.log("client connected",client.id)
  }

  handleDisconnect(client:Socket){
    console.log("client disconnected",client.id)
  }
  
  @SubscribeMessage("joinRoom")
  handleJoinRoom(@MessageBody('chatId') chatId:string,@ConnectedSocket() client:Socket){
    client.join(chatId);
    console.log(`Client ${client.id} joined room ${chatId}`)
  }
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')

  async sendMessage(@MessageBody() dto:sendMessageDto,@ConnectedSocket() client:Socket){
    
    const user=client['user'];
    const senderId=user?.sub || user?.id
    if(!senderId){
      console.error("user's Id not found")
      return;
    }
    

    const message=await this.chatService.sendMessage(dto,senderId,dto.chatId)
    this.server.to(dto.chatId).emit("newMessage",message)
  }

  @SubscribeMessage('typing')
  @UseGuards(WsJwtGuard)
  async handleTyping(@MessageBody() dto:typingDto,@ConnectedSocket() client:Socket){
        const user=client['user']
        const senderId=user?.sub || user?.id

        client.to(dto.chatId).emit('UserTyping',{
          userId:senderId,
          chatId:dto.chatId,
          isTyping:dto.isTyping
        })
  }
  @SubscribeMessage('markMessage')
  @UseGuards(WsJwtGuard)
  async handleMarkMessage(@MessageBody() dto:{chatId:string},@ConnectedSocket() client:Socket){
        const user=client['user'];
        const userId=user?.sub || user?.id

        await this.chatService.MarkMessage(dto.chatId,userId)

        client.to(dto.chatId).emit('MessageRead',{
          chatId:dto.chatId,
          readerId:userId
        })
  }
}
