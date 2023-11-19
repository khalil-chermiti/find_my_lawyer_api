import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Login } from './authentication.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from './dto/LoginDTO';
import { HashingService } from './hashing.service';
import { ROLE } from './auth.types';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(Login.name) private readonly loginModel: Model<Login>,
    private jwtService: JwtService,
    private hashingService: HashingService,
    private mailerService: MailerService,
  ) {}

  async register(loginDTO: LoginDTO, role: Omit<'ADMIN', ROLE>) {
    // valider les informations de l'utilisateur
    this.validateLoginInfo(loginDTO);
    this.validateRole(role);

    // verifier l'existance de l'utilisateur dans la base de données
    const user = await this.loginModel.findOne({ email: loginDTO.email });

    if (user) {
      throw new BadRequestException('utilisateur existe déjà');
    }

    try {
      // hash le mot de passe avec bcrypt
      const hashedPassword = await this.hashingService.hashpassword(
        loginDTO.password,
      );

      // enregistrer l'utilisateur
      await this.loginModel.create({
        email: loginDTO.email,
        password: hashedPassword,
        actif: true,
        role: role,
      });
    } catch (e) {
      throw new BadRequestException("erreur lors de l'enregistrement");
    }

    try {
      // envoyer un email de salutation
      this.mailerService
        .sendMail({
          to: loginDTO.email,
          from: 'findmylawyer@mail.com',
          subject: 'Bienvenue',
          text: 'votre compte a été créé avec succès',
        })
        .then(() => {
          Logger.log('email envoyé avec succès');
        })
        .catch(() => {
          Logger.error("erreur lors de l'envoi de l'email");
        });
    } catch (e) {
      this.loginModel.deleteOne({ email: loginDTO.email });
      throw new BadRequestException("erreur lors de l'enregistrement");
    }
  }

  async login(loginDTO: LoginDTO) {
    // valider les informations de l'utilisateur
    this.validateLoginInfo(loginDTO);

    // verifier l'existance de l'utilisateur dans la base de données
    const login = await this.loginModel.findOne({ email: loginDTO.email });
    if (!login) {
      throw new BadRequestException("l'adresse email n'existe pas!");
    }

    // verifier le mot de passe
    const isPasswordValid = await this.hashingService.verifyPassword(
      loginDTO.password,
      login.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException(
        'adresse email ou mot de passe sont invalides!',
      );
    }

    const payload = { id: login.id, role: login.role };

    // generer le token
    try {
      const token = await this.jwtService.signAsync(payload);
      return { token: token };
    } catch (e) {
      Logger.error(e);
      throw new InternalServerErrorException();
    }
  }

  private validateLoginInfo(loginDTO: LoginDTO) {
    // regex pour valider l'adresse email
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!loginDTO.email || !emailRegex.test(loginDTO.email)) {
      throw new BadRequestException('email invalide');
    }

    if (!loginDTO.password || loginDTO.password.length < 8) {
      throw new BadRequestException(
        'mot de passe invalide : 8 caractères minimum',
      );
    }
  }

  private validateRole(role: Omit<'ADMIN', ROLE>) {
    if (role !== 'CLIENT' && role !== 'AVOCAT') {
      throw new BadRequestException('role invalide');
    }
  }
}
