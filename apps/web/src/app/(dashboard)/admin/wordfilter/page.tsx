import { prisma } from '@/lib/db';
import WordfilterClient from './WordfilterClient';

export const metadata = { title: 'Wordfilter · Admin Kodexa' };

export default async function AdminWordfilterPage() {
  const words = await prisma.wordfilter.findMany({ orderBy: { word: 'asc' } });
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Filtro de Palabras</h1>
        <p className="text-sm text-[#94A3B8] mt-1">{words.length} palabras en el filtro</p>
      </div>
      <WordfilterClient initialWords={words.map(w => ({ id: w.id, word: w.word, replacement: w.replacement, type: w.type }))} />
    </div>
  );
}
