import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 5000);

  await app.listen(port);

  const logger = new Logger("Bootstrap");
  logger.log(`BFF listening on http://localhost:${port}`);
}

void bootstrap();
