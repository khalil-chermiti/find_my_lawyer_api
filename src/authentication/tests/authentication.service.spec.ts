import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from '../authentication.service';
import { HashingService } from '../hashing.service';
import { getModelToken } from '@nestjs/mongoose';
import { Login } from '../authentication.schema';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException } from '@nestjs/common';
import { Avocat } from './../../advocate/advocate.schema';
import { Client } from './../../client/client.schema';

describe('Authentication Service', () => {
  let service: AuthenticationService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const hashingServiceMock = new HashingService();

  const loginModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  };

  const clientModelMock = {
    create: jest.fn(),
    deleteOne: jest.fn(),
  };

  const advocateModelMock = {
    create: jest.fn(),
    deleteOne: jest.fn(),
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
        // mock mongoose login model
        {
          provide: getModelToken(Login.name),
          useValue: loginModelMock,
        },
        // mock mongoose avocat model
        {
          provide: getModelToken(Avocat.name),
          useValue: advocateModelMock,
        },
        // mock mongoose client model
        {
          provide: getModelToken(Client.name),
          useValue: clientModelMock,
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
      jest.spyOn(loginModelMock, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(loginModelMock, 'create').mockResolvedValueOnce({ _id: '1' });
      jest.spyOn(mockMailer, 'sendMail').mockResolvedValueOnce(true);

      // act
      await service.register(
        {
          firstName: 'khalil',
          lastName: 'chermiti',
          email: 'khalil@gmail.com',
          password: 'khalil123',
        },
        'CLIENT',
      );

      // assert
      expect(loginModelMock.findOne).toBeCalled();
      expect(loginModelMock.create).toBeCalled();
      expect(mockMailer.sendMail).toBeCalled();
    });

    it('should fail on used email', async () => {
      // arrange
      jest.spyOn(loginModelMock, 'findOne').mockResolvedValueOnce({});

      // act
      expect(async () => {
        await service.register(
          {
            firstName: 'khalil',
            lastName: 'chermiti',
            email: 'khalil@gmail.com',
            password: 'khalil123',
          },
          'CLIENT',
        );
      }).rejects.toThrow(new BadRequestException('utilisateur existe déjà'));
    });

    it('should fail on undefined role', async () => {
      // arrange

      // act
      expect(async () => {
        await service.register(
          {
            firstName: 'khalil',
            lastName: 'chermiti',
            email: 'khalil@gmail.com',
            password: 'khalil123',
          },
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

      jest.spyOn(loginModelMock, 'findOne').mockResolvedValueOnce({
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

      jest.spyOn(loginModelMock, 'findOne').mockResolvedValueOnce({
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
