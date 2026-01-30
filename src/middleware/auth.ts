import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import Agent from '../models/Agent';

export interface AuthRequest extends Request {
  agent?: {
    agentId: string;
    email: string;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    const agent = await Agent.findById(decoded.agentId).select('-password');

    if (!agent) {
      res.status(401).json({
        success: false,
        message: 'Agent no longer exists',
      });
      return;
    }

    if (!agent.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
      });
      return;
    }

    req.agent = {
      agentId: decoded.agentId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.agent || !roles.includes(req.agent.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
      return;
    }
    next();
  };
};