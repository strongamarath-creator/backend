import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePageDto, UpdatePageDto } from "./dto/create-page.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPageDto: CreatePageDto) {
    return this.prisma.pageConfig.create({
      data: createPageDto,
    });
  }

  findAll() {
    return this.prisma.pageConfig.findMany({
      orderBy: { route: "asc" },
    });
  }

  findOne(id: string | number) {
    return this.prisma.pageConfig.findUnique({
      where: { id: Number(id) },
    });
  }

  findByRoute(route: string) {
    return this.prisma.pageConfig.findUnique({
      where: { route },
    });
  }

  update(id: string | number, updatePageDto: UpdatePageDto) {
    return this.prisma.pageConfig.update({
      where: { id: Number(id) },
      data: updatePageDto as Prisma.PageConfigUpdateInput,
    });
  }

  remove(id: string | number) {
    return this.prisma.pageConfig.delete({
      where: { id: Number(id) },
    });
  }
}
