/**
 * src/modules/users/users.service.ts
 * Aturan bisnis User: hashing kredensial, jaga keunikan email, mapping aman.
 */
import { Injectable, Logger } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { paginate } from '../../common/dto/paginated';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { generatePassword } from '../../common/utils/password';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toUserView, UserView } from './entities/user.entity';
import { UserOwnership, UsersRepository } from './users.repository';

/** Service User: orkestrasi pembuatan/perubahan akun staf redaksi. */
@Injectable()
export class UsersService {
  private readonly audit = new Logger('Audit');

  constructor(private readonly repo: UsersRepository) {}

  /** Buat user baru; password di-hash argon2, email wajib unik. */
  async create(dto: CreateUserDto): Promise<UserView> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email sudah terdaftar.');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.repo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role,
    });
    return toUserView(user);
  }

  /** Daftar user ber-paginasi (admin). */
  async list(page: number, perPage: number): Promise<Paginated<UserView>> {
    const [users, total] = await this.repo.paginate(
      (page - 1) * perPage,
      perPage,
    );
    return paginate(users.map(toUserView), total, page, perPage);
  }

  /** Ambil satu user atau lempar NotFound. */
  async getById(id: string): Promise<UserView> {
    return toUserView(await this.getEntityOrFail(id));
  }

  /** Ubah data user (nama/peran/status aktif). */
  async update(id: string, dto: UpdateUserDto): Promise<UserView> {
    await this.getEntityOrFail(id);
    const user = await this.repo.update(id, dto);
    return toUserView(user);
  }

  /** Ganti password mandiri: verifikasi password lama dulu, lalu set yang baru. */
  async changeOwnPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.getEntityOrFail(id);
    const ok = await argon2.verify(user.passwordHash, currentPassword);
    if (!ok) throw new ValidationError('Password saat ini salah.');
    await this.repo.update(id, { passwordHash: await argon2.hash(newPassword) });
  }

  /** Admin menetapkan password spesifik untuk user terpilih. */
  async setPassword(id: string, newPassword: string): Promise<UserView> {
    await this.getEntityOrFail(id);
    const user = await this.repo.update(id, {
      passwordHash: await argon2.hash(newPassword),
    });
    return toUserView(user);
  }

  /** Admin reset password ke nilai acak; kembalikan plaintext sekali pakai. */
  async resetPassword(
    id: string,
  ): Promise<{ user: UserView; password: string }> {
    await this.getEntityOrFail(id);
    const password = generatePassword();
    const user = await this.repo.update(id, {
      passwordHash: await argon2.hash(password),
    });
    return { user: toUserView(user), password };
  }

  /** Konten milik user (artikel/media/revisi) — penentu perlu transfer saat hapus. */
  async ownership(id: string): Promise<UserOwnership> {
    await this.getEntityOrFail(id);
    return this.repo.countOwnership(id);
  }

  /**
   * Hapus user. Tak boleh akun sendiri atau admin aktif terakhir. User yang
   * masih punya artikel/media/revisi wajib menyebut `transferTo` (user aktif
   * lain) — kontennya dipindah dulu; komentar tetap ada tanpa pemilik.
   */
  async remove(
    id: string,
    actor: AuthenticatedUser,
    transferTo?: string,
  ): Promise<{ id: string; transferred: UserOwnership | null }> {
    if (id === actor.id) {
      throw new ValidationError('Tidak dapat menghapus akun Anda sendiri.');
    }
    const user = await this.getEntityOrFail(id);
    if (user.role === UserRole.ADMIN && user.isActive && (await this.repo.countActiveAdmins(id)) === 0) {
      throw new ValidationError('Admin aktif terakhir tidak dapat dihapus.');
    }

    const owned = await this.repo.countOwnership(id);
    const hasContent = owned.articles + owned.media + owned.revisions > 0;
    if (hasContent && !transferTo) {
      throw new ConflictError(
        `User masih memiliki ${owned.articles} artikel, ${owned.media} media, dan ${owned.revisions} revisi. Pilih user penerima konten.`,
      );
    }
    if (transferTo) {
      if (transferTo === id) throw new ValidationError('User penerima harus berbeda.');
      const target = await this.repo.findById(transferTo);
      if (!target || !target.isActive) {
        throw new ValidationError('User penerima tidak ditemukan atau nonaktif.');
      }
    }

    await this.repo.deleteWithTransfer(id, hasContent ? (transferTo ?? null) : null);
    this.audit.log(
      `user.delete id=${id} email=${user.email} transferTo=${hasContent ? transferTo : '-'} by=${actor.id}`,
    );
    return { id, transferred: hasContent ? owned : null };
  }

  /** User masih ada & aktif? (dipakai refresh token — akun dihapus/nonaktif ditolak). */
  async findActive(id: string): Promise<User | null> {
    const user = await this.repo.findById(id);
    return user?.isActive ? user : null;
  }

  /** Verifikasi kredensial untuk login; kembalikan user bila cocok. */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.repo.findByEmail(email);
    if (!user || !user.isActive) return null;
    const ok = await argon2.verify(user.passwordHash, password);
    return ok ? user : null;
  }

  /** Ambil entity mentah (untuk internal) atau lempar NotFound. */
  private async getEntityOrFail(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User tidak ditemukan.');
    return user;
  }
}
