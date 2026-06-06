/**
 * src/modules/gallery/dto/update-gallery-photo.dto.ts
 * Kontrak ubah foto galeri (semua field opsional); mediaId tidak boleh diganti.
 */
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGalleryPhotoDto } from './create-gallery-photo.dto';

/** Semua field CreateGalleryPhotoDto kecuali mediaId, jadi opsional. */
export class UpdateGalleryPhotoDto extends PartialType(
  OmitType(CreateGalleryPhotoDto, ['mediaId'] as const),
) {}
