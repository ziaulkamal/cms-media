/**
 * src/modules/ads/dto/create-ad-creative.dto.ts
 * Kontrak materi iklan; field wajib berbeda per kind (HOUSE_IMAGE/HOUSE_HTML/ADSENSE).
 */
import { AdCreativeKind, AdCreativeStatus, AdPlatform } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Field untuk membuat creative; validasi kondisional sesuai kind. */
export class CreateAdCreativeDto {
  @IsEnum(AdCreativeKind)
  kind!: AdCreativeKind;

  @IsOptional()
  @IsEnum(AdPlatform)
  platform?: AdPlatform;

  @IsOptional()
  @IsEnum(AdCreativeStatus)
  status?: AdCreativeStatus;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  // --- HOUSE_IMAGE ---
  @ValidateIf((o) => o.kind === AdCreativeKind.HOUSE_IMAGE)
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ValidateIf((o) => o.kind === AdCreativeKind.HOUSE_IMAGE)
  @IsUrl({ require_tld: false })
  targetUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  alt?: string;

  // --- HOUSE_HTML ---
  @ValidateIf((o) => o.kind === AdCreativeKind.HOUSE_HTML)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  htmlSnippet?: string;

  // --- ADSENSE ---
  @ValidateIf((o) => o.kind === AdCreativeKind.ADSENSE)
  @Matches(/^ca-pub-\d{10,20}$/, {
    message: 'adClient harus berformat ca-pub-<digit>.',
  })
  adClient?: string;

  @ValidateIf((o) => o.kind === AdCreativeKind.ADSENSE)
  @Matches(/^\d{6,20}$/, { message: 'adSlot harus berupa angka.' })
  adSlot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  adFormat?: string;

  // --- Dimensi override (opsional) ---
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4000)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  /** Mulai tayang (ISO-8601); kosong = langsung saat status ACTIVE. */
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  /** Berhenti tayang (ISO-8601); kosong = tanpa batas. */
  @IsOptional()
  @IsISO8601()
  endAt?: string;
}
