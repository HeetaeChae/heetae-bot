import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/services/supabase.service';

@Injectable()
export class BlogV2KeywordService {
  constructor(private supabaseService: SupabaseService) {}

  // blog_v2_keywords table 데이터 중 하나를 랜덤하게 골라옴.
  async getRandomKeyword() {
    // used_at이 가장 최근인 city 가져오기. (가장 최근에 사용된 city)
    const { data: recentData, error: recentError } = await this.supabaseService
      .getClient()
      .from('blog_v2_keywords')
      .select('city')
      .order('used_at', { ascending: false })
      .limit(1)
      .single();

    // 최근에 사용된 city를 제외한 city keyword.
    const { data: keywordData, error: keywordError } =
      await this.supabaseService
        .getClient()
        .from('blog_v2_keywords')
        .select('*')
        .neq('city', recentData.city)
        .order('RANDOM()', { ascending: true })
        .limit(1)
        .single();

    return keywordData;
  }

  // 사용된 키워드를 업데이트 처리.
  async updateUsedKeyword(id: number) {}
}
