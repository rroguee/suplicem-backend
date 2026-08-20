export interface FirebaseLoginResponseDto {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

export interface FirebaseRefreshTokenResponseDto {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  token_type: string;
  id_token: string;
  user_id: string;
  project_id: string;
}