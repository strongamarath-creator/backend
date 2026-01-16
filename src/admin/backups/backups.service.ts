import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

function truncateOutput(value: string, maxLen: number) {
  if (!value) return value;
  return value.length > maxLen
    ? value.slice(0, maxLen) + "\n...<truncated>"
    : value;
}

@Injectable()
export class BackupsService {
  private backupPath: string;

  constructor(private configService: ConfigService) {
    this.backupPath = path.join(process.cwd(), "backups");
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath);
    }
  }

  /**
   * Safe wrapper for child_process.spawn.
   * Handles stdout/stderr collection and error handling.
   */
  private async runSpawn(
    command: string,
    args: string[],
    options: {
      env?: NodeJS.ProcessEnv;
      input?: fs.ReadStream | string;
      output?: fs.WriteStream;
      maxBuffer?: number; // Ignored for streams, but useful if collecting stdout
    } = {},
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      // Merge current process env with provided env
      const child = spawn(command, args, {
        env: { ...process.env, ...(options.env || {}) },
        stdio: ["pipe", "pipe", "pipe"], // We manually pipe below
      });

      let stdout = "";
      let stderr = "";

      // Handle Input (stdin)
      if (options.input) {
        if (typeof options.input === "string") {
          child.stdin.write(options.input);
          child.stdin.end();
        } else {
          options.input.pipe(child.stdin);
        }
      }

      // Handle Output (stdout)
      if (options.output) {
        child.stdout.pipe(options.output);
      } else {
        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });
      }

      // Handle Errors (stderr)
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          const msg =
            stderr.trim() || `Command failed with exit code ${code}`;
          reject(new Error(msg));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupPath, filename);

    const dbUrl = this.configService.get<string>("DATABASE_URL");

    if (!dbUrl) {
      throw new InternalServerErrorException("DATABASE_URL is not defined");
    }

    const { user, password, database } = this.getDbParams(dbUrl);
    const { mode, versionOrError } = await this.detectPgDump();
    if (mode === "none") {
      throw new InternalServerErrorException(
        "pg_dump is not available in backend environment and docker fallback is not available: " +
          versionOrError,
      );
    }

    const fileStream = fs.createWriteStream(filepath);

    try {
      if (mode === "local") {
        // Safe: passing dbUrl as argument, not shell string
        await this.runSpawn("pg_dump", [dbUrl], { output: fileStream });

        return {
          message: "Backup created successfully",
          filename,
          mode,
          pgDumpVersion: versionOrError,
        };
      }

      // docker mode
      const containerName = this.getDbContainerName();
      // Safe: Using spawn array arguments. No shell escaping needed.
      await this.runSpawn(
        "docker",
        [
          "exec",
          "-e",
          `PGPASSWORD=${password}`,
          containerName,
          "pg_dump",
          "-U",
          user,
          "-d",
          database,
        ],
        { output: fileStream },
      );

      return {
        message: "Backup created successfully",
        filename,
        mode,
        pgDumpVersion: versionOrError,
        containerName,
      };
    } catch (error) {
      console.error("Backup failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      // Clean up empty/partial file on error
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new InternalServerErrorException(
        "Failed to create backup: " + errorMessage,
      );
    }
  }

  async listBackups() {
    const files = await fs.promises.readdir(this.backupPath);
    return files
      .filter((f) => f.endsWith(".sql"))
      .map((f) => {
        const stats = fs.statSync(path.join(this.backupPath, f));
        return { filename: f, size: stats.size, createdAt: stats.birthtime };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteBackup(filename: string) {
    const filepath = this.getBackupPath(filename);

    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      return { message: "Backup deleted" };
    }
    throw new InternalServerErrorException("File not found");
  }

  async restoreBackup(filename: string) {
    const filepath = this.getBackupPath(filename);

    const dbUrl = this.configService.get<string>("DATABASE_URL");
    if (!dbUrl) {
      throw new InternalServerErrorException("DATABASE_URL is not defined");
    }

    const { user, password, database } = this.getDbParams(dbUrl);
    const { mode, versionOrError } = await this.detectPsql();
    if (mode === "none") {
      throw new InternalServerErrorException(
        "psql is not available in backend environment and docker fallback is not available: " +
          versionOrError,
      );
    }

    try {
      // Drop and recreate public schema to avoid conflicts when restoring plain SQL dumps.
      const preSql =
        "DROP SCHEMA IF EXISTS public CASCADE; " +
        "CREATE SCHEMA public; " +
        "GRANT ALL ON SCHEMA public TO postgres; " +
        "GRANT ALL ON SCHEMA public TO public;";

      let pre: { stdout: string; stderr: string } = { stdout: "", stderr: "" };
      let restore: { stdout: string; stderr: string } = {
        stdout: "",
        stderr: "",
      };

      if (mode === "local") {
        pre = await this.runSpawn("psql", [
          dbUrl,
          "--set",
          "ON_ERROR_STOP=on",
          "--command",
          preSql,
        ]);

        restore = await this.runSpawn("psql", [
          dbUrl,
          "--set",
          "ON_ERROR_STOP=on",
          "--file",
          filepath,
        ]);
      } else {
        const containerName = this.getDbContainerName();

        // 1. Run Pre-SQL
        pre = await this.runSpawn("docker", [
          "exec",
          "-e",
          `PGPASSWORD=${password}`,
          containerName,
          "psql",
          "-U",
          user,
          "-d",
          database,
          "--set",
          "ON_ERROR_STOP=on",
          "--command",
          preSql,
        ]);

        // 2. Restore from file (streaming file content to docker -> psql stdin)
        const fileStream = fs.createReadStream(filepath);
        restore = await this.runSpawn(
          "docker",
          [
            "exec",
            "-i", // Interactive mode needed for stdin piping
            "-e",
            `PGPASSWORD=${password}`,
            containerName,
            "psql",
            "-U",
            user,
            "-d",
            database,
            "--set",
            "ON_ERROR_STOP=on",
          ],
          { input: fileStream },
        );
      }

      return {
        message: "Database restored successfully",
        filename,
        mode,
        psqlVersion: versionOrError,
        preflight: {
          stdout: truncateOutput(pre.stdout ?? "", 20_000),
          stderr: truncateOutput(pre.stderr ?? "", 20_000),
        },
        restore: {
          stdout: truncateOutput(restore.stdout ?? "", 20_000),
          stderr: truncateOutput(restore.stderr ?? "", 20_000),
        },
      };
    } catch (error) {
      console.error("Restore failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(
        "Failed to restore backup: " + errorMessage,
      );
    }
  }

  async restorePreflight(filename: string) {
    const filepath = this.getBackupPath(filename);

    const dbUrl = this.configService.get<string>("DATABASE_URL");
    if (!dbUrl) {
      throw new InternalServerErrorException("DATABASE_URL is not defined");
    }

    const { user, password, database } = this.getDbParams(dbUrl);

    const stats = await fs.promises.stat(filepath);

    // 1) Check psql availability (local or docker fallback)
    const psqlDetected = await this.detectPsql();
    if (psqlDetected.mode === "none") {
      throw new InternalServerErrorException(
        "psql is not available in backend environment and docker fallback is not available: " +
          psqlDetected.versionOrError,
      );
    }

    // 2) Check DB connectivity (read-only)
    let dbCheck = { ok: false, stdout: "", stderr: "" };
    try {
      let res;
      if (psqlDetected.mode === "local") {
        res = await this.runSpawn("psql", [
          dbUrl,
          "--set",
          "ON_ERROR_STOP=on",
          "--command",
          "SELECT 1 AS ok;",
        ]);
      } else {
        res = await this.runSpawn("docker", [
          "exec",
          "-e",
          `PGPASSWORD=${password}`,
          this.getDbContainerName(),
          "psql",
          "-U",
          user,
          "-d",
          database,
          "--set",
          "ON_ERROR_STOP=on",
          "--command",
          "SELECT 1 AS ok;",
        ]);
      }

      dbCheck = {
        ok: true,
        stdout: truncateOutput(res.stdout ?? "", 10_000),
        stderr: truncateOutput(res.stderr ?? "", 10_000),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      dbCheck = {
        ok: false,
        stdout: "",
        stderr: truncateOutput(String(msg), 10_000),
      };
    }

    // 3) Optional: show active connections count (best-effort)
    let connectionsInfo: {
      ok: boolean;
      stdout: string;
      stderr: string;
    } | null = null;
    try {
      let res;
      if (psqlDetected.mode === "local") {
        res = await this.runSpawn("psql", [
          dbUrl,
          "--set",
          "ON_ERROR_STOP=on",
          "--tuples-only",
          "--command",
          "SELECT COUNT(*)::int AS connections FROM pg_stat_activity;",
        ]);
      } else {
        res = await this.runSpawn("docker", [
          "exec",
          "-e",
          `PGPASSWORD=${password}`,
          this.getDbContainerName(),
          "psql",
          "-U",
          user,
          "-d",
          database,
          "--set",
          "ON_ERROR_STOP=on",
          "--tuples-only",
          "--command",
          "SELECT COUNT(*)::int AS connections FROM pg_stat_activity;",
        ]);
      }

      connectionsInfo = {
        ok: true,
        stdout: truncateOutput(res.stdout ?? "", 10_000).trim(),
        stderr: truncateOutput(res.stderr ?? "", 10_000).trim(),
      };
    } catch {
      connectionsInfo = null;
    }

    return {
      ok: true,
      timestamp: new Date().toISOString(),
      filename,
      file: {
        sizeBytes: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
      environment: {
        mode: psqlDetected.mode,
        psqlVersion: psqlDetected.versionOrError,
        containerName:
          psqlDetected.mode === "docker" ? this.getDbContainerName() : null,
      },
      database: {
        connectivity: dbCheck,
        connectionsInfo,
      },
      warnings: [
        "Восстановление удалит текущие данные в схеме public (DROP SCHEMA public CASCADE).",
        "Лучше выполнять восстановление при минимальной нагрузке и наличии свежего бэкапа текущего состояния.",
      ],
    };
  }

  getBackupPath(filename: string) {
    const safeFilename = path.basename(filename);
    const filepath = path.join(this.backupPath, safeFilename);

    if (!filepath.startsWith(this.backupPath)) {
      throw new Error("Invalid filename");
    }
    return filepath;
  }

  private getDbContainerName() {
    return process.env.DB_CONTAINER_NAME || "dating_app_db";
  }

  private getDbParams(dbUrl: string): {
    user: string;
    password: string;
    database: string;
  } {
    const envUser = process.env.DB_USER;
    const envPassword = process.env.DB_PASSWORD;
    const envName = process.env.DB_NAME;

    if (envUser && envPassword && envName) {
      return { user: envUser, password: envPassword, database: envName };
    }

    try {
      const u = new URL(dbUrl.replace(/^"|"$/g, ""));
      const user = decodeURIComponent(u.username || "postgres");
      const password = decodeURIComponent(u.password || "");
      const database = decodeURIComponent(
        (u.pathname || "/").replace(/^\//, ""),
      );
      return { user, password, database };
    } catch {
      return {
        user: envUser || "postgres",
        password: envPassword || "",
        database: envName || "postgres",
      };
    }
  }

  private async detectDockerExec(): Promise<{ ok: boolean; message: string }> {
    const containerName = this.getDbContainerName();
    try {
      await this.runSpawn("docker", ["--version"]);
      await this.runSpawn("docker", ["inspect", containerName]);
      return { ok: true, message: containerName };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, message: msg };
    }
  }

  private async detectPsql(): Promise<{
    mode: "local" | "docker" | "none";
    versionOrError: string;
  }> {
    try {
      const v = await this.runSpawn("psql", ["--version"]);
      return {
        mode: "local",
        versionOrError: (v.stdout || v.stderr || "").trim(),
      };
    } catch (e) {
      const docker = await this.detectDockerExec();
      if (!docker.ok) {
        const msg = e instanceof Error ? e.message : String(e);
        return { mode: "none", versionOrError: msg };
      }

      try {
        const v = await this.runSpawn("docker", [
          "exec",
          docker.message,
          "psql",
          "--version",
        ]);
        return {
          mode: "docker",
          versionOrError: (v.stdout || v.stderr || "").trim(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { mode: "none", versionOrError: msg };
      }
    }
  }

  private async detectPgDump(): Promise<{
    mode: "local" | "docker" | "none";
    versionOrError: string;
  }> {
    try {
      const v = await this.runSpawn("pg_dump", ["--version"]);
      return {
        mode: "local",
        versionOrError: (v.stdout || v.stderr || "").trim(),
      };
    } catch (e) {
      const docker = await this.detectDockerExec();
      if (!docker.ok) {
        const msg = e instanceof Error ? e.message : String(e);
        return { mode: "none", versionOrError: msg };
      }

      try {
        const v = await this.runSpawn("docker", [
          "exec",
          docker.message,
          "pg_dump",
          "--version",
        ]);
        return {
          mode: "docker",
          versionOrError: (v.stdout || v.stderr || "").trim(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { mode: "none", versionOrError: msg };
      }
    }
  }
}
