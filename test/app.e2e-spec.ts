import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  // Инициализация приложения один раз перед всеми тестами в этом блоке.
  // Это значительно ускоряет выполнение по сравнению с beforeEach.
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Отключаем логгер NestJS во время тестов, чтобы консоль оставалась чистой
      .setLogger(false)
      .compile();

    app = moduleFixture.createNestApplication();

    // ВАЖНО: Если в main.ts вы используете глобальные пайпы (например, для валидации DTO),
    // их ОБЯЗАТЕЛЬНО нужно подключить и в тестах, иначе тесты будут ложноположительными.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  // Обязательно закрываем приложение после тестов, чтобы избежать утечек памяти
  // и зависших процессов (open handles) в Jest.
  afterAll(async () => {
    await app.close();
  });

  describe("Root Route", () => {
    it("/ (GET) - should return Hello World", () => {
      return request(app.getHttpServer())
        .get("/")
        .expect(200)
        .expect("Hello World!");
    });
  });

  // Пример того, как тестировать несуществующие маршруты (404)
  it("should return 404 for unknown route", () => {
    return request(app.getHttpServer()).get("/unknown-route").expect(404);
  });
});
