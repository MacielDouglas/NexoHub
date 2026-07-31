import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { prisma } from "@/lib/prisma";

const statement = {
  ...defaultStatements,
} as const;

const ac = createAccessControl(statement);

const owner = ac.newRole({
  ...ownerAc.statements,
});

const admin = ac.newRole({
  ...adminAc.statements,
});

const member = ac.newRole({
  member: [],
  invitation: [],
  organization: [],
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `http://localhost:3000/accept-invitation/${data.id}`;
        console.log(
          `[Email] Convite enviado para ${data.email}: ${inviteLink}`,
        );
      },
      allowUserToCreateOrganization: async (user) => {
        if (user.globalRole === "super_user") return true;
        if (user.globalRole !== "owner") return false;

        const memberCount = await prisma.member.count({
          where: { userId: user.id },
        });

        if (memberCount > 0) return false;

        return true;
      },
      organizationHooks: {
        beforeUpdateMemberRole: async ({ member, newRole }) => {
          const isPromotingToOwner = newRole.includes("owner");
          if (isPromotingToOwner) {
            const existingOrg = await prisma.member.findFirst({
              where: {
                userId: member.userId,
                role: { contains: "owner" },
              },
            });
            if (existingOrg) {
              throw new APIError("BAD_REQUEST", {
                message: "Usuário já pertence a uma congregação como owner",
              });
            }
          }
        },
      },
    }),
    nextCookies(),
    expo(),
  ],
  trustedOrigins: [
    "nexohub://",
    "com.googleusercontent.apps.795969729961-lh7l31kqvvdkt0miag5i4d14vb7mulu9://",
    ...(process.env.NODE_ENV === "development"
      ? [
          "exp://",
          "exp://**",
          "exp://192.168.*.*:*/**",
          "http://localhost:8081",
        ]
      : []),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const superUserCount = await prisma.user.count({
            where: { globalRole: "super_user" },
          });
          if (superUserCount === 0) {
            return {
              data: {
                ...user,
                globalRole: "super_user",
              },
            };
          }
          return { data: user };
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
      },
      globalRole: {
        type: "string",
        required: true,
        defaultValue: "member",
        input: false,
      },
      language: {
        type: "string",
        required: false,
      },
    },
  },
});
