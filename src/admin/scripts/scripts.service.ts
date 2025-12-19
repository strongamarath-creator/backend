import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigType, Prisma } from "@prisma/client";
import { BackupsService } from "../backups/backups.service";
import { SystemService } from "../../system/system.service";

export type AdminScriptId =
  | "db-health"
  | "ensure-system-configs"
  | "create-db-backup"
  | "list-db-backups"
  | "cleanup-old-backups"
  | "restore-db-from-backup"
  | "seed-default-pages-if-missing"
  | "sync-default-pages-overwrite";

export type AdminScriptSafety = "safe" | "caution" | "danger";

export interface AdminScriptListItem {
  id: AdminScriptId;
  title: string;
  summary: string;
  safety: AdminScriptSafety;
}

export interface AdminScriptDetails extends AdminScriptListItem {
  documentation: string;
}

@Injectable()
export class ScriptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly backupsService: BackupsService,
    private readonly systemService: SystemService,
  ) {}

  list(): AdminScriptListItem[] {
    return [
      {
        id: "db-health",
        title: "Проверка состояния БД (Health Check)",
        summary:
          "Проверяет подключение к БД и показывает сводку по ключевым таблицам (пользователи, лайки, матчи, сообщения).",
        safety: "safe",
      },
      {
        id: "ensure-system-configs",
        title: "Инициализация системных настроек (без перезаписи)",
        summary:
          "Создаёт отсутствующие SystemConfig ключи (maintenance_mode, enable_calls, PHOTO_ACCESS_MODE) без изменения уже существующих значений.",
        safety: "caution",
      },
      {
        id: "create-db-backup",
        title: "Создать резервную копию БД (pg_dump)",
        summary:
          "Создаёт SQL-дамп PostgreSQL в папке backups/ на сервере (не изменяет данные в БД).",
        safety: "safe",
      },
      {
        id: "list-db-backups",
        title: "Показать список резервных копий",
        summary:
          "Возвращает список файлов .sql в папке backups/ с датами и размером.",
        safety: "safe",
      },
      {
        id: "cleanup-old-backups",
        title: "Очистка старых резервных копий (оставить последние 20)",
        summary:
          "Удаляет старые backup-*.sql и оставляет последние 20 (по дате создания).",
        safety: "caution",
      },
      {
        id: "restore-db-from-backup",
        title: "Восстановить БД из резервной копии (ОПАСНО)",
        summary:
          "Полностью заменяет текущую БД содержимым выбранного backup-*.sql. Перед восстановлением удаляет схему public и пересоздаёт её.",
        safety: "danger",
      },
      {
        id: "seed-default-pages-if-missing",
        title: "Создать дефолтные страницы (только отсутствующие)",
        summary:
          "Создаёт стандартные страницы (/terms, /privacy, /safety, /support) только если их нет. Ничего не перезаписывает.",
        safety: "safe",
      },
      {
        id: "sync-default-pages-overwrite",
        title: "Принудительно обновить дефолтные страницы (с перезаписью)",
        summary:
          "Перезаписывает title/description/content стандартных страниц значениями по умолчанию. Использовать только осознанно.",
        safety: "caution",
      },
    ];
  }

  get(id: string): AdminScriptDetails {
    const item = this.list().find((s) => s.id === id);
    if (!item) throw new NotFoundException("Script not found");

    switch (item.id) {
      case "db-health":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Проверяет доступность PostgreSQL через Prisma.",
            "- Считает количество записей в таблицах: User, Swipe, Match, Message, Report, Payment.",
            "- Возвращает дату последнего пользователя/лайка/матча/сообщения (если есть).",
            "",
            "Когда запускать:",
            "- После перезапуска контейнеров, если кажется, что данные «пропали».",
            "- После миграций или обновления окружения, чтобы убедиться, что сервис видит БД.",
            "",
            "Побочные эффекты:",
            "- Нет. Скрипт ничего не изменяет.",
            "",
            "Ожидаемый результат:",
            "- JSON-сводка со статусом и счётчиками.",
          ].join("\n"),
        };

      case "ensure-system-configs":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Проверяет наличие обязательных ключей SystemConfig.",
            "- Если ключ отсутствует — создаёт его со значением по умолчанию.",
            "- Если ключ уже есть — НЕ изменяет его (без перезаписи).",
            "",
            "Ключи и значения по умолчанию:",
            "- maintenance_mode: false (boolean)",
            "- enable_calls: true (boolean)",
            "- PHOTO_ACCESS_MODE: RESTRICTED (string)",
            "",
            "Когда запускать:",
            "- После чистой установки/развёртывания.",
            "- Если часть функционала зависит от SystemConfig, а ключей нет.",
            "",
            "Побочные эффекты:",
            "- Добавляет недостающие записи SystemConfig.",
            "- Не затрагивает пользователей/лайки/матчи/сообщения.",
            "",
            "Откат:",
            "- Удалить созданные ключи можно вручную или напрямую в БД.",
          ].join("\n"),
        };

      case "create-db-backup":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Выполняет pg_dump по DATABASE_URL и сохраняет дамп в backups/ (файл вида backup-YYYY-MM-DD....sql).",
            "",
            "Когда запускать:",
            "- Перед обновлениями, миграциями, экспериментами.",
            "- По расписанию (вручную) как простой бэкап.",
            "",
            "Побочные эффекты:",
            "- Создаёт новый файл в backups/ на сервере.",
            "- Данные в БД НЕ меняются.",
            "",
            "Требования окружения:",
            "- На сервере должен быть доступен pg_dump (обычно в образе/окружении).",
          ].join("\n"),
        };

      case "list-db-backups":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Показывает список резервных копий backups/*.sql.",
            "- Возвращает имя файла, размер и дату создания.",
            "",
            "Побочные эффекты:",
            "- Нет (только чтение файлов).",
          ].join("\n"),
        };

      case "cleanup-old-backups":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Сортирует backup-*.sql по дате создания (новые выше).",
            "- Оставляет последние 20 файлов, остальные удаляет.",
            "",
            "Когда запускать:",
            "- Когда на сервере заканчивается место или бэкапов слишком много.",
            "",
            "Побочные эффекты:",
            "- Удаляет старые файлы .sql (без изменения данных в БД).",
            "",
            "Откат:",
            "- Невозможен без внешнего хранения. Удалённые файлы не восстановить.",
          ].join("\n"),
        };

      case "restore-db-from-backup":
        return {
          ...item,
          documentation: [
            "ВНИМАНИЕ: это разрушительная операция.",
            "Скрипт удаляет текущие данные в схеме public и загружает данные из выбранного .sql бэкапа.",
            "",
            "Как работает на сервере:",
            "1) Выполняет SQL:",
            "   - DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ...",
            "2) Выполняет восстановление:",
            '   - psql "DATABASE_URL" --set ON_ERROR_STOP=on --file backups/<filename>.sql',
            "",
            "Рекомендуемый порядок действий (в админке):",
            "Шаг 1. (Рекомендуется) Создайте бэкап текущего состояния: Скрипт «Создать резервную копию БД».",
            "Шаг 2. Выберите файл резервной копии для восстановления.",
            "Шаг 3. Прочитайте предупреждения и поставьте чекбоксы подтверждения.",
            "Шаг 4. Введите подтверждающую фразу и запустите восстановление.",
            "",
            "Подтверждающая фраза:",
            "- Точно: ВОССТАНОВИТЬ: <filename>",
            "  Пример: ВОССТАНОВИТЬ: backup-2025-12-15T10-20-30-000Z.sql",
            "",
            "Типичные проблемы:",
            '- Если psql не установлен в окружении backend — восстановление не выполнится (ошибка "psql is not available").',
            "- Если в момент восстановления есть активный трафик — возможны ошибки блокировок. На время восстановления лучше остановить нагрузку.",
            "",
            "Откат:",
            "- Только восстановлением из ранее сделанного бэкапа.",
          ].join("\n"),
        };

      case "seed-default-pages-if-missing":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Создаёт стандартные страницы (/terms, /privacy, /safety, /support) только если страницы отсутствуют.",
            "- Не перезаписывает существующие страницы, даже если текст отличается.",
            "",
            "Когда запускать:",
            "- После чистой установки.",
            "- Если страницы были удалены и их нужно восстановить шаблоном.",
            "",
            "Побочные эффекты:",
            "- Может добавить новые записи PageConfig, если их не было.",
            "- Существующие записи не меняет.",
          ].join("\n"),
        };

      case "sync-default-pages-overwrite":
        return {
          ...item,
          documentation: [
            "Что делает:",
            "- Принудительно синхронизирует стандартные страницы с шаблоном по умолчанию.",
            "- Перезаписывает title/description/content для /terms, /privacy, /safety, /support.",
            "",
            "Когда запускать:",
            "- Только если нужно вернуть «эталонный» текст и вы осознанно готовы потерять текущие правки админа.",
            "",
            "Побочные эффекты:",
            "- Может затереть изменения, сделанные админом в контенте страниц.",
            "",
            "Откат:",
            "- Восстановить можно только из бэкапа (см. скрипт Создать резервную копию).",
          ].join("\n"),
        };

      default:
        throw new NotFoundException("Script not found");
    }
  }

  private safeJsonString(value: unknown, maxLen = 100_000) {
    if (value === undefined) return null;
    try {
      const s = JSON.stringify(value);
      if (s.length > maxLen) return s.slice(0, maxLen) + "...<truncated>";
      return s;
    } catch {
      return null;
    }
  }

  private extractActor(actor: unknown): {
    actorUserId: number | null;
    actorEmail: string | null;
  } {
    if (!actor || typeof actor !== "object") {
      return { actorUserId: null, actorEmail: null };
    }

    const obj = actor as Record<string, unknown>;
    const idCandidate = obj.userId ?? obj.id ?? obj.sub;
    const actorUserId = typeof idCandidate === "number" ? idCandidate : null;
    const actorEmail = typeof obj.email === "string" ? obj.email : null;
    return { actorUserId, actorEmail };
  }

  async listRuns(query: unknown) {
    const q =
      query && typeof query === "object"
        ? (query as Record<string, unknown>)
        : {};

    const scriptId = typeof q.scriptId === "string" ? q.scriptId : undefined;
    const kind = typeof q.kind === "string" ? q.kind : undefined;
    const status = typeof q.status === "string" ? q.status : undefined;
    const takeRaw = typeof q.take === "string" ? Number(q.take) : undefined;
    const skipRaw = typeof q.skip === "string" ? Number(q.skip) : undefined;
    const fromRaw = typeof q.from === "string" ? new Date(q.from) : undefined;
    const toRaw = typeof q.to === "string" ? new Date(q.to) : undefined;

    const take = Math.min(
      Math.max(Number.isFinite(takeRaw ?? 50) ? takeRaw : 50, 1),
      200,
    );
    const skip = Math.max(Number.isFinite(skipRaw ?? 0) ? skipRaw : 0, 0);

    const where: Prisma.AdminScriptRunWhereInput = {};
    if (scriptId) where.scriptId = scriptId;
    if (kind) where.kind = kind;
    if (status) where.status = status;
    const startedAtFilter: Prisma.DateTimeFilter = {};
    if (fromRaw && !Number.isNaN(fromRaw.getTime())) {
      startedAtFilter.gte = fromRaw;
    }
    if (toRaw && !Number.isNaN(toRaw.getTime())) {
      startedAtFilter.lte = toRaw;
    }
    if (startedAtFilter.gte || startedAtFilter.lte) {
      where.startedAt = startedAtFilter;
    }

    const [total, data] = await Promise.all([
      this.prisma.adminScriptRun.count({ where }),
      this.prisma.adminScriptRun.findMany({
        where,
        orderBy: { startedAt: "desc" },
        take,
        skip,
      }),
    ]);

    return { data, total, take, skip };
  }

  async getRun(runId: string) {
    const id = Number(runId);
    if (!Number.isFinite(id)) throw new BadRequestException("Invalid runId");

    const run = await this.prisma.adminScriptRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException("Run not found");
    return run;
  }

  async preflight(id: string, payload: unknown, actor?: unknown) {
    const details = this.get(id);

    const extracted = this.extractActor(actor);

    const startedAt = Date.now();
    const runRow = await this.prisma.adminScriptRun.create({
      data: {
        scriptId: details.id,
        safety: details.safety,
        kind: "PREFLIGHT",
        status: "RUNNING",
        payloadJson: this.safeJsonString(payload),
        actorUserId: extracted.actorUserId,
        actorEmail: extracted.actorEmail,
      },
    });

    try {
      let result: unknown;
      switch (details.id) {
        case "restore-db-from-backup":
          result = await this.preflightRestoreDbFromBackup(payload);
          break;
        default:
          throw new BadRequestException(
            "Preflight is not supported for this script",
          );
      }

      await this.prisma.adminScriptRun.update({
        where: { id: runRow.id },
        data: {
          status: "OK",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          resultJson: this.safeJsonString(result),
        },
      });

      return result;
    } catch (e) {
      const errorText = e instanceof Error ? e.message : String(e);
      await this.prisma.adminScriptRun.update({
        where: { id: runRow.id },
        data: {
          status: "ERROR",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          error: errorText,
        },
      });
      throw e;
    }
  }

  async run(id: string, payload: unknown, actor?: unknown) {
    const details = this.get(id);

    const extracted = this.extractActor(actor);

    const startedAt = Date.now();
    const runRow = await this.prisma.adminScriptRun.create({
      data: {
        scriptId: details.id,
        safety: details.safety,
        kind: "RUN",
        status: "RUNNING",
        payloadJson: this.safeJsonString(payload),
        actorUserId: extracted.actorUserId,
        actorEmail: extracted.actorEmail,
      },
    });

    try {
      let result: unknown;
      switch (details.id) {
        case "db-health":
          result = await this.runDbHealth();
          break;
        case "ensure-system-configs":
          result = await this.runEnsureSystemConfigs();
          break;
        case "create-db-backup":
          result = await this.backupsService.createBackup();
          break;
        case "list-db-backups":
          result = await this.backupsService.listBackups();
          break;
        case "cleanup-old-backups":
          result = await this.runCleanupOldBackups();
          break;
        case "restore-db-from-backup":
          result = await this.runRestoreDbFromBackup(payload);
          break;
        case "seed-default-pages-if-missing":
          result = await this.systemService.seedDefaultPagesIfMissing();
          break;
        case "sync-default-pages-overwrite":
          result = await this.systemService.syncDefaultPagesOverwrite();
          break;
        default:
          throw new NotFoundException("Script not found");
      }

      await this.prisma.adminScriptRun.update({
        where: { id: runRow.id },
        data: {
          status: "OK",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          resultJson: this.safeJsonString(result),
        },
      });

      return { runId: runRow.id, result };
    } catch (e) {
      const errorText = e instanceof Error ? e.message : String(e);
      await this.prisma.adminScriptRun.update({
        where: { id: runRow.id },
        data: {
          status: "ERROR",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          error: errorText,
        },
      });
      throw e;
    }
  }

  private async preflightRestoreDbFromBackup(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      throw new BadRequestException("Payload is required");
    }
    const filename = (payload as { filename?: unknown }).filename;
    if (typeof filename !== "string" || filename.trim().length === 0) {
      throw new BadRequestException("filename is required");
    }
    return this.backupsService.restorePreflight(filename);
  }

  private async runRestoreDbFromBackup(payload?: unknown) {
    if (!payload || typeof payload !== "object") {
      throw new BadRequestException("Payload is required");
    }

    const filename = (payload as { filename?: unknown }).filename;
    const confirmationText = (payload as { confirmationText?: unknown })
      .confirmationText;
    const acknowledged = (payload as { acknowledged?: unknown }).acknowledged;

    if (typeof filename !== "string" || filename.trim().length === 0) {
      throw new BadRequestException("filename is required");
    }
    if (
      typeof confirmationText !== "string" ||
      confirmationText.trim().length === 0
    ) {
      throw new BadRequestException("confirmationText is required");
    }
    if (acknowledged !== true) {
      throw new BadRequestException("acknowledged must be true");
    }

    const expected = `ВОССТАНОВИТЬ: ${filename}`;
    if (confirmationText.trim() !== expected) {
      throw new BadRequestException(
        `confirmationText mismatch. Expected: "${expected}"`,
      );
    }

    return this.backupsService.restoreBackup(filename);
  }

  private async runCleanupOldBackups() {
    const all = await this.backupsService.listBackups();
    const keep = 20;
    const toDelete = all.slice(keep);

    const deleted: string[] = [];
    for (const file of toDelete) {
      await this.backupsService.deleteBackup(file.filename);
      deleted.push(file.filename);
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      kept: Math.min(all.length, keep),
      deleted,
    };
  }

  private async runDbHealth() {
    const [
      userCount,
      swipeCount,
      matchCount,
      messageCount,
      reportCount,
      paymentCount,
      lastUser,
      lastSwipe,
      lastMatch,
      lastMessage,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.swipe.count(),
      this.prisma.match.count(),
      this.prisma.message.count(),
      this.prisma.report.count(),
      this.prisma.payment.count(),
      this.prisma.user.findFirst({ orderBy: { createdAt: "desc" } }),
      this.prisma.swipe.findFirst({ orderBy: { createdAt: "desc" } }),
      this.prisma.match.findFirst({ orderBy: { createdAt: "desc" } }),
      this.prisma.message.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        swipes: swipeCount,
        matches: matchCount,
        messages: messageCount,
        reports: reportCount,
        payments: paymentCount,
      },
      lastCreatedAt: {
        user: lastUser?.createdAt ?? null,
        swipe: lastSwipe?.createdAt ?? null,
        match: lastMatch?.createdAt ?? null,
        message: lastMessage?.createdAt ?? null,
      },
    };
  }

  private async runEnsureSystemConfigs() {
    const created: string[] = [];

    const ensure = async (
      key: string,
      data: {
        value: string;
        description: string;
        type: ConfigType;
        isPublic?: boolean;
      },
    ) => {
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key },
      });
      if (existing) return;
      await this.prisma.systemConfig.create({
        data: {
          key,
          value: data.value,
          description: data.description,
          type: data.type,
          isPublic: data.isPublic ?? false,
        },
      });
      created.push(key);
    };

    // Keep defaults in sync with code expectations.
    await ensure("maintenance_mode", {
      value: "false",
      description: "Enable maintenance mode to block user access",
      type: ConfigType.BOOLEAN,
    });

    await ensure("enable_calls", {
      value: "true",
      description: "Enable Audio/Video Calls",
      type: ConfigType.BOOLEAN,
    });

    await ensure("PHOTO_ACCESS_MODE", {
      value: "RESTRICTED",
      description: "Controls photo access rules (PUBLIC or RESTRICTED).",
      type: ConfigType.STRING,
    });

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      createdKeys: created,
      note:
        created.length === 0
          ? "Все обязательные ключи уже существуют. Ничего не изменено."
          : "Созданы отсутствующие ключи. Существующие значения не перезаписывались.",
    };
  }
}
