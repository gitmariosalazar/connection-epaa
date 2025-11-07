import { Controller, Get, Post } from "@nestjs/common";
import { PhotoConnectionService } from "../../application/services/photo-connection.service";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CreatePhotoConnectionRequest } from "../../domain/schemas/dto/request/create.photo-connection.request";

@Controller('photo-connection')
export class PhotoConnectionController {
  constructor(
    private readonly photoConnectionService: PhotoConnectionService
  ) { }

  @Post('create-photo-connection')
  @MessagePattern('photo-connection.create-photo-connection')
  async createPhotoConnection(@Payload() photoConnection: CreatePhotoConnectionRequest) {
    return this.photoConnectionService.createPhotoConnection(photoConnection);
  }

  @Get('get-photo-connections-by-cadastral-key')
  @MessagePattern('photo-connection.get-photo-connections-by-cadastral-key')
  async getPhotoConnectionsByCadastralKey(@Payload() data: { cadastralKey: string }) {
    return this.photoConnectionService.getPhotoConnectionsByCadastralKey(data.cadastralKey);
  }
}