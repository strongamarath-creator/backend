import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiQuery, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentsService, PaymentFilterDto } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { PaymentStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RequestWithUser } from "../common/types";
import { PaymentDto } from "./dto/payment.dto";

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: "Payment created successfully",
    type: PaymentDto,
  })
  create(
    @Request() req: RequestWithUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create({
      ...createPaymentDto,
      userId: req.user.userId,
    });
  }

  @Get()
  @ApiQuery({ name: "status", enum: PaymentStatus, required: false })
  @ApiQuery({ name: "userId", type: String, required: false })
  @ApiQuery({ name: "provider", type: String, required: false })
  @ApiQuery({ name: "page", type: Number, required: false })
  @ApiQuery({ name: "limit", type: Number, required: false })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of payments",
  })
  findAll(
    @Query("status", new ParseEnumPipe(PaymentStatus, { optional: true }))
    status?: PaymentStatus,
    @Query("userId", new ParseIntPipe({ optional: true })) userId?: number,
    @Query("provider") provider?: string,
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const filters: PaymentFilterDto = { status, userId, provider, page, limit };
    return this.paymentsService.findAll(filters);
  }

  @Get("stats/revenue")
  @ApiQuery({ name: "startDate", type: String, required: false })
  @ApiQuery({ name: "endDate", type: String, required: false })
  @ApiResponse({ status: 200, description: "Returns revenue statistics" })
  getRevenueStats(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.paymentsService.getRevenueStats(start, end);
  }

  @Get(":id")
  @ApiResponse({ status: 200, description: "Returns payment by id" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, description: "Payment updated successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  update(@Param("id") id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Payment deleted successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  remove(@Param("id") id: string) {
    return this.paymentsService.remove(id);
  }
}
