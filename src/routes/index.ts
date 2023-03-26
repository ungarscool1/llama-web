import { Router, Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

var router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.render('index', {
    userProfile: {...req.oidc.user, gravatar: createHash('md5').update(req.oidc?.user?.email).digest('hex')}
  });
});

module.exports = router;