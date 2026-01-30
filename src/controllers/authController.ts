import { Request, Response } from 'express';
import Agent from '../models/Agent';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, dealerName } = req.body;

    const existingAgent = await Agent.findOne({ email });

    if (existingAgent) {
      res.status(400).json({
        success: false,
        message: 'Agent with this email already exists',
      });
      return;
    }

    const existingPhone = await Agent.findOne({ phone });

    if (existingPhone) {
      res.status(400).json({
        success: false,
        message: 'Phone number already registered',
      });
      return;
    }

    const agent = await Agent.create({
      name,
      email,
      password,
      phone,
      dealerName: dealerName || undefined,
    });

    const token = generateToken({
      agentId: agent._id.toString(),
      email: agent.email,
      role: agent.role,
    });

    res.status(201).json({
      success: true,
      message: 'Agent registered successfully',
      data: {
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          dealerName: agent.dealerName,
          role: agent.role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Register Error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const agent = await Agent.findOne({ email }).select('+password');

    if (!agent) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    if (!agent.isActive) {
      res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    const isPasswordValid = await agent.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = generateToken({
      agentId: agent._id.toString(),
      email: agent.email,
      role: agent.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          dealerName: agent.dealerName,
          profileImage: agent.profileImage,
          role: agent.role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const agent = await Agent.findById(req.agent?.agentId).select('-password');

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          dealerName: agent.dealerName,
          profileImage: agent.profileImage,
          role: agent.role,
          createdAt: agent.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message,
    });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, phone, dealerName } = req.body;

    const agent = await Agent.findById(req.agent?.agentId);

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    if (name) agent.name = name;
    if (phone) agent.phone = phone;
    if (dealerName !== undefined) agent.dealerName = dealerName;

    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          dealerName: agent.dealerName,
          profileImage: agent.profileImage,
        },
      },
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Phone number already in use',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message,
    });
  }
};