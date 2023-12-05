import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UploadService } from './../common/upload/upload.service';
import { Avocat, PROJECT_SENSITIVE_FIELDS } from './advocate.schema';
import { SearchAdvocateDTO } from './dto/SearchAdvocateDTO';
import { faker } from '@faker-js/faker';
import { DOMAINES_DE_DROIT } from '../common/data/ADVOCATE_DATA';
import { UpdateProfileDTO } from './dto/UpdateProfileDTO';

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

  async searchAdvocate(
    searchAdvocateDTO: SearchAdvocateDTO,
  ): Promise<Avocat[]> {
    try {
      const searchAdvocateDTOFields = this.getDefinedFields(searchAdvocateDTO);

      searchAdvocateDTOFields['active'] = true;
      searchAdvocateDTOFields['verifie'] = true;

      return await this.advocateModel
        .find(searchAdvocateDTOFields, PROJECT_SENSITIVE_FIELDS)
        .limit(10);
    } catch (error) {
      Logger.log("erreur lors de la recherche d'avocat", error);
      throw new InternalServerErrorException(
        'erreur lors de la récupération des avocats',
      );
    }
  }

  async getNonVerifiedAdvocates(): Promise<Avocat[]> {
    return await this.advocateModel.find({ verifie: false }).limit(10);
  }

  async getAdvocateByName(name: string): Promise<Avocat> {
    return await this.advocateModel.findOne({ nom: new RegExp(name, 'i') });
  }

  async acceptAdvocate(Advocate_id: string): Promise<void> {
    await this.advocateModel
      .updateOne({ _id: Advocate_id }, { $set: { verifie: true } })
      .exec();
  }

  // creer un objet contenant les champs non nulls de l'objet searchAdvocateDTO
  private getDefinedFields(searchAdvocateDTO: SearchAdvocateDTO) {
    const searchAdvocateDTOFields = {};

    // map key to schema field using regex
    for (const [key, value] of Object.entries(searchAdvocateDTO)) {
      if (value === null) continue;

      // ville => adresse.ville
      if (key === 'ville') {
        searchAdvocateDTOFields['adresse.ville'] = new RegExp(value, 'i');
        continue;
      }

      searchAdvocateDTOFields[key] = new RegExp(value, 'i');
    }

    return searchAdvocateDTOFields;
  }

  // generer liste des avocats pour tester notre api
  async populate() {
    await this.advocateModel.deleteMany({});

    for (let i = 0; i < 10; i++) {
      const avocat = {
        nom: faker.person.lastName(),
        prenom: faker.person.firstName(),
        email: faker.internet.email(),
        adresse: {
          ville: faker.address.city(),
          rue: faker.address.streetAddress(),
          codePostal: faker.address.zipCode(),
        },
        active: true,
        verifie: true,
        ansExperience: faker.datatype.number({ min: 0, max: 50 }),
        aideJuridique: faker.datatype.boolean(),
        bio: faker.lorem.paragraph(),
        telephone: faker.phone.number(),
        specialite:
          DOMAINES_DE_DROIT[
            faker.number.int({ min: 0, max: DOMAINES_DE_DROIT.length - 1 })
          ],
      };
      await this.advocateModel.create(avocat);
    }
  }

  async updateAdvocate(advocate: UpdateProfileDTO, id: any) {
    const advocateFields = this.getDefinedFieldsForUpdate(advocate);

    try {
      await this.advocateModel
        .findOneAndUpdate({ login: id }, advocateFields)
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        'erreur lors de la mise à jour de données',
      );
    }
  }

  private getDefinedFieldsForUpdate(advocate: UpdateProfileDTO) {
    const CANT_BE_UPDATED = [
      'email',
      'verifie',
      'active',
      'login',
      'infosVerification',
    ];

    const advocateFields = {};

    // map key to schema field using regex
    for (const [key, value] of Object.entries(advocate)) {
      if (value === null) continue;
      if (CANT_BE_UPDATED.includes(key)) continue;
      advocateFields[key] = value;
    }

    return advocateFields;
  }
}
