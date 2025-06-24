import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from './core/core.module';
import { BloggerPlatformModule } from './modules/bloggers-platform/blogger-platform.module';
import { TestingModule } from './modules/testing/testing.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest-bloggers-platform'),
    CoreModule,
    BloggerPlatformModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
