import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return { name: "bff", status: "ok" };
  }

  @Get("health")
  getHealth() {
    return { status: "ok" };
  }
}
