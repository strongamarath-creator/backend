import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as compression from "compression";
import { PrismaClientExceptionFilter } from "./prisma/prisma-client-exception.filter";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(path.join(__dirname, "..", "public"), {
    prefix: "/public/",
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new PrismaClientExceptionFilter(httpAdapter.httpAdapter),
  );

  app.use(helmet());
  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle("Dating App API")
    .setDescription("The Dating App API description")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const configService = app.get(ConfigService);
  await app.listen(configService.get("PORT") ?? 3001);
}
void bootstrap();
