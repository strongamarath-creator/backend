import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiResponse } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("users")
  @ApiResponse({ status: 200, description: "Returns user statistics" })
  getUserStats() {
    return this.analyticsService.getUserStats();
  }

  @Get("dashboard")
  @ApiResponse({ status: 200, description: "Returns dashboard statistics" })
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
