/**
 * src/common/errors/domain-error.ts
 * Base error domain dengan kode mesin + status HTTP, dipetakan terpusat oleh filter.
 */

/** Error domain yang diketahui (expected); dipetakan ke HTTP status oleh AllExceptionsFilter. */
export abstract class DomainError extends Error {
  /** Kode mesin stabil untuk client (mis. "ARTICLE_NOT_FOUND"). */
  abstract readonly code: string;
  /** Status HTTP yang sesuai untuk error ini. */
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Resource tidak ditemukan → 404. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly status = 404;
}

/** Input tidak valid pada level bisnis → 422. */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly status = 422;
}

/** Tidak terautentikasi → 401. */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly status = 401;
}

/** Terautentikasi tapi tidak berhak atas aksi ini → 403. */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly status = 403;
}

/** Konflik state (mis. slug duplikat) → 409. */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly status = 409;
}
