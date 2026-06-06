/**
 * src/modules/realtime/realtime.gateway.ts
 * Gateway Socket.IO publik: rooms skor/standings/streaming + helper emit terpusat.
 */
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/** Nama room yang didukung gateway. */
export const ROOMS = {
  liveScores: 'live-scores',
  standings: 'standings',
  streaming: 'streaming',
  match: (id: string) => `match:${id}`,
  stream: (id: string) => `stream:${id}`,
};

/** Validasi nama room yang boleh di-join klien (cegah room sembarang). */
function isAllowedRoom(room: string): boolean {
  return (
    room === ROOMS.liveScores ||
    room === ROOMS.standings ||
    room === ROOMS.streaming ||
    /^match:[\w-]+$/.test(room) ||
    /^stream:[\w-]+$/.test(room)
  );
}

/**
 * Gateway realtime publik. CORS origin dibaca dari env saat koneksi (runtime),
 * agar konsisten dengan whitelist REST tanpa perlu adapter kustom.
 */
@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, cb: (e: Error | null, ok: boolean) => void) => {
      const allowed = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      cb(null, !origin || allowed.includes(origin));
    },
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private clients = 0;

  @WebSocketServer()
  server!: Server;

  handleConnection(): void {
    this.clients += 1;
  }

  handleDisconnect(): void {
    this.clients = Math.max(0, this.clients - 1);
  }

  /** Jumlah klien terhubung (dipakai poller untuk hemat polling saat idle). */
  clientCount(): number {
    return this.clients;
  }

  /** Klien bergabung ke room (mis. match:{id}) untuk menerima update terkait. */
  @SubscribeMessage('subscribe')
  onSubscribe(
    client: Socket,
    room: string,
  ): { ok: boolean; room: string } {
    if (typeof room === 'string' && isAllowedRoom(room)) {
      void client.join(room);
      return { ok: true, room };
    }
    return { ok: false, room };
  }

  /** Klien keluar dari room. */
  @SubscribeMessage('unsubscribe')
  onUnsubscribe(client: Socket, room: string): { ok: boolean; room: string } {
    if (typeof room === 'string') void client.leave(room);
    return { ok: true, room };
  }

  /** Emit generik ke sebuah room (dipakai helper & poller). */
  emit(room: string, event: string, payload: unknown): void {
    this.server?.to(room).emit(event, payload);
  }

  // --- Helper emit khusus domain ---

  emitMatchScore(matchId: string, payload: unknown): void {
    this.emit(ROOMS.match(matchId), 'match.score.updated', payload);
    this.emit(ROOMS.liveScores, 'match.score.updated', payload);
  }

  emitMatchStatus(matchId: string, payload: unknown): void {
    this.emit(ROOMS.match(matchId), 'match.status.updated', payload);
    this.emit(ROOMS.liveScores, 'match.status.updated', payload);
  }

  emitLeaderboard(payload: unknown): void {
    this.emit(ROOMS.standings, 'leaderboard.updated', payload);
  }

  emitStreamingToggled(enabled: boolean): void {
    this.emit(ROOMS.streaming, 'streaming.toggled', { enabled });
  }

  emitStreamUpdated(): void {
    this.emit(ROOMS.streaming, 'stream.updated', {});
  }

  emitStreamViewers(streamId: string, viewers: number): void {
    this.emit(ROOMS.stream(streamId), 'stream.viewers', {
      id: streamId,
      viewers,
    });
  }
}
