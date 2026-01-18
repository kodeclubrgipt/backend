import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './auth';

// Admin email addresses
const ADMIN_EMAILS = [
  'jiwanji6756@gmail.com',
  'kodeclubrgipt@gmail.com',
];

export const isAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
      return;
    }

    // Check if user email is in admin list
    const userEmail = authReq.user.email.toLowerCase();
    const isAdminUser = ADMIN_EMAILS.some(
      adminEmail => adminEmail.toLowerCase() === userEmail
    );

    // Also check isAdmin flag in database (for flexibility)
    if (!isAdminUser && !authReq.user.isAdmin) {
      res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error checking admin status' 
    });
  }
};
