import "express";
declare global {
  namespace Express {
    interface Request {
      user: string | jwt.JwtPayload | undefined;
    }
  }
}

export { };

