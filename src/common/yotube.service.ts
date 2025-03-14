import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class YouTubeService {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3/search';

  constructor(private configService: ConfigService) {}

  async getYoutubeItems(
    query: string,
    maxResults: number,
  ): Promise<
    {
      thumbnailUrl: string;
      link: string;
      title: string;
      description: string;
      channelTitle: string;
    }[]
  > {
    const youtubeApiKey = this.configService.get<string>('YOUTUBE_API_KEY');

    if (!youtubeApiKey) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'youtube 요청에 필요한 YOUTUBE_API_KEY를 가져오지 못했습니다.',
      });
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          key: youtubeApiKey,
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults,
        },
      });

      const items = response.data.items.map((item: any) => {
        const { thumbnails, title, description, channelTitle } = item.snippet;
        const thumbnailUrl =
          thumbnails.high?.url ||
          thumbnails.medium?.url ||
          thumbnails.default?.url;
        const { videoId } = item.id;

        return {
          thumbnailUrl,
          link: `https://www.youtube.com/watch?v=${videoId}`,
          title,
          description,
          channelTitle,
        };
      });

      return items;
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `youtube: 유튜브 api 요청중 오류.\n${error.message}`,
      });
    }
  }
}
