import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from "@nestjs/common";
import { RequestWithUser } from "../common/types";
import { MatchesService } from "./matches.service";
import { CreateSwipeDto } from "./dto/create-swipe.dto";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { MatchStatsDto } from "./dto/match-stats.dto";
import { SwipeResultDto } from "./dto/swipe-result.dto";
import { MatchDto } from "./dto/match.dto";
import { PotentialMatchDto } from "./dto/potential-match.dto";

@ApiTags("matches")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post("swipe")
  @ApiOperation({ summary: "Swipe a user (like/dislike)" })
  @ApiCreatedResponse({ type: SwipeResultDto })
  swipe(
    @Request() req: RequestWithUser,
    @Body() createSwipeDto: CreateSwipeDto,
  ) {
    return this.matchesService.swipe(req.user.userId, createSwipeDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all matches for current user" })
  @ApiOkResponse({ type: [MatchDto] })
  findAll(@Request() req: RequestWithUser) {
    return this.matchesService.findAllMatches(req.user.userId);
  }

  @Get("potential")
  @ApiOperation({ summary: "Get potential matches (users not yet swiped)" })
  @ApiOkResponse({ type: [PotentialMatchDto] })
  getPotentialMatches(@Request() req: RequestWithUser) {
    return this.matchesService.findPotentialMatches(req.user.userId);
  }

  @Get("liked-me")
  @ApiOperation({ summary: "Get users who liked current user" })
  getLikedMe(@Request() req: RequestWithUser) {
    return this.matchesService.getLikedMe(req.user.userId);
  }

  @Get("liked-me/by-photo")
  @ApiOperation({ summary: "Get likes grouped by target photo" })
  getLikedMeByPhoto(@Request() req: RequestWithUser) {
    return this.matchesService.getLikedMeByPhoto(req.user.userId);
  }

  @Get("i-liked")
  @ApiOperation({ summary: "Get users liked by current user" })
  getILiked(@Request() req: RequestWithUser) {
    return this.matchesService.getILiked(req.user.userId);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get likes and matches counters for current user" })
  @ApiOkResponse({ type: MatchStatsDto })
  getStats(@Request() req: RequestWithUser) {
    return this.matchesService.getStats(req.user.userId);
  }
}
