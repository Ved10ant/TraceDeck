import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@tracedeck/database";
import { env } from "../../config/env";
import { RegisterInput, LoginInput } from "./auth.schemas";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export class AuthService {
  private db: typeof prisma;

  constructor(customPrisma?: typeof prisma) {
    this.db = customPrisma || prisma;
  }

  generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  }

  async register(input: RegisterInput) {
    const existing = await this.db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      const error: any = new Error("An account with this email already exists");
      error.statusCode = 409;
      error.code = "EMAIL_ALREADY_EXISTS";
      throw error;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const slugBase = input.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

    // Create user, default workspace organization, and membership in transaction
    const result = await this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: `${input.name}'s Workspace`,
          slug: uniqueSlug,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });

      return { user, organization, membership };
    });

    const token = this.generateToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: result.membership.role,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        createdAt: result.user.createdAt,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
        role: result.membership.role,
      },
      token,
    };
  }

  async login(input: LoginInput) {
    const user = await this.db.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    const primaryMembership = user.memberships[0];
    const organization = primaryMembership?.organization;

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      organizationId: organization ? organization.id : "",
      role: primaryMembership ? primaryMembership.role : "OWNER",
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            role: primaryMembership.role,
          }
        : null,
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return user;
  }
}

export const authService = new AuthService();
