/**
 * src/modules/media/media.service.spec.ts
 * Fokus L2: unggah menolak isi berkas non-gambar walau Content-Type dipalsu,
 * dan menyimpan mime dari hasil sniff (bukan dari klien / nama file).
 */
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { ValidationError } from '../../common/errors/domain-error';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { sniffImageMime } from '../../common/utils/image-sniff';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { StoragePort } from './storage/storage-port';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const HTML = Buffer.from('<html><script>alert(1)</script></html>', 'utf8');

function makeFile(over: Partial<Express.Multer.File>): Express.Multer.File {
  return {
    fieldname: 'file', originalname: 'x.png', encoding: '7bit',
    mimetype: 'image/png', size: 12, buffer: PNG,
    stream: undefined as never, destination: '', filename: '', path: '',
    ...over,
  } as Express.Multer.File;
}

describe('image-sniff', () => {
  it('kenali PNG, tolak HTML/teks', () => {
    expect(sniffImageMime(PNG)).toBe('image/png');
    expect(sniffImageMime(HTML)).toBeNull();
    expect(sniffImageMime(Buffer.from('GIF89a....xxxx'))).toBe('image/gif');
  });
});

describe('MediaService.upload (L2)', () => {
  const storage = { save: jest.fn().mockResolvedValue('2026/09/uuid.png'), delete: jest.fn(), publicUrl: jest.fn() } as unknown as StoragePort;
  const repo = { create: jest.fn().mockResolvedValue({ id: 'm1', storageKey: '2026/09/uuid.png', mimeType: 'image/png', imageMedia: null }) } as unknown as MediaRepository;
  const config = { get: jest.fn().mockReturnValue(10_485_760) } as unknown as ConfigService;
  const service = new MediaService(repo, storage, config);
  const user: AuthenticatedUser = { id: 'u1', email: 'a@b.c', role: UserRole.ADMIN };

  afterEach(() => jest.clearAllMocks());

  it('tolak berkas HTML berlabel image/png; tak menyentuh storage', async () => {
    const file = makeFile({ mimetype: 'image/png', originalname: 'poc.php', buffer: HTML });
    await expect(service.upload(file, user)).rejects.toBeInstanceOf(ValidationError);
    expect(storage.save).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('terima PNG asli; simpan mime hasil sniff, bukan nama file', async () => {
    const file = makeFile({ mimetype: 'image/png', originalname: 'evil.php', buffer: PNG });
    await service.upload(file, user);
    expect(storage.save).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'image/png' }));
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'image/png' }));
  });
});
