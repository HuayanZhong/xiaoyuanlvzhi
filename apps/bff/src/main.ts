import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(env.PORT);

  const logger = new Logger("Bootstrap");
  logger.log(`BFF listening on http://localhost:${env.PORT}`);
}

void bootstrap();
