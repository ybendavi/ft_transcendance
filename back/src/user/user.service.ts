import { Injectable, HttpException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/Entities/User';
import { InsertResult, Repository } from 'typeorm';
import { Relationship } from '../Entities/Relationship';
import { AppGateway } from 'src/app/app.gateway';
import Game from 'src/Entities/Game';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Relationship)
        private relationshipRepository: Repository<Relationship>,
        @InjectRepository(Game)
        private gameRepository: Repository<Game>,
		    private readonly appGateway: AppGateway,
      ) {}

    
    async foundUsersTab(id: number, value: string) {
      const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :value', { value: `${value}%` })
      .getMany();
      return (users);
    }

    async sendFriendRequest(idSender: number, idReceiver: number) {

      if (await this.isFriend(idSender, idReceiver)) {
        throw new HttpException('User already your friend', 407);
      }
      if (await this.isRequested(idSender, idReceiver)) {
        throw new HttpException('This User already sent you a friend request', 408);
      }
      await this.relationshipRepository.insert({
        idReceiver: idReceiver,
        idSender: idSender,
        type: "request",
      });
      await this.appGateway.sendFriendRequestToReceiver(idReceiver, idSender);
    }
  
    async handleAllFriendRequests(id: number) {
      const relationships = await this.relationshipRepository.find({
       where: {type: "request", idReceiver: id}
      })
      const sendersIds = relationships.map((rel) => rel.idSender);
      if (!sendersIds.length) {
        return [];
      }
      const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...sendersIds)', { sendersIds })
      .getMany();
      return users;
    }

    async handleAllFriendList(id: number) {
      const relationships = await this.relationshipRepository.find({
        where: [
          { type: 'friendship', idReceiver: id },
          { type: 'friendship', idSender: id },
        ],
      });
      if (!relationships.length) {
        return [];
      }
      const friendsIds = relationships.map((rel) => {
        if (rel.idReceiver === id) {
          return rel.idSender;
        }
        else {
          return rel.idReceiver;
        }
      })
      const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...friendsIds)', { friendsIds })
      .getMany();
      return users;
    }

    async receiveFriendRequest(idSender: number, idReceiver: number): Promise<InsertResult> {

      return await this.relationshipRepository.insert({
        idReceiver: idReceiver,
        idSender: idSender,
        type: "request",
      });
    }

    async acceptFriendRequest(idSender: number, idReceiver: number) {
      const relationship = await this.relationshipRepository.findOneBy({
        idReceiver: idSender,
        idSender: idReceiver,});
      if (relationship) {
         await this.relationshipRepository.update({
          idReceiver: idSender,
          idSender: idReceiver,},
          {type: "friendship"});
      }
    }

    async refuseFriendRequest(idSender: number, idReceiver: number) {

      const deleted = await this.relationshipRepository.findOneBy({idSender: idReceiver, idReceiver: idSender})
      await this.relationshipRepository.delete(deleted.id);
    }

    async findUserById(id: number) {
      return this.userRepository.findOneBy({id: id});
    }

    async friendRelationships(){
      return this.relationshipRepository;
    }

    async addUser(username: string, email: string) {
      return this.userRepository.insert({
        username: username,
        email: email,
      });
    }

    async deleteFriendRequest(idSender: number, idReceiver:number) {
      const friend = await this.relationshipRepository.findOne({
        where: [
          { idSender: idReceiver, idReceiver: idSender },
          { idSender: idSender, idReceiver: idReceiver },
        ]
      });
      if (friend) {
        await this.relationshipRepository.delete(friend.id);
        return true;
      }
      return false;
    }

    async isFriend(idSender: number, idReceiver: number) {
      const friend = await this.relationshipRepository.findOne({
        where: [
          { idSender: idReceiver, idReceiver: idSender },
          { idSender: idSender, idReceiver: idReceiver },
        ]
      });
      return friend? true : false;
    }

    async isRequested(idSender: number, idReceiver: number) {
      const friend = await this.relationshipRepository.findOne({
        where:
          { idSender: idReceiver, idReceiver: idSender },
      });
      return friend? true : false;
    }



    
	  async sendScore(scoreTrue: number, scoreFalse: number, PlayerTrueId: number, PlayerFalseId: number, powerUp: boolean, victoryId: number) {
        const newGame = {
          scoreTrue,
          PlayerTrueId,
          scoreFalse,
          PlayerFalseId,
          powerUp,
          victoryId
        }
        const victoryUser = await this.findUserById(victoryId);
        let level = victoryUser.level;
        level += Math.trunc(100 / Math.round(level)) / 100;
        if (level - Math.round(level) > 0.95) {
          level = Math.round(level) + 1;
        }
        await this.userRepository.update(victoryId, {
          level: level
        });
        await this.gameRepository.save(newGame)
      }

      async updateSocket(userid: number, socket: string) {
        return this.userRepository.update({
          id: userid,
        }, {socketgame : socket,});
      }

      async findUserBySocket(socket: string)
      {
        const User = await this.userRepository.findOne({ where: { socketgame: socket, } });
        return User;
      }
    
}
