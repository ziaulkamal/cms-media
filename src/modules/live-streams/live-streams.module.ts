/**
 * src/modules/live-streams/live-streams.module.ts
 * Modul LiveStream: kanal siaran langsung + serving publik.
 */
import { Module } from '@nestjs/common';
import { LiveStreamsController } from './live-streams.controller';
import { LiveStreamsRepository } from './live-streams.repository';
import { LiveStreamsService } from './live-streams.service';

@Module({
  controllers: [LiveStreamsController],
  providers: [LiveStreamsService, LiveStreamsRepository],
  exports: [LiveStreamsService],
})
export class LiveStreamsModule {}
