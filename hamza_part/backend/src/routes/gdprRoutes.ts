import { Router } from 'express';
import * as gdprController from '../controllers/gdprController';

const router = Router();

router.post('/request-data', gdprController.requestUserData);
router.get('/download-data', gdprController.downloadUserData);
router.post('/request-deletion', gdprController.requestAccountDeletion);
router.get('/confirm-deletion/:token', gdprController.confirmAccountDeletion);
router.get('/pending-requests', gdprController.listDataRequests);
router.get('/deletion-status', gdprController.getAccountDeletionStatus);

export default router;
