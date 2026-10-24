import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    transform:true,
    transformOptions:{enableImplicitConversion:true}
  }));
   app.enableCors({
      origin:[
        'https://threads-clone-three-gamma.vercel.app',
        'http://localhost:5173',
      ],
      credentials:true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    const uploadFile=join(process.cwd(),'uploads');
    app.useStaticAssets(uploadFile,{
      
      prefix:'/uploads/',
    })
  await app.listen(3000);
}
bootstrap();
