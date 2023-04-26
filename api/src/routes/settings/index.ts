import { Router } from 'express';

var router = Router();

router.use('/api', require('./api'));

export default router;