import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/services/supabase.service';
import { HotelType } from './common/blog-v2.enum';
import { KeywordData } from './common/blog-v2.interface';

@Injectable()
export class BlogV2KeywordService {
  constructor(private supabaseService: SupabaseService) {}

  // blog_v2_keywords table 데이터 중 하나를 랜덤하게 골라옴.
  async getRandomKeyword(): Promise<KeywordData> {
    try {
      // used_at이 가장 최근인 city 가져오기. (가장 최근에 사용된 city)
      const {
        data: { city: recentCity },
      } = await this.supabaseService
        .getClient()
        .from('blog_v2_keywords')
        .select('city')
        .order('used_at', { ascending: false })
        .limit(1)
        .single();

      // 최근에 사용된 city를 제외한 city keyword.
      const {
        data: { id, city, hotel_type: hotelType },
      } = await this.supabaseService
        .getClient()
        .from('blog_v2_keywords')
        .select('*')
        .eq('is_valid', true)
        .neq('city', recentCity)
        .order('RANDOM()', { ascending: true })
        .limit(1)
        .single();

      // 가져온 keyword 데이터 연관 post_url.
      const {
        data: { post_url: relatedUrl },
      } = await this.supabaseService
        .getClient()
        .from('blog_v2_keywords')
        .select('post_url')
        .eq('city', city)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      return { id, city, hotelType, relatedUrl };
    } catch (error) {
      //
    }
  }

  // 요건 충족 안된 키워드 in-valid 처리.
  async updateInvalidKeyword(id: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_v2_keywords')
      .update({ is_valid: false })
      .eq('id', id);

    if (error) {
      //
    }

    return data;
  }

  // 사용된 키워드를 업데이트 처리.
  async updateUsedKeyword(id: number, postUrl: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_v2_keywords')
      .update({ used_at: new Date().toISOString(), post_url: postUrl })
      .eq('id', id);

    if (error) {
      //
    }

    return data;
  }

  // 키워드 데이터 입력.
  async createKeyword(city: string) {
    const hotelTypes = Object.values(HotelType);
    const keywordDatas = hotelTypes.map((hotelType) => ({ hotelType, city }));

    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_v2_keywords')
      .insert(keywordDatas);

    if (error) {
      //
    }

    return data;
  }
}
