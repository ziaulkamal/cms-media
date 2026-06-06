/**
 * src/modules/live-streams/dto/update-live-stream.dto.ts
 * Kontrak ubah kanal siaran (semua field opsional).
 */
import { PartialType } from '@nestjs/swagger';
import { CreateLiveStreamDto } from './create-live-stream.dto';

/** Semua field CreateLiveStreamDto menjadi opsional. */
export class UpdateLiveStreamDto extends PartialType(CreateLiveStreamDto) {}
