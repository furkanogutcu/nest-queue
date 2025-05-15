import { NextFunction, Request, Response } from 'express';

export interface BullBoardAuthOptions {
  username: string;
  password: string;
}

export const createBullBoardAuthMiddleware = (authOptions: BullBoardAuthOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { username, password } = authOptions;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).send('Authentication required') as any;
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
    const [authUsername, authPassword] = decodedCredentials.split(':');

    if (authUsername !== username || authPassword !== password) {
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).send('Invalid credentials') as any;
    }

    next();
  };
};
