import { Router, Request, Response, NextFunction } from 'express';

var router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: 'Get options status',
    options: {
      skipAuth: process.env.SKIP_AUTH === 'true',
      allowAlternativeBackend: process.env.ALLOW_ALTERNATIVE_COMPUTE_BACKEND === 'true',
    }
  });
});

export default router;