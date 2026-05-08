import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

/* ─── Session type augmentation ─── */
declare module 'next-auth' {
  interface Session {
    user: {
      id:       string;
      username: string;
      rank:     number;
      credits:  number;
      look:     string;
    } & DefaultSession['user'];
  }
  interface User {
    username: string;
    rank:     number;
    credits:  number;
    look:     string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password:   {},
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: String(credentials.identifier) },
              { email:    String(credentials.identifier) },
            ],
          },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;

        return {
          id:       String(user.id),
          name:     user.username,
          email:    user.email,
          username: user.username,
          rank:     user.rank,
          credits:  user.credits,
          look:     user.look,
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { username: string; rank: number; credits: number; look: string };
        token['username'] = u.username;
        token['rank']     = u.rank;
        token['credits']  = u.credits;
        token['look']     = u.look;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id       = token.sub!;
      session.user.username = String(token['username'] ?? '');
      session.user.rank     = Number(token['rank']     ?? 1);
      session.user.credits  = Number(token['credits']  ?? 0);
      session.user.look     = String(token['look']     ?? '');
      return session;
    },
  },

  pages: { signIn: '/login' },
});
