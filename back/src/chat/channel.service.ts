import { Channel } from './channel.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async removeChannel(id: number) {
    return await this.channelRepository.delete(id);
  }

  async findAll(): Promise<Channel[]> {
    return this.channelRepository.find();
  }

  async findByName(tofind: string): Promise<Channel[]> {
	  return this.channelRepository.find({
					where: {
						name: tofind,
					},
				})
  }

  async createChannel(channel: Channel): Promise<Channel> {
    let chan = await this.findByName(channel.name);

    if (!chan || !chan[0]) { 
  return await this.channelRepository.save(channel); }
}

  async foundChannelTab(value: string) {
    const channels = await this.channelRepository
    .createQueryBuilder('channel')
    .where('channel.name LIKE :value', { value: `${value}%` })
    .andWhere('channel.type = :type', { type: 'public' })
    .getMany();
    const channelsByName = channels.map((channels => channels.name))
    return (channelsByName);
}

  async findAllChannelByUserId(tofind: number): Promise<Channel[]> {
    const channels = await this.findAll();
    const res = channels.filter(channel => {
      return channel.users.includes(tofind);
    });
    return res;
  }

  async isExisting(tofind: string): Promise<boolean> {
  let channel = await this.findByName(tofind);
    if (channel && channel[0]) {return true;}
    else {return false;}
  }
  async updatePassword(password: {hashed: string, salt:number} , chanid: number)
  {
    if (password) {
	    return this.channelRepository.update({
		    id: chanid,
	      }, {password : password.hashed, salt: password.salt,});
      }
      else{return this.channelRepository.update({
		    id: chanid,
	      }, {password : null, salt: null,});}
  }

  async updateOwner(user: number, chanid: number)
  {
    return this.channelRepository.update({
      id: chanid,
    }, {owner: user,});
  }

  async isAdmin(user: number, chanid:number): Promise<boolean> {
    let channel = await this.channelRepository.findOne(
      {
        where: {
          id: chanid,
        }
      }
    )
    return channel.admins.some(admin => admin == user)
  }

  async isMember(user: number, chanid:number): Promise<boolean> {
    let channel = await this.channelRepository.findOne(
      {
        where: {
          id: chanid,
        }
      }
    )
    return channel.users.some(users => users == user)
  }

  async isBan(user: number, chanid:number): Promise<boolean> {
    let channel = await this.channelRepository.findOne(
      {
        where: {
          id: chanid,
        }
      }
    )
    return (channel.bans.some(bans => bans == user));
  }

  async isMuted(user: number, chanid:number): Promise<boolean> {
    let channel = await this.channelRepository.findOne(
      {
        where: {
          id: chanid,
        }
      }
    )
    if (!channel.muted) {return false}
    else {
    return (channel.muted.some(muted => muted == user));
    }
  }

  async addAdmin(user: number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        admins: () => `"admins" || ARRAY[${user}]`,
      }
    );
  }

async removeAdmin(user: number, chanid:number) {
  return this.channelRepository.update(
    {
      id: chanid,
    },
    {
      admins: () => `array_remove("admins", ${user})`,
    }
  );
}

  async addUser(user: number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        users: () => `"users" || ARRAY[${user}]`,
      }
    );
  }

  async addbanned(user: number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        bans: () => `"bans" || ARRAY[${user}]`,
      }
    );
  }

  async addMuted(user: number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        muted: () => `"muted" || ARRAY[${user}]`,
      }
    );
  }

  async removeBanned(user:number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        bans: () => `array_remove("bans", ${user})`,
      }
    );
  }

  async removeMuted(user:number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        muted: () => `array_remove("muted", ${user})`,
      }
    );
  }

  async removeAllMuted(){
  let channels = await this.findAll();
  channels.forEach((channel) => {
    this.channelRepository.update(
      {
        id: channel.id,
      },
      {
        muted: null,
      }
    );
  });
}

  async unBan(user: number, chanid: number)
  {
    await this.removeBanned(user, chanid);
    return this.addUser(user, chanid);
  }

  async removeUser(user:number, chanid: number) {
    return this.channelRepository.update(
      {
        id: chanid,
      },
      {
        users: () => `array_remove("users", ${user})`,
      }
    );
  }
}
