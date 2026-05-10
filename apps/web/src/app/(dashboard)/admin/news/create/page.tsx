import NewsForm from '../NewsForm';

export const metadata = { title: 'Nueva noticia · Admin — Kodexa Hotel' };

export default function CreateNewsPage() {
  return <NewsForm mode="create" />;
}
