import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'pexels';

@Injectable()
export class PexelsService {
  private readonly pexelsClient: any;

  constructor(private configService: ConfigService) {
    const pexelsApiKey = this.configService.get<string>('PEXELS_API_KEY');
    if (!pexelsApiKey) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'pexels요청에 필요한 PEXELS_API_KEY를 가져오지 못했습니다.',
      });
    }
    this.pexelsClient = createClient(pexelsApiKey);
  }

  async getPexelsPhotos(query: string) {
    try {
      const response = await this.pexelsClient.photos.search({
        query,
        per_page: 1,
      });
      return response?.photos[0] || null;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `pixels: pixels 요청중 오류.\n${error.message}`,
      });
    }
  }

  async createThumbnail() {}
}
