import { Controller, Get, Query } from "@nestjs/common";
import { PagesService } from "./pages.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("public-pages")
@Controller("public/pages")
export class PublicPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findByRoute(@Query("route") route: string) {
    return this.pagesService.findByRoute(route);
  }
}
