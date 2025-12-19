import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class TranslationsService {
  private localesPath = path.join(process.cwd(), "src", "i18n", "locales");
  // Note: specific path might need adjustment based on dist/ vs src/ in production.
  // Ideally use ConfigService or known relative path to dist.

  getLocales(): string[] {
    // Logic to find available locales
    // For now, return hardcoded list or scan directories
    return ["en", "ru"];
  }

  async getTranslation(
    lang: string,
    namespace: string = "common",
  ): Promise<Record<string, unknown>> {
    // We need to verify the path exists.
    // It's safer to configure this path correctly.
    const filePath = path.join(this.localesPath, lang, `${namespace}.json`);

    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(content) as Record<string, unknown>;
    }
    return {};
  }

  async saveTranslation(
    lang: string,
    namespace: string,
    content: Record<string, unknown>,
  ): Promise<{ success: boolean }> {
    const dirPath = path.join(this.localesPath, lang);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${namespace}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(content, null, 2));
    return { success: true };
  }
}
