/**
 * src/modules/live-streams/dto/create-live-stream.dto.ts
 * Kontrak buat kanal siaran; `youtube` menerima URL tempel atau id mentah.
 */
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Field untuk mendaftarkan kanal siaran langsung. */
export class CreateLiveStreamDto {
  /** URL YouTube (di-paste) atau video id; dinormalkan di service. */
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  youtube!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sportName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  matchRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  venueName?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isLive?: boolean;
}
