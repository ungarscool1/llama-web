import { Router, Request, Response, NextFunction } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { createHash } from 'crypto';

var router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.render('index', {
    userProfile: {...req.oidc.user, gravatar: createHash('md5').update(req.oidc?.user?.email).digest('hex')},
  });
});

router.get('/profile', requiresAuth(), function (req: Request, res: Response, next: NextFunction) {
  res.send(JSON.stringify(req.oidc.user));
});

module.exports = router;