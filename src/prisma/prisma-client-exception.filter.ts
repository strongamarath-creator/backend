import { ArgumentsHost, Catch, HttpServer } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  constructor(applicationRef: HttpServer) {
    super(applicationRef);
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case "P2002": {
        const status = 409;
        response.status(status).json({
          statusCode: status,
          message: "Unique constraint violation",
        });
        break;
      }
      default:
        super.catch(exception, host);
        break;
    }
  }
}
