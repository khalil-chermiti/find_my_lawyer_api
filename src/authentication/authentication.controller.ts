import { Body, Controller, Post, Query } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginDTO } from './dto/LoginDTO';
import { ROLE } from './auth.types';

@Controller('auth')
export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @Post('register')
  async register(
    @Body() loginDTO: LoginDTO,
    @Query('role') role: Omit<'ADMIN', ROLE>,
  ) {
    await this.authService.register(loginDTO, role);
    return { message: 'utilisateur enregistré' };
  }

  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }
}
