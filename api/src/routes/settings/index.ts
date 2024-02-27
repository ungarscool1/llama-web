import { Router } from 'express';

var router = Router();

router.use('/api', require('./api'));
router.use('/prompt', require('./prompt'));

export default router;