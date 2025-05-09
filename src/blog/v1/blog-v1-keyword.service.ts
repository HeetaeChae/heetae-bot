import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/services/supabase.service';

@Injectable()
export class BlogV1KeywordService {
  constructor(private supabaseService: SupabaseService) {}
}
