import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UploadService } from './../common/upload/upload.service';
import { Avocat } from './advocate.schema';
import { SearchAdvocateDTO } from './dto/SearchAdvocateDTO';

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

  // récupérer les avocats pour l'internaute
  async getActiveAndVerifiedAdvocates(): Promise<Avocat[]> {
    try {
      return await this.advocateModel
        .find({ active: true, verifie: true })
        .limit(10);
    } catch {
      throw new InternalServerErrorException(
        'erreur lors de la récupération des avocats',
      );
    }
  }
  // récupérer les avocats pour l'admin
  async getAllLAdvocates(): Promise<Avocat[]> {
    return await this.advocateModel.find().limit(10);
  }

  // AMAL : rechercher un avocat
  async searchAdvocate(
    searchAdvocateDTO: SearchAdvocateDTO,
  ): Promise<Avocat[]> {
    try {
      const { firstName, lastName, city, speciality } = searchAdvocateDTO;

      if (
        firstName === null &&
        lastName === null &&
        city === null &&
        speciality === null
      )
        throw new InternalServerErrorException(
          'veuillez saisir un critère de recherche',
        );

      return await this.advocateModel
        .find({
          prenom: { $regex: firstName },
          // nom: { $regex: lastName },
          // ville: { $regex: city },
          // specialite: { $in: speciality }, // find in array
        })
        .limit(10);
    } catch (error) {
      Logger.log("erreur lors de la recherche d'avocat", error);
      throw new InternalServerErrorException(
        'erreur lors de la récupération des avocats',
      );
    }
  }

  // generer liste des avocats pour tester notre api
  async populate() {
    const avocats = [
      {
        nom: 'ben salah',
        prenom: 'mohamed',
        email: 'salah@mail.com',
        ville: 'tunis',
        specialite: ['droit civil', 'droit penal'],
      },
      {
        nom: 'troudi',
        prenom: 'amal',
        email: 'amal@mail.com',
        ville: 'ariana',
        specialite: ['droit civil', 'droit public'],
      },
    ];

    avocats.forEach(async (avocat) => {
      await this.advocateModel.create(avocat);
    });
  }

  async getNonVerifiedAdvocates(): Promise<Avocat[]> {
    return await this.advocateModel.find({ verifie: false }).limit(10);
  }

  async getAdvocateByName(name: string): Promise<Avocat> {
    return await this.advocateModel.findOne({ nom: name });
  }

  async acceptAdvocate(Advocate_id: string): Promise<void> {
    await this.advocateModel
      .updateOne({ _id: Advocate_id }, { $set: { verifie: true } })
      .exec();
  }
}
