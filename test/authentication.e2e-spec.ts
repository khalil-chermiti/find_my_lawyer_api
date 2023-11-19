import { DatabaseService } from './../src/common/database/database.service';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from 'testcontainers';

describe('Authentication Controller(e2e)', () => {
  let dockerCompose: StartedDockerComposeEnvironment;
  let databaseConnection: Connection;
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    // start docker compose
    const composeFilePath = '.';
    const composeFile = 'docker-compose.yml';

    dockerCompose = await new DockerComposeEnvironment(
      composeFilePath,
      composeFile,
    ).up(['mongo']);

    // start nestjs app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // extract database connection
    databaseConnection = moduleFixture
      .get<DatabaseService>(DatabaseService)
      .getConnection();

    // extract server
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await dockerCompose.down();
  });

  beforeEach(async () => {
    await databaseConnection.collection('logins').deleteMany({});
  });

  it('/auth/register (POST)', async () => {
    // arrange
    const LOGIN_TEST_DATA = {
      email: 'user@mail.com',
      password: 'this_is_my_password',
    };

    // act
    const response = await request(server)
      .post('/auth/register')
      .query({ role: 'CLIENT' })
      .send(LOGIN_TEST_DATA);

    // assert
    expect(response.body).toHaveProperty('message');
    expect(response.statusCode).toBe(201);
  });

  it('/auth/login (POST)', async () => {
    // arrange
    const LOGIN_TEST_DATA = {
      email: 'user@gmail.com',
      password: 'this_is_my_password',
    };

    const HASHED_PASSWORD =
      '$2a$12$Kls8bzCZQAE0pLAXsgSPcuPPio2sf7.t2HsrFEvwjFFuyJ6eH0Z3u';

    await databaseConnection.collection('logins').insertOne({
      email: LOGIN_TEST_DATA.email,
      password: HASHED_PASSWORD,
      role: 'CLIENT',
      actif: true,
    });

    // act
    const response = await request(server)
      .post('/auth/login')
      .send(LOGIN_TEST_DATA);

    // assert
    expect(response.body).toHaveProperty('token');
    expect(response.statusCode).toBe(200);
  });
});
