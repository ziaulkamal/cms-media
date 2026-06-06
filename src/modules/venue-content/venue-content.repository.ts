/**
 * src/modules/venue-content/venue-content.repository.ts
 * Akses data VenueContent (upsert by venueRef) terpusat.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  venueContentInclude,
  VenueContentWithMedia,
} from './entities/venue-content.entity';

/** Repository VenueContent: query pengayaan venue. */
@Injectable()
export class VenueContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<VenueContentWithMedia[]> {
    return this.prisma.venueContent.findMany({
      include: venueContentInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findByRef(venueRef: string): Promise<VenueContentWithMedia | null> {
    return this.prisma.venueContent.findUnique({
      where: { venueRef },
      include: venueContentInclude,
    });
  }

  /** Upsert konten venue berdasarkan venueRef (unik). */
  upsert(
    venueRef: string,
    create: Prisma.VenueContentCreateInput,
    update: Prisma.VenueContentUpdateInput,
  ): Promise<VenueContentWithMedia> {
    return this.prisma.venueContent.upsert({
      where: { venueRef },
      create,
      update,
      include: venueContentInclude,
    });
  }

  deleteByRef(venueRef: string): Promise<{ id: string }> {
    return this.prisma.venueContent.delete({
      where: { venueRef },
      select: { id: true },
    });
  }
}
