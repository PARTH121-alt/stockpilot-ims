import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
      roleSlug: string;
      roleName: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    orgId: string;
    roleSlug: string;
    roleName: string;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
    roleSlug: string;
    roleName: string;
    permissions: string[];
  }
}
