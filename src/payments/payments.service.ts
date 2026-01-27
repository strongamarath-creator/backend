import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentGatewayResponse } from "./payment-gateway.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { UsersService } from "../users/users.service";
import { PaymentGatewayService } from "./payment-gateway.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  Payment,
  Prisma,
  PaymentStatus,
  PaymentProvider,
} from "@prisma/client";

export interface PaymentFilterDto {
  status?: PaymentStatus;
  userId?: number;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaymentRevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  averageTransactionAmount: number;
}

interface CreatePaymentWithUser extends CreatePaymentDto {
  userId: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly paymentGatewayService: PaymentGatewayService,
  ) {}

  async create(
    createPaymentDto: CreatePaymentWithUser,
  ): Promise<{ payment: Payment; gatewayData: PaymentGatewayResponse }> {
    // Verify user exists
    const user = await this.usersService.findOne(createPaymentDto.userId);
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createPaymentDto.userId} not found`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        user: { connect: { id: user.id } },
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || "USD",
        status: PaymentStatus.PENDING,
        provider: createPaymentDto.provider as PaymentProvider,
        productType: "SUBSCRIPTION",
        tier: createPaymentDto.tier
          ? (createPaymentDto.tier as any)
          : undefined,
      },
    });

    // Initialize payment with gateway
    let gatewayData: PaymentGatewayResponse | null = null;
    try {
      gatewayData = await this.paymentGatewayService.initializePayment(
        createPaymentDto.provider,
        createPaymentDto.amount,
        payment.currency,
        String(payment.id),
      );
    } catch (error) {
      // If gateway initialization fails, we might want to mark payment as failed or just log it
      console.error("Payment gateway initialization failed:", error);
      // Optional: update payment status to FAILED
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw error;
    }

    // Force non-null assertion or check because logic ensures it's set if no error thrown
    if (!gatewayData) {
      throw new Error("Gateway data not initialized");
    }

    if (
      createPaymentDto.provider === "TEST" &&
      gatewayData.status === "APPROVED"
    ) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: gatewayData.orderId ?? String(payment.id),
          expiresAt,
        },
      });

      if (createPaymentDto.tier) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: createPaymentDto.tier as any,
            subscriptionStartedAt: now,
            subscriptionExpiresAt: expiresAt,
          },
        });
      }
    }

    return { payment, gatewayData };
  }

  async findAll(filters?: PaymentFilterDto): Promise<{
    data: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.provider) {
      where.provider = filters.provider as PaymentProvider;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string | number): Promise<Payment> {
    const paymentId = Number(id);
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(
    id: string | number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const paymentId = Number(id);
    await this.findOne(paymentId);

    const { tier, provider, ...rest } = updatePaymentDto;

    // Explicitly handle tier casting if present
    const data: Prisma.PaymentUpdateInput = {
      ...rest,
      ...(tier ? { tier: tier as any } : {}),
      ...(provider ? { provider: provider as PaymentProvider } : {}),
    };

    return this.prisma.payment.update({
      where: { id: paymentId },
      data,
    });
  }

  async remove(id: string | number): Promise<void> {
    const paymentId = Number(id);
    await this.findOne(paymentId);
    await this.prisma.payment.delete({ where: { id: paymentId } });
  }

  async getRevenueStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentRevenueStats> {
    const where: Prisma.PaymentWhereInput = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const payments = await this.prisma.payment.findMany({ where });

    const totalRevenue = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalTransactions = payments.length;
    const completedTransactions = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    ).length;
    const pendingTransactions = payments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    ).length;
    const failedTransactions = payments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    ).length;

    const averageTransactionAmount =
      completedTransactions > 0 ? totalRevenue / completedTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      averageTransactionAmount,
    };
  }
}
