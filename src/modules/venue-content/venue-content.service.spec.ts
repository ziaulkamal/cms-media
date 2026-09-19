/**
 * src/modules/venue-content/venue-content.service.spec.ts
 * Uji upsert konten venue: foto utama tidak ikut terlepas saat edit, dan
 * deskripsi opsional (admin cukup memberi foto).
 */
import { ConfigService } from '@nestjs/config';
import { VenueContentRepository } from './venue-content.repository';
import { VenueContentService } from './venue-content.service';

describe('VenueContentService.upsert', () => {
  const saved = {
    id: 'vc1',
    venueRef: '7',
    description: '',
    imageMediaId: null,
    imageMedia: null,
    gallery: [],
    galleryVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repo = { upsert: jest.fn().mockResolvedValue(saved) } as unknown as VenueContentRepository;
  const config = { get: jest.fn().mockReturnValue('') } as unknown as ConfigService;
  const service = new VenueContentService(repo, config);

  const updateArg = () => (repo.upsert as jest.Mock).mock.calls[0][2];
  const createArg = () => (repo.upsert as jest.Mock).mock.calls[0][1];

  afterEach(() => jest.clearAllMocks());

  it('edit tanpa imageMediaId tidak menyentuh foto utama', async () => {
    await service.upsert({ venueRef: '7', gallery: ['https://x/a.jpg'] });
    expect(updateArg().imageMedia).toBeUndefined();
  });

  it('imageMediaId null melepas foto utama', async () => {
    await service.upsert({ venueRef: '7', imageMediaId: null });
    expect(updateArg().imageMedia).toEqual({ disconnect: true });
  });

  it('imageMediaId baru mengganti foto utama', async () => {
    const id = '0b6a2c55-5c2f-4d1e-9f3a-2f6a1c9b7e10';
    await service.upsert({ venueRef: '7', imageMediaId: id });
    expect(updateArg().imageMedia).toEqual({ connect: { id } });
    expect(createArg().imageMedia).toEqual({ connect: { id } });
  });

  it('deskripsi boleh kosong: dibuat sebagai string kosong, edit tak menimpa', async () => {
    await service.upsert({ venueRef: '7' });
    expect(createArg().description).toBe('');
    expect(updateArg().description).toBeUndefined();
  });
});
