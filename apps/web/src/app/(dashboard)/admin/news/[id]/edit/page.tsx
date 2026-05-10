import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import NewsForm from '../../NewsForm';

export const metadata = { title: 'Editar noticia · Admin — Kodexa Hotel' };

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) notFound();

  const article = await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id:         true,
      title:      true,
      slug:       true,
      excerpt:    true,
      content:    true,
      imageUrl:   true,
      status:     true,
      publishedAt: true,
    },
  });

  if (!article) notFound();

  return (
    <NewsForm
      mode="edit"
      initial={{
        id:          article.id,
        title:       article.title,
        slug:        article.slug ?? '',
        excerpt:     article.excerpt,
        content:     article.content,
        imageUrl:    article.imageUrl,
        status:      article.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        publishedAt: article.publishedAt?.toISOString() ?? null,
      }}
    />
  );
}
