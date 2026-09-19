/**
 * src/modules/users/users.service.spec.ts
 * Uji hapus user: pengaman (akun sendiri, admin terakhir) dan transfer konten.
 */
import { User, UserRole } from '@prisma/client';
import {
  ConflictError,
  ValidationError,
} from '../../common/errors/domain-error';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

function makeUser(over: Partial<User> = {}): User {
  return {
    id: 'u2',
    email: 'penulis@cms.local',
    passwordHash: 'x',
    name: 'Penulis',
    role: UserRole.AUTHOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe('UsersService.remove', () => {
  const repo = {
    findById: jest.fn(),
    countOwnership: jest.fn(),
    countActiveAdmins: jest.fn(),
    deleteWithTransfer: jest.fn(),
  } as unknown as UsersRepository;
  const service = new UsersService(repo);
  const admin: AuthenticatedUser = { id: 'a1', email: 'admin@cms.local', role: UserRole.ADMIN };
  const none = { articles: 0, media: 0, revisions: 0 };

  afterEach(() => jest.clearAllMocks());

  it('menolak menghapus akun sendiri', async () => {
    await expect(service.remove('a1', admin)).rejects.toBeInstanceOf(ValidationError);
    expect(repo.deleteWithTransfer).not.toHaveBeenCalled();
  });

  it('menolak menghapus admin aktif terakhir', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(makeUser({ id: 'a2', role: UserRole.ADMIN }));
    (repo.countActiveAdmins as jest.Mock).mockResolvedValue(0);
    await expect(service.remove('a2', admin)).rejects.toBeInstanceOf(ValidationError);
    expect(repo.deleteWithTransfer).not.toHaveBeenCalled();
  });

  it('user tanpa konten langsung dihapus', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(makeUser());
    (repo.countOwnership as jest.Mock).mockResolvedValue(none);
    await expect(service.remove('u2', admin)).resolves.toEqual({ id: 'u2', transferred: null });
    expect(repo.deleteWithTransfer).toHaveBeenCalledWith('u2', null);
  });

  it('user berkonten tanpa penerima -> Conflict, tak ada yang terhapus', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(makeUser());
    (repo.countOwnership as jest.Mock).mockResolvedValue({ articles: 3, media: 1, revisions: 2 });
    await expect(service.remove('u2', admin)).rejects.toBeInstanceOf(ConflictError);
    expect(repo.deleteWithTransfer).not.toHaveBeenCalled();
  });

  it('user berkonten dengan penerima aktif -> konten dipindah lalu dihapus', async () => {
    (repo.findById as jest.Mock).mockImplementation(async (id: string) =>
      id === 'u2' ? makeUser() : makeUser({ id: 'u3', email: 'editor@cms.local' }),
    );
    const owned = { articles: 3, media: 1, revisions: 2 };
    (repo.countOwnership as jest.Mock).mockResolvedValue(owned);
    await expect(service.remove('u2', admin, 'u3')).resolves.toEqual({ id: 'u2', transferred: owned });
    expect(repo.deleteWithTransfer).toHaveBeenCalledWith('u2', 'u3');
  });

  it('penerima nonaktif ditolak', async () => {
    (repo.findById as jest.Mock).mockImplementation(async (id: string) =>
      id === 'u2' ? makeUser() : makeUser({ id: 'u3', isActive: false }),
    );
    (repo.countOwnership as jest.Mock).mockResolvedValue({ articles: 1, media: 0, revisions: 0 });
    await expect(service.remove('u2', admin, 'u3')).rejects.toBeInstanceOf(ValidationError);
    expect(repo.deleteWithTransfer).not.toHaveBeenCalled();
  });
});
