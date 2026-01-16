import { Test, TestingModule } from "@nestjs/testing";
import { BackupsService } from "./backups.service";
import { ConfigService } from "@nestjs/config";
import * as child_process from "child_process";
import * as fs from "fs";
import { EventEmitter } from "events";
import { Stream } from "stream";

// Helper to create a mock child process
const createMockChildProcess = (exitCode = 0, stdout = "", stderr = "") => {
  const child: any = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = new Stream.Writable({
    write: (chunk, encoding, callback) => {
      callback();
    },
  });

  // Make stdout pipe-able
  child.stdout.pipe = jest.fn();

  setTimeout(() => {
    if (stdout) child.stdout.emit("data", stdout);
    if (stderr) child.stderr.emit("data", stderr);
    child.emit("close", exitCode);
  }, 10);

  return child;
};

describe("BackupsService", () => {
  let service: BackupsService;
  let spawnSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock fs.existsSync and mkdirSync to prevent directory creation
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    jest.spyOn(fs.promises, "readdir").mockResolvedValue([]);
    jest.spyOn(fs.promises, "stat").mockResolvedValue({
      size: 100,
      birthtime: new Date(),
      mtime: new Date(),
    } as any);

    // Mock spawn
    spawnSpy = jest.spyOn(child_process, "spawn").mockImplementation(() => {
        return createMockChildProcess(0, "mock version");
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue("postgresql://user:pass@localhost:5432/db"),
          },
        },
      ],
    }).compile();

    service = module.get<BackupsService>(BackupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should detect pg_dump in local mode", async () => {
      // Mock pg_dump --version returning success
      spawnSpy.mockImplementationOnce(() => createMockChildProcess(0, "pg_dump (PostgreSQL) 14.1"));

      const result = await (service as any).detectPgDump();
      expect(result).toEqual({ mode: "local", versionOrError: "pg_dump (PostgreSQL) 14.1" });
      expect(spawnSpy).toHaveBeenCalledWith("pg_dump", ["--version"], expect.any(Object));
  });

  it("should fail gracefully if pg_dump is missing and docker fails", async () => {
      // Mock pg_dump failing
      spawnSpy.mockImplementationOnce(() => createMockChildProcess(1, "", "Command failed"));
      // Mock docker --version failing
      spawnSpy.mockImplementationOnce(() => createMockChildProcess(1, "", "Docker not found"));

      const result = await (service as any).detectPgDump();
      expect(result.mode).toBe("none");
  });

  it("should use spawn for createBackup in local mode", async () => {
    // 1. detectPgDump -> success local
    spawnSpy.mockImplementationOnce(() => createMockChildProcess(0, "pg_dump (PostgreSQL) 14.1"));

    // 2. run pg_dump -> success
    spawnSpy.mockImplementationOnce(() => createMockChildProcess(0, ""));

    // Mock fs.createWriteStream
    const mockStream = new EventEmitter();
    (mockStream as any).path = "backup.sql";
    jest.spyOn(fs, "createWriteStream").mockReturnValue(mockStream as any);

    await service.createBackup();

    // Verify spawn was called with correct arguments for local dump
    // Call 0: detectPgDump
    // Call 1: pg_dump "dbUrl"
    expect(spawnSpy).toHaveBeenNthCalledWith(2, "pg_dump", ["postgresql://user:pass@localhost:5432/db"], expect.any(Object));
  });

  it("should use spawn for createBackup in docker mode", async () => {
     // 1. detectPgDump -> fail local
     spawnSpy.mockImplementationOnce(() => createMockChildProcess(1));

     // 2. detectDockerExec -> docker --version -> success
     spawnSpy.mockImplementationOnce(() => createMockChildProcess(0, "Docker version 20.10.7"));

     // 3. detectDockerExec -> docker inspect -> success
     spawnSpy.mockImplementationOnce(() => createMockChildProcess(0, "[]"));

     // 4. detectPgDump -> docker exec ... pg_dump --version -> success
     spawnSpy.mockImplementationOnce(() => createMockChildProcess(0, "pg_dump (PostgreSQL) 14.1"));

     // 5. run docker exec ... pg_dump
     spawnSpy.mockImplementationOnce(() => createMockChildProcess(0));

     // Mock fs.createWriteStream
    const mockStream = new EventEmitter();
    (mockStream as any).path = "backup.sql";
    jest.spyOn(fs, "createWriteStream").mockReturnValue(mockStream as any);

     await service.createBackup();

     // Verify spawn was called with correct arguments for docker dump
     const expectedArgs = [
         "exec",
         "-e",
         "PGPASSWORD=pass",
         "dating_app_db", // Default container name
         "pg_dump",
         "-U",
         "user",
         "-d",
         "db"
     ];
     expect(spawnSpy).toHaveBeenLastCalledWith("docker", expectedArgs, expect.any(Object));
  });
});
