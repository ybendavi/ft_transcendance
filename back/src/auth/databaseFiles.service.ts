import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import DatabaseFile from "src/Entities/Avatar";
import { Repository } from "typeorm";

@Injectable()
export class DatabaseFileService {
    constructor(@InjectRepository(DatabaseFile) private databaseFileRepository: Repository<DatabaseFile>) {}
    async uploadDatabaseFile(dataBuffer: Buffer, filename: string) {
        const newFile = await this.databaseFileRepository.create({
            filename: filename,
            data: dataBuffer
        })
        await this.databaseFileRepository.save(newFile);
        return newFile;
    }
    async getFileById(id: number) {   
        const file = await this.databaseFileRepository.findOneBy({id});
        if (!file) {
          throw new NotFoundException();
        }
        return file;
    }
}