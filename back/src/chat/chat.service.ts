import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import Game from 'src/Entities/Game';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
	  private chatRepository: Repository<Chat>,
    @InjectRepository(Game)
	  private readonly gameRepository: Repository<Game>
  ) {}
  async createMessage(chat: Chat): Promise<Chat> {
    return await this.chatRepository.save(chat);
  }

  async getMessages(): Promise<Chat[]> {
    return await this.chatRepository.find();
  }

  async findMessagesByUserId(id: number): Promise<Chat[]> {
    const chat = await this.getMessages();
    const res = chat.filter(message => {
      return message.users.includes(id);
    });
    return (res);
  }

  async getMatchHistoryByUserId(id: number): Promise<Game[]> {
    let games1 = await this.gameRepository.find({
      where: {
      PlayerTrueId: id,
      }
    })
    let games2 = await this.gameRepository.find({
      where: {
      PlayerFalseId: id,
      }
    })
    let games = [...games1, ...games2];
    return games;
    }
  
    async getVictoryMatchByUserId(id: number): Promise<Game[]> {
    let games = await this.gameRepository.find({
      where: {
      victoryId: id,
      }
    })
    return games;
    }
    async getDefeatMatchByUserId(id: number): Promise<Game[]> {
      let allmatch = await this.getMatchHistoryByUserId(id);
      let defeat = allmatch.filter((match) => {
        return(match.victoryId !== id);
      });
      return (defeat);
      }
}
