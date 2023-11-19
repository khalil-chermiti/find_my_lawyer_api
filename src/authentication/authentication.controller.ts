import { Body, Controller, HttpCode, Post, Query } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginDTO, RegisterDTO } from './dto/LoginDTO';
import { ROLE } from './auth.types';

@Controller('auth')
export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body() registerDTO: RegisterDTO,
    @Query('role') role: Omit<'ADMIN', ROLE>,
  ) {
    await this.authService.register(registerDTO, role);
    return { message: 'utilisateur enregistré' };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }
}
