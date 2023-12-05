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

describe('Advocate Controller(e2e)', () => {
  let dockerCompose: StartedDockerComposeEnvironment;
  let databaseConnection: Connection;
  let moduleFixture: TestingModule;
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
    moduleFixture = await Test.createTestingModule({
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
    await databaseConnection.collection('avocats').deleteMany({});
  });

  it('should be defined', () => {
    expect(moduleFixture).toBeDefined();
  });

  it('/advocate/ (GET)', async () => {
    // arrange
    const listOfAdvocates = [
      {
        id: 1,
        name: 'advocate1',
        email: 'advocate@mail.com',
        active: true,
        verifie: true,
      },
      {
        id: 2,
        name: 'advocate2',
        email: 'advocate2@mail.com',
        verifie: true,
        active: true,
      },
      {
        id: 3,
        name: 'advocate3',
        email: 'advocate@mail.com',
        active: false,
        verifie: false,
      },
    ];

    await databaseConnection.collection('avocats').insertMany(listOfAdvocates);

    // act
    const response = await request(server).get('/advocate');

    // assert
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });
});
