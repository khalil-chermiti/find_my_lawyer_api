import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../authentication/guards/AuthGuard';
import { roleGuardFactory } from '../authentication/guards/RoleGuard';
import { Avocat } from './advocate.schema';
import { AdvocateService } from './advocate.service';
import { SearchAdvocateDTO } from './dto/SearchAdvocateDTO';
import { UpdateProfileDTO } from './dto/UpdateProfileDTO';

@Controller('advocate')
export class AdvocateController {
  constructor(private readonly advocateService: AdvocateService) {}

  // TODO : IMPELMENTER FILE TYPE VALIDATOR
  @Post('profile-picture')
  @UseGuards(roleGuardFactory('AVOCAT')) // must be avocat
  @UseGuards(AuthGuard) // must be authenticated
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5_000_000 })], // 5mb
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      // upload image vers S3
      await this.advocateService.setProfilePicture(
        file.originalname,
        req['user'].id,
        file.buffer,
      );

      return {
        message: 'photo de profil mise à jour',
      };
    } catch (error) {
      Logger.error("Can't upload file : ");
      throw new InternalServerErrorException("erreur lors de l'upload");
    }
  }

  // Consulter la liste des avocats
  @Get()
  @HttpCode(200)
  async getAdvocates(): Promise<Avocat[]> {
    return await this.advocateService.getActiveAndVerifiedAdvocates();
  }

  // retourner le profile d'avocat actuellement connecté
  @Get('profile')
  @UseGuards(roleGuardFactory('ADMIN'))
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async getCurrentProfileData(@Req() req: Request): Promise<Avocat> {
    const user = req['user'];
    return await this.advocateService.getAdvocateByLoginId(user.id);
  }

  //chercher un avocat
  @Post('search')
  async searchAvocats(
    @Body() searchAdvocateDTO: SearchAdvocateDTO,
  ): Promise<Avocat[]> {
    return this.advocateService.searchAdvocate(searchAdvocateDTO);
  }

  @Post('populate')
  async populate() {
    await this.advocateService.populate();
  }

  @Get('/all')
  @UseGuards(roleGuardFactory('ADMIN'))
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async getAllAdvocates(): Promise<Avocat[]> {
    try {
      return await this.advocateService.getAllLAdvocates();
    } catch (e) {
      Logger.log('error while getting all advocate list', e);
      throw new InternalServerErrorException(
        'erreur lors de la récupération des avocats',
      );
    }
  }

  @Get('/non-verified')
  @UseGuards(roleGuardFactory('ADMIN'))
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async getNonVerifiedAdvocates(): Promise<Avocat[]> {
    try {
      return await this.advocateService.getNonVerifiedAdvocates();
    } catch (e) {
      Logger.log('error while getting all advocate list', e);
      throw new InternalServerErrorException(
        'erreur lors de la récupération des avocats',
      );
    }
  }

  @Post('/accept/:id')
  @UseGuards(roleGuardFactory('ADMIN'))
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async acceptAdvocate(@Param() params: any): Promise<void> {
    if (!params.id)
      throw new InternalServerErrorException('id of advocate is required');
    try {
      await this.advocateService.acceptAdvocate(params.id);
    } catch (e) {
      Logger.log('error while accepting advocate', e);
      throw new InternalServerErrorException(
        "erreur lors de l'acceptation de l'avocat",
      );
    }
  }

  @Post('/update')
  @UseGuards(roleGuardFactory('AVOCAT'))
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async updateAdvocate(
    @Body() advocate: UpdateProfileDTO,
    @Req() req: Request,
  ) {
    try {
      await this.advocateService.updateAdvocate(advocate, req['user'].id);
      return {
        message: 'profile mis à jour',
      };
    } catch (e) {
      Logger.log('error while updating advocate', e);
      throw new InternalServerErrorException(
        "erreur lors de la mise à jour de l'avocat",
      );
    }
  }
}
