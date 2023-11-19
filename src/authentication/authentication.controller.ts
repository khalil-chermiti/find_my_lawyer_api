import { Body, Controller, HttpCode, Post, Query } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginDTO } from './dto/LoginDTO';
import { ROLE } from './auth.types';

@Controller('auth')
export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body() loginDTO: LoginDTO,
    @Query('role') role: Omit<'ADMIN', ROLE>,
  ) {
    await this.authService.register(loginDTO, role);
    return { message: 'utilisateur enregistré' };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }
}
