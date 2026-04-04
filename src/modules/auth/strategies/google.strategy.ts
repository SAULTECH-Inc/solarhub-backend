import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(cfg: ConfigService) {
    super({
      clientID:     cfg.get('google.clientId'),
      clientSecret: cfg.get('google.clientSecret'),
      callbackURL:  cfg.get('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { name, emails, photos, id } = profile;
    done(null, {
      googleId:  id,
      email:     emails[0].value,
      firstName: name.givenName,
      lastName:  name.familyName,
      avatar:    photos?.[0]?.value,
    });
  }
}
