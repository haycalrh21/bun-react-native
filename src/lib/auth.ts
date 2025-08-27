import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { BetterAuthPlugin, customSession } from "better-auth/plugins";
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Allow requests from the frontend development server and mobile apps
  trustedOrigins: ["http://localhost:3000"].concat(
    process.env.EXPO_PUBLIC_API_URL ? [process.env.EXPO_PUBLIC_API_URL] : []
  ),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // ctx.db biasanya tersedia di hook (Better-auth passing Prisma client)
          const userCount = await prisma.user.count();

          if (userCount === 0) {
            // User pertama -> ADMIN
            return { data: { ...user, role: "ADMIN" } };
          }

          // Kalau bukan user pertama dan role tidak di-set, default USER
          if (!user.role) {
            return { data: { ...user, role: "USER" } };
          }

          // Kalau role sudah ada, pakai yang diberikan
          return { data: user };
        },
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      // Pastikan user role diambil dari database yang terbaru
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      return {
        session: {
          expiresAt: session.expiresAt,
          token: session.token,
          userAgent: session.userAgent,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          role: (dbUser?.role as "ADMIN" | "GURU" | "SISWA") || "SISWA",
          giraffeFact: "giraffes can sometimes nap with one eye open",
        },
      };
    }),
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
