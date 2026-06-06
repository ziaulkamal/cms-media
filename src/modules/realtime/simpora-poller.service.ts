/**
 * src/modules/realtime/simpora-poller.service.ts
 * Polling API publik simpora2026 -> diff -> emit skor/status/leaderboard via gateway.
 */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';

/** Ringkasan state pertandingan yang dipantau untuk deteksi perubahan. */
interface MatchState {
  score: string;
  status: string;
}

/** Ekstrak id pertandingan dari objek apa pun bentuknya (toleran skema). */
function matchId(m: Record<string, unknown>): string | null {
  const id = m.id ?? m.matchId ?? m.uuid;
  return id == null ? null : String(id);
}

/** Rangkai representasi skor dari beragam kemungkinan field. */
function matchScore(m: Record<string, unknown>): string {
  if (typeof m.score === 'string') return m.score;
  // simpora: skor ada di relasi result.result_data (JSON {home,away}/{result}/{score}).
  const rd = (m.result as Record<string, unknown> | undefined)?.result_data as
    | Record<string, unknown>
    | undefined;
  if (rd) {
    if (rd.result != null) return String(rd.result);
    if (rd.score != null) return String(rd.score);
    return `${rd.home ?? 0}-${rd.away ?? 0}`;
  }
  const home = m.homeScore ?? m.home_score ?? (m.score as Record<string, unknown>)?.home;
  const away = m.awayScore ?? m.away_score ?? (m.score as Record<string, unknown>)?.away;
  return `${home ?? 0}-${away ?? 0}`;
}

/**
 * Poller server-to-server. Hanya jalan bila ada klien terhubung & URL diset,
 * sehingga aman saat simpora2026 belum tersedia (mode placeholder).
 */
@Injectable()
export class SimporaPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimporaPollerService.name);
  private readonly url: string;
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;
  private polling = false;

  private lastMatches = new Map<string, MatchState>();
  private lastLeaderboardHash = '';

  constructor(
    private readonly gateway: RealtimeGateway,
    config: ConfigService,
  ) {
    this.url = config.get<string>('simporaApiUrl') ?? '';
    this.intervalMs = Number(process.env.SIMPORA_POLL_MS ?? 4000);
  }

  onModuleInit(): void {
    if (!this.url) {
      this.logger.warn('SIMPORA_API_URL kosong; poller dinonaktifkan.');
      return;
    }
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Satu siklus poll; lewati saat tak ada klien (hemat & senyap). */
  private async tick(): Promise<void> {
    if (this.polling || this.gateway.clientCount() === 0) return;
    this.polling = true;
    try {
      await Promise.all([this.pollMatches(), this.pollLeaderboard()]);
    } finally {
      this.polling = false;
    }
  }

  /** Ambil JSON dari endpoint simpora dengan timeout; null bila gagal. */
  private async getJson(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${this.url}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Normalisasi respons menjadi array; bongkar paginator Laravel (data.data). */
  private toArray(body: unknown): Record<string, unknown>[] {
    if (Array.isArray(body)) return body as Record<string, unknown>[];
    const data = (body as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    // simpora bungkus paginator: { data: { current_page, data: [...] } }
    const nested = (data as { data?: unknown })?.data;
    return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
  }

  /** Poll pertandingan berjalan; emit saat skor/status berubah. */
  private async pollMatches(): Promise<void> {
    const matches = this.toArray(await this.getJson('/matches?status=ongoing'));
    for (const m of matches) {
      const id = matchId(m);
      if (!id) continue;
      const next: MatchState = { score: matchScore(m), status: String(m.status ?? 'ongoing') };
      const prev = this.lastMatches.get(id);
      if (!prev || prev.score !== next.score) {
        this.gateway.emitMatchScore(id, m);
      }
      if (prev && prev.status !== next.status) {
        this.gateway.emitMatchStatus(id, m);
      }
      this.lastMatches.set(id, next);
    }
  }

  /** Poll leaderboard; emit saat hash payload berubah. */
  private async pollLeaderboard(): Promise<void> {
    const body = await this.getJson('/leaderboard');
    if (body == null) return;
    const hash = JSON.stringify(body);
    if (hash !== this.lastLeaderboardHash) {
      this.lastLeaderboardHash = hash;
      this.gateway.emitLeaderboard(body);
    }
  }
}
