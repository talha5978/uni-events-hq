import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserPayload } from "../types";

class JWT {
	private static instance: JWT;
	private readonly JWT_SECRET: string;
	private readonly JWT_EXPIRES_IN: string;

	private constructor() {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error("JWT_SECRET environment variable is required");
		}

		this.JWT_SECRET = secret;
		this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
	}

	public static getInstance(): JWT {
		if (!JWT.instance) {
			JWT.instance = new JWT();
		}
		return JWT.instance;
	}

	generateToken(payload: UserPayload): string {
		const options: SignOptions = {
			expiresIn: this.JWT_EXPIRES_IN as any,
		};

		return jwt.sign(payload, this.JWT_SECRET, options);
	}

	verifyToken(token: string): UserPayload {
		try {
			return jwt.verify(token, this.JWT_SECRET) as UserPayload;
		} catch (error) {
			throw new Error("Invalid or expired token");
		}
	}

	generateRefreshToken(userId: string): string {
		const options: SignOptions = {
			expiresIn: "30d",
		};

		return jwt.sign({ id: userId }, this.JWT_SECRET, options);
	}

	verifyRefreshToken(token: string): { id: string } {
		try {
			return jwt.verify(token, this.JWT_SECRET) as { id: string };
		} catch (error) {
			throw new Error("Invalid or expired refresh token");
		}
	}
}

export const jwtService = JWT.getInstance();
