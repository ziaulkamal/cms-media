/**
 * src/modules/live-streams/live-streams.module.ts
 * Modul LiveStream: kanal siaran langsung + serving publik.
 */
import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { LiveStreamsController } from './live-streams.controller';
import { LiveStreamsRepository } from './live-streams.repository';
import { LiveStreamsService } from './live-streams.service';

@Module({
  imports: [RealtimeModule],
  controllers: [LiveStreamsController],
  providers: [LiveStreamsService, LiveStreamsRepository],
  exports: [LiveStreamsService],
})
export class LiveStreamsModule {}
