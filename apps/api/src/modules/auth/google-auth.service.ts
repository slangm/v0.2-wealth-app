import { Injectable, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId) {
      this.client = new OAuth2Client(clientId);
    } else {
      console.warn(
        "[auth] GOOGLE_CLIENT_ID not set; falling back to dev-only token passthrough."
      );
    }
  }

  async verifyIdToken(idToken: string): Promise<TokenPayload> {
    // Validate JWT format (should have 3 parts separated by dots)
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException(
        `Invalid token format. Expected JWT token but received: ${idToken.substring(0, 50)}${idToken.length > 50 ? "..." : ""}. ` +
          `Please ensure you're passing the idToken from Google Sign-In, not the client ID.`
      );
    }

    // Check if this is a dev/test token (contains "dev", "dummy", "test", or "mock")
    const isDevToken =
      idToken.toLowerCase().includes("dev") ||
      idToken.toLowerCase().includes("dummy") ||
      idToken.toLowerCase().includes("test") ||
      idToken.toLowerCase().includes("mock");

    // For local dev, allow passthrough if no client configured or if it's a dev token
    const isDevMode =
      process.env.NODE_ENV !== "production" || process.env.DEV_MODE === "true";

    if (!this.client || (isDevMode && isDevToken)) {
      return {
        sub: `dev-${idToken.substring(0, 20)}`,
        email: `dev-${idToken.substring(0, 20)}@example.dev`,
        email_verified: true,
        name: "Dev User",
        iss: "local-dev",
        aud: "local-dev",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      };
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload?.email) {
        throw new UnauthorizedException("Invalid Google token payload");
      }
      return payload;
    } catch (error) {
      // Provide more helpful error message
      if (
        error instanceof Error &&
        error.message.includes("Wrong number of segments")
      ) {
        throw new UnauthorizedException(
          `Invalid token format. The provided token appears to be a client ID or invalid JWT. ` +
            `Please ensure you're passing the idToken from Google Sign-In response.`
        );
      }
      // Handle "No pem found" error (invalid token signature or algorithm)
      if (
        error instanceof Error &&
        (error.message.includes("No pem found") ||
          error.message.includes("Invalid token signature"))
      ) {
        // In dev mode, allow fallback to dev user
        if (isDevMode) {
          return {
            sub: `dev-${idToken.substring(0, 20)}`,
            email: `dev-${idToken.substring(0, 20)}@example.dev`,
            email_verified: true,
            name: "Dev User",
            iss: "local-dev",
            aud: "local-dev",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
          };
        }
        throw new UnauthorizedException(
          `Invalid Google token. The token signature could not be verified. ` +
            `Please ensure you're using a valid idToken from Google Sign-In.`
        );
      }
      throw error;
    }
  }
}
