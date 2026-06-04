/**
 * src/modules/users/users.service.ts
 * Aturan bisnis User: hashing kredensial, jaga keunikan email, mapping aman.
 */
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { ConflictError, NotFoundError } from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { paginate } from '../../common/dto/paginated';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toUserView, UserView } from './entities/user.entity';
import { UsersRepository } from './users.repository';

/** Service User: orkestrasi pembuatan/perubahan akun staf redaksi. */
@Injectable()
export class UsersService {
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
