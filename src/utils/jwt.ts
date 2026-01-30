import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  agentId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  // const expiresIn = process.env.JWT_EXPIRE || '7d';

  const expiresIn = process.env.JWT_EXPIRE || '7d';  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // const options: SignOptions = {
  //   expiresIn,
  // };

  // return jwt.sign(payload, secret, options);
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRE || "7d") as SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};