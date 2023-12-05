import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Payment } from './payment.schema';
import { Model } from 'mongoose';
import { Avocat } from 'src/advocate/advocate.schema';
import { MailerService } from '@nestjs-modules/mailer';

// creer un service qui va contenir l'instance de stripe
@Injectable()
export class PaymentService {
  public readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Payment.name) private readonly PaymentModel: Model<Payment>,
    @InjectModel(Avocat.name) private readonly AvocatModel: Model<Avocat>,
    private mailerService: MailerService,
  ) {
    this.stripe = new Stripe(configService.get<string>('STRIPE_API_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  // create stripe payment session link
  async createCheckoutSession(id: string) {
    // find the advocate by login id
    const advocate = await this.AvocatModel.findOne({ login: id });

    if (!advocate.verifie && advocate.active)
      throw new Error('avocat est deja active ou pas encore verifie');

    // get domain name from config
    const DOMAIN_NAME = this.configService.get<string>('DOMAIN_NAME');

    // create stripe session
    const stripeSession = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 100 * 100, // in cents (100$)
            product_data: {
              name: 'subscribe to find my lawyer service',
            },
          },
        },
      ],
      mode: 'payment',
      success_url: `${DOMAIN_NAME}/payment/success?id=${advocate.id}`,
      cancel_url: `${DOMAIN_NAME}/payment/failure?id=${advocate.id}`,
    });

    return stripeSession.url;
  }

  async savePayementAndActivateProfile(payment: { advocate_id: string }) {
    const ACTIVATION_DATE = new Date();

    const EXPERATION_DATE = new Date().setFullYear(
      ACTIVATION_DATE.getFullYear() + 1,
    ); // 1 year

    await this.PaymentModel.create({
      avocat: payment.advocate_id,
      date_activation: ACTIVATION_DATE,
      date_expiration: EXPERATION_DATE,
      type: 'annuel',
      prix: 100,
    });

    // activer le profile de l'avocat
    const advocate = await this.AvocatModel.findOne({
      _id: payment.advocate_id,
    });

    advocate.active = true;
    await advocate.save();

    // evoyer un email de confirmation
    await this.mailerService
      .sendMail({
        to: advocate.email,
        from: 'findmylawyer@mail.com',
        subject: 'Activation de votre compte',
        text: 'votre compte a été activé avec succès',
      })
      .then(() => {
        Logger.log('email envoyé avec succès');
      })
      .catch(() => {
        Logger.error("erreur lors de l'envoi de l'email");
      });
  }
}
