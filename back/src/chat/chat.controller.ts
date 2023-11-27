import { Controller, Get, Post, Body } from '@nestjs/common';
import { Chat } from './chat.entity';
import { ChatService } from './chat.service'; 

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  async getMessages(): Promise<Chat[]> {
    return this.chatService.getMessages();
  }

  @Post('messages')
  async createMessage(@Body() chat: Chat): Promise<Chat> {
    return this.chatService.createMessage(chat);
  }
}

