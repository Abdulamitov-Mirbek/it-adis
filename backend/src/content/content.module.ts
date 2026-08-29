import { Module } from "@nestjs/common";
import { SupabaseModule } from "../supabase/supabase.module";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";

@Module({
  imports: [SupabaseModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
