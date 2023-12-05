import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/authentication/guards/AuthGuard';
import { roleGuardFactory } from 'src/authentication/guards/RoleGuard';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  // create session stripe checkout pour le paiement
  @UseGuards(roleGuardFactory('AVOCAT'))
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('checkout')
  async createCheckoutSession(@Req() req: Request) {
    const user = req['user']; // {id: string , role : string}

    try {
      const session_url = await this.paymentService.createCheckoutSession(
        user.id,
      );

      return {
        payment_url: session_url,
      };
    } catch (e) {
      Logger.error('error while creating checkout session : ', e);
    }
  }

  @HttpCode(200)
  @Get('/success')
  async handleSuccess(@Query('id') id: string) {
    Logger.log('payment success for user with id : ', id);

    try {
      // save the payment to database and activate the profile
      await this.paymentService.savePayementAndActivateProfile({
        advocate_id: id,
      });
    } catch (e) {
      Logger.error('error while saving payment to database : ', e);
    }

    return {
      message: 'payment success',
    };
  }

  @HttpCode(400)
  @Post('/failure')
  async handleFailure(@Query('id') id: string) {
    Logger.error('payment failed for user with id : ', id);

    return {
      message: 'payment failed',
    };
  }
}
