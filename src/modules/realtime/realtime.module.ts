/**
 * src/modules/realtime/realtime.module.ts
 * Modul realtime: gateway Socket.IO + poller simpora2026. Gateway diekspor agar
 * modul lain (Settings, LiveStreams) bisa emit event native saat terjadi mutasi.
 */
import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { SimporaPollerService } from './simpora-poller.service';

@Module({
  providers: [RealtimeGateway, SimporaPollerService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
