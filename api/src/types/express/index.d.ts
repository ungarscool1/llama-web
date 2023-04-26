export {}

export interface IUser {
  exp?: Date,
  iat?: Date,
  auth_time?: Date,
  jti?: string,
  iss?: string,
  sub?: string,
  typ?: string,
  azp?: string,
  nonce?: string,
  session_state?: string,
  acr?: number,
  'allowed-origins'?: Array<string>,
  scope?: string,
  sid?: string,
  email_verified?: boolean,
  name?: string,
  preferred_username: string,
  locale?: string,
  given_name?: string,
  family_name?: string,
  email?: string
  username: string
}

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}