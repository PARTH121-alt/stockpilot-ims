import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getRolePermissions } from "@/lib/permissions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true, organization: true },
        });

        if (!user || !user.isActive) return null;

        // Demo accounts: only allowed when DEMO_PASSWORD matches and user.isDemo
        const isDemoUser = user.isDemo;
        const demoPassword = process.env.DEMO_PASSWORD || "Demo@12345";

        let valid = false;
        if (isDemoUser && password === demoPassword) {
          valid = true;
        } else {
          valid = await bcrypt.compare(password, user.passwordHash);
        }

        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          orgId: user.orgId,
          roleId: user.roleId,
          roleSlug: user.role.slug,
          roleName: user.role.name,
          permissions: getRolePermissions(user.role.slug),
          branchAccess: [],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.orgId = user.orgId;
        token.roleSlug = user.roleSlug;
        token.roleName = user.roleName;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.orgId = token.orgId as string;
        session.user.roleSlug = token.roleSlug as string;
        session.user.roleName = token.roleName as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
});
