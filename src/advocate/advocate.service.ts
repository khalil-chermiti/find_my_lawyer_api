import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UploadService } from './../common/upload/upload.service';
import { Avocat } from './advocate.schema';

@Injectable()
export class AdvocateService {
  private readonly IMAGE_URL_SUFFIX =
    'https://find-my-lawyer.s3.amazonaws.com/';

  constructor(
    private readonly uploadService: UploadService,
    @InjectModel(Avocat.name) private readonly advocateModel: Model<Avocat>,
  ) {}

  async setProfilePicture(
    originalname: string,
    id: string,
    buffer: Buffer,
  ): Promise<void> {
    try {
      // upload image vers S3
      const image_name = await this.uploadService.uploadProfilePicture(
        originalname,
        id,
        buffer,
      );

      // mettre à jour le champ photoDeProfile de l'avocat
      await this.advocateModel
        .findOneAndUpdate(
          { login: id },
          { $set: { photoDeProfile: this.IMAGE_URL_SUFFIX + image_name } },
        )
        .exec();
    } catch (error) {
      throw new InternalServerErrorException("erreur lors de l'upload");
    }
  }
}
