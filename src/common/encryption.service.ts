import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-cbc";
  private readonly key: Buffer;
  private readonly ivLength = 16;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in env");
    }
    // Create a 32-byte key from the secret using scrypt
    this.key = crypto.scryptSync(secret, "salt", 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  decrypt(text: string): string {
    const textParts = text.split(":");
    const ivPart = textParts.shift();
    if (!ivPart) throw new Error("Invalid encrypted text format");

    const iv = Buffer.from(ivPart, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
