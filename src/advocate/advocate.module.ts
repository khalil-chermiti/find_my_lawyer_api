import { Module } from '@nestjs/common';
import { AdvocateController } from './advocate.controller';
import { AdvocateService } from './advocate.service';
import { UploadModule } from '../common/upload/upload.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Avocat, AvocatSchema } from './advocate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Avocat.name, schema: AvocatSchema }]),
    UploadModule,
  ],
  controllers: [AdvocateController],
  providers: [AdvocateService],
})
export class AdvocateModule {}
