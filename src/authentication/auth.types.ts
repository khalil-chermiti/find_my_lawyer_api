export type JWTPayload = {
  id: string;
  role: string;
};

export type ROLE = 'ADMIN' | 'CLIENT' | 'AVOCAT';
