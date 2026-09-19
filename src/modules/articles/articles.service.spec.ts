/**
 * src/modules/articles/articles.service.spec.ts
 * Uji workflow ArticlesService: submit, publish, dan cek kepemilikan (AuthZ).
 */
import { ArticleStatus, UserRole } from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CategoriesService } from '../categories/categories.service';
import { ArticlesRepository } from './articles.repository';
import { ArticlesService } from './articles.service';
import { ArticleWithRelations } from './entities/article.entity';

/** Bentuk artikel + relasi minimal agar mapper tidak error. */
function makeArticle(
  over: Partial<ArticleWithRelations> = {},
): ArticleWithRelations {
  return {
    id: 'a1',
    slug: 'judul',
    title: 'Judul',
    excerpt: null,
    body: {},
    status: ArticleStatus.DRAFT,
    authorId: 'u1',
    categoryId: null,
    featuredMediaId: null,
    seoTitle: null,
    seoDescription: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 'u1', name: 'Penulis' },
    category: null,
    tags: [],
    featuredMedia: null,
    ...over,
  } as ArticleWithRelations;
}

describe('ArticlesService', () => {
  const repo = {
    findById: jest.fn(),
    update: jest.fn(),
    publishWithRevision: jest.fn(),
    findOwners: jest.fn(),
    deleteMany: jest.fn(),
  } as unknown as ArticlesRepository;
  const categories = {
    getDefaultId: jest.fn().mockResolvedValue('default-cat'),
  } as unknown as CategoriesService;
  const service = new ArticlesService(repo, categories);

  const author: AuthenticatedUser = {
    id: 'u1',
    email: 'a@b.c',
    role: UserRole.AUTHOR,
  };
  const editor: AuthenticatedUser = {
    id: 'e1',
    email: 'e@b.c',
    role: UserRole.EDITOR,
  };

  afterEach(() => jest.clearAllMocks());

  it('submit: DRAFT milik sendiri menjadi IN_REVIEW', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(makeArticle());
    (repo.update as jest.Mock).mockResolvedValue(
      makeArticle({ status: ArticleStatus.IN_REVIEW }),
    );
    const result = await service.submit('a1', author);
    expect(result.status).toBe(ArticleStatus.IN_REVIEW);
    expect(repo.update).toHaveBeenCalledWith('a1', {
      status: ArticleStatus.IN_REVIEW,
    });
  });

  it('submit: artikel non-DRAFT ditolak (Conflict)', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(
      makeArticle({ status: ArticleStatus.PUBLISHED }),
    );
    await expect(service.submit('a1', author)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('update: bukan pemilik & bukan editor ditolak (Forbidden)', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(
      makeArticle({ authorId: 'someone-else' }),
    );
    await expect(
      service.update('a1', { title: 'x' }, author),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('publish: editor mempublikasikan -> status PUBLISHED', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(makeArticle());
    (repo.publishWithRevision as jest.Mock).mockResolvedValue(
      makeArticle({
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
      }),
    );
    const result = await service.publish('a1', {}, editor);
    expect(result.status).toBe(ArticleStatus.PUBLISHED);
    expect(repo.publishWithRevision).toHaveBeenCalledTimes(1);
  });

  it('removeMany: editor menghapus artikel siapa pun (id ganda digabung)', async () => {
    (repo.findOwners as jest.Mock).mockResolvedValue([
      { id: 'a1', authorId: 'u1' },
      { id: 'a2', authorId: 'someone-else' },
    ]);
    (repo.deleteMany as jest.Mock).mockResolvedValue(2);
    await expect(service.removeMany(['a1', 'a2', 'a1'], editor)).resolves.toEqual({ deleted: 2 });
    expect(repo.deleteMany).toHaveBeenCalledWith(['a1', 'a2']);
  });

  it('removeMany: penulis hanya boleh miliknya; campuran ditolak utuh', async () => {
    (repo.findOwners as jest.Mock).mockResolvedValue([
      { id: 'a1', authorId: 'u1' },
      { id: 'a2', authorId: 'someone-else' },
    ]);
    await expect(service.removeMany(['a1', 'a2'], author)).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.deleteMany).not.toHaveBeenCalled();
  });

  it('removeMany: id yang tidak ada -> NotFound, tak ada yang terhapus', async () => {
    (repo.findOwners as jest.Mock).mockResolvedValue([{ id: 'a1', authorId: 'u1' }]);
    await expect(service.removeMany(['a1', 'hilang'], editor)).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.deleteMany).not.toHaveBeenCalled();
  });
});
