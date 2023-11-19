import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from '../authentication.service';
import { HashingService } from '../hashing.service';
import { getModelToken } from '@nestjs/mongoose';
import { Login } from '../authentication.schema';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException } from '@nestjs/common';

describe('Authentication Service', () => {
  let service: AuthenticationService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const hashingServiceMock = new HashingService();

  const userModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockMailer = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: HashingService,
          useValue: hashingServiceMock,
        },
        // inject mongoose model
        {
          provide: getModelToken(Login.name),
          useValue: userModelMock,
        },
        // mock mailer service
        {
          provide: MailerService,
          useValue: mockMailer,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register user', async () => {
      // arrange
      jest.spyOn(userModelMock, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(userModelMock, 'create').mockResolvedValueOnce(true);
      jest.spyOn(mockMailer, 'sendMail').mockResolvedValueOnce(true);

      // act
      await service.register(
        { email: 'khalil@gmail.com', password: 'khalil123' },
        'CLIENT',
      );

      // assert
      expect(userModelMock.findOne).toBeCalled();
      expect(userModelMock.create).toBeCalled();
      expect(mockMailer.sendMail).toBeCalled();
    });

    it('should fail on used email', async () => {
      // arrange
      jest.spyOn(userModelMock, 'findOne').mockResolvedValueOnce({});

      // act
      expect(async () => {
        await service.register(
          { email: 'khalil@gmail.com', password: 'khalil123' },
          'CLIENT',
        );
      }).rejects.toThrow(new BadRequestException('utilisateur existe déjà'));
    });

    it('should fail on undefined role', async () => {
      // arrange

      // act
      expect(async () => {
        await service.register(
          { email: 'khalil@gmail.com', password: 'khalil123' },
          'ADMIN', // can't create admin account
        );
      }).rejects.toThrow(new BadRequestException('role invalide'));
    });
  });

  describe('login', () => {
    it('log in user', async () => {
      // arrange
      const loginData = { email: 'khalil@gmail.com', password: 'khalil123' };

      jest
        .spyOn(hashingServiceMock, 'verifyPassword')
        .mockResolvedValueOnce(true);

      jest
        .spyOn(jwtServiceMock, 'signAsync')
        .mockResolvedValueOnce('fjqskdfjljqflsdjflqsjfdkqjlsdkfjqsdlkfjqsljfk');

      jest.spyOn(userModelMock, 'findOne').mockResolvedValueOnce({
        id: 'some_id_jkfjlsjfkq',
        role: 'CLIENT',
      });

      // act and assert
      const token = await service.login(loginData);

      // assert
      expect(token).toHaveProperty('token');
    });

    it('should fail on wrong password', async () => {
      // arrange
      const loginData = { email: 'khalil@gmail.com', password: 'khalil123' };

      jest
        .spyOn(hashingServiceMock, 'verifyPassword')
        .mockResolvedValueOnce(false);

      jest.spyOn(userModelMock, 'findOne').mockResolvedValueOnce({
        id: 'some_id_jkfjlsjfkq',
        role: 'CLIENT',
      });

      // act and assert
      expect(async () => {
        await service.login(loginData);
      }).rejects.toThrow(
        new BadRequestException(
          'adresse email ou mot de passe sont invalides!',
        ),
      );
    });
  });
});
