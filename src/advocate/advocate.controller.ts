import {
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
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
  
  @Get()
  @HttpCode(200)
  async getAdvocates(): Promise<Avocat[]> {
    return await this.advocateService.getActiveAndVerifiedAdvocates();
  }
}
