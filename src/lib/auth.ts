import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Gamer Tag', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username.trim() },
              { email: credentials.username.trim().toLowerCase() },
              { phone: credentials.username.trim() }
            ]
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check approval status BEFORE verifying password to avoid timing attacks
        // that could leak whether a PENDING user's password is correct.
        if (user.status === 'PENDING') {
          // Encode the error type as a query param recognised by the modal
          throw new Error('PENDING');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.fullName || user.username,
          email: user.email,
          image: user.image,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, attach the user id to the token
      if (user) {
        token.userId = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: {
            id: true,
            username: true,
            rank: true,
            sessionsCount: true,
            playtimeHours: true,
            fullName: true,
            image: true,
            role: true,
          },
        });

        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).username = dbUser.username;
          (session.user as any).rank = dbUser.rank;
          (session.user as any).sessionsCount = dbUser.sessionsCount;
          (session.user as any).playtimeHours = dbUser.playtimeHours;
          (session.user as any).role = dbUser.role;
        }
      }
      return session;
    },
  },
  pages: {
    // Keep NextAuth's own redirect pointing somewhere useful.
    // The actual login UI is in the AuthModal, not a standalone page.
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
