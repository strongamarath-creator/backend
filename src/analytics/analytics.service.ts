import { Injectable } from "@nestjs/common";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";

export interface UserStatsDto {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
}

export interface DashboardStatsDto {
  users: UserStatsDto;
  revenue: {
    totalRevenue: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    averageTransactionAmount: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private getDateRange(period: "day" | "week" | "month"): {
    start: Date;
    end: Date;
  } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "day":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end };
  }

  async getUserStats(): Promise<UserStatsDto> {
    const totalUsers = await this.prisma.user.count();

    const today = this.getDateRange("day");
    const week = this.getDateRange("week");
    const month = this.getDateRange("month");

    const newUsersToday = await this.prisma.user.count({
      where: { createdAt: { gte: today.start } },
    });

    const newUsersThisWeek = await this.prisma.user.count({
      where: { createdAt: { gte: week.start } },
    });

    const newUsersThisMonth = await this.prisma.user.count({
      where: { createdAt: { gte: month.start } },
    });

    const activeUsersToday = await this.prisma.user.count({
      where: { lastLoginAt: { gte: today.start } },
    });

    const activeUsersThisWeek = await this.prisma.user.count({
      where: { lastLoginAt: { gte: week.start } },
    });

    const activeUsersThisMonth = await this.prisma.user.count({
      where: { lastLoginAt: { gte: month.start } },
    });

    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      activeUsersThisWeek,
      activeUsersThisMonth,
    };
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const users = await this.getUserStats();

    // Get overall revenue stats
    const overallRevenue = await this.paymentsService.getRevenueStats();

    // Get revenue for specific periods
    const today = this.getDateRange("day");
    const week = this.getDateRange("week");
    const month = this.getDateRange("month");

    const todayRevenue = await this.paymentsService.getRevenueStats(
      today.start,
      today.end,
    );
    const weekRevenue = await this.paymentsService.getRevenueStats(
      week.start,
      week.end,
    );
    const monthRevenue = await this.paymentsService.getRevenueStats(
      month.start,
      month.end,
    );

    return {
      users,
      revenue: {
        totalRevenue: overallRevenue.totalRevenue,
        revenueToday: todayRevenue.totalRevenue,
        revenueThisWeek: weekRevenue.totalRevenue,
        revenueThisMonth: monthRevenue.totalRevenue,
        totalTransactions: overallRevenue.totalTransactions,
        completedTransactions: overallRevenue.completedTransactions,
        pendingTransactions: overallRevenue.pendingTransactions,
        failedTransactions: overallRevenue.failedTransactions,
        averageTransactionAmount: overallRevenue.averageTransactionAmount,
      },
    };
  }
}
