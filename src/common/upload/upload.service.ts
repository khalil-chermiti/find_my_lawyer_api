import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    region: this.configSerivce.getOrThrow('AWS_S3_REGION'),
  });

  private readonly bucketName =
    this.configSerivce.getOrThrow('AWS_S3_BUCKET_NAME');

  constructor(private readonly configSerivce: ConfigService) {}

  async uploadProfilePicture(fileName: string, userId: string, file: Buffer) {
    // générer un nom unique pour la photo de profil
    const profilePictureName = this.generateUniqueProfilePictureName(
      fileName,
      userId,
    );

    // supprimer la photo de profil existante
    await this.deleteProfilePicture(profilePictureName);

    // ajouter la nouvelle photo de profil
    const createObjectCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: profilePictureName,
      Body: file,
      ACL: 'public-read',
    });

    await this.s3Client.send(createObjectCommand);
    Logger.log('upload profile picture : ', fileName);

    return profilePictureName;
  }

  private async deleteProfilePicture(fileName: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });
    await this.s3Client.send(deleteCommand);
    Logger.log('delete profile picture : ', fileName);
  }

  // le nom de l'image est l'id de l'utilisateur + l'extension de l'image
  // exemple : fsdjfkqflkdf.png
  private generateUniqueProfilePictureName(
    fileNameWithExt: string,
    userId: string,
  ): string {
    const ext = fileNameWithExt.split('.').pop();
    return `${userId}.${ext}`;
  }
}
