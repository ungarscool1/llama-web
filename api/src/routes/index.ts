import { Router, Request, Response, NextFunction } from 'express';

var router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Hello World!' });
});

router.get('/test', async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    ...req.user
  });
});

module.exports = router;