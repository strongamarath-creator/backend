import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createReportDto: CreateReportDto, reporter: { id: number }) {
    const reportedUser = await this.usersService.findOne(
      Number(createReportDto.reportedUserId),
    );
    if (!reportedUser) {
      throw new NotFoundException("Reported user not found");
    }

    return this.prisma.report.create({
      data: {
        reporterId: reporter.id,
        reportedUserId: reportedUser.id,
        reason: createReportDto.reason,
      },
    });
  }

  findAll() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: true,
        reportedUser: true,
      },
    });
  }

  async findOne(id: string | number) {
    const reportId = Number(id);
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: true,
        reportedUser: true,
      },
    });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async update(id: string | number, updateReportDto: UpdateReportDto) {
    const reportId = Number(id);
    // Check if exists
    await this.findOne(reportId);

    // We need to map UpdateReportDto to Prisma update input.
    // Assuming UpdateReportDto has optional fields that match Report model.
    // If UpdateReportDto has 'status', we need to cast it or ensure it matches ReportStatus enum.

    return this.prisma.report.update({
      where: { id: reportId },
      data: updateReportDto as Prisma.ReportUpdateInput,
    });
  }

  async remove(id: string | number) {
    const reportId = Number(id);
    await this.findOne(reportId);
    return this.prisma.report.delete({ where: { id: reportId } });
  }
}
