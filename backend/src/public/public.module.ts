import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [SupabaseModule, ContentModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}