import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.get('/match-history', analyticsController.getMatchHistory);
router.get('/stats', analyticsController.getStats);
router.get('/user-activity', analyticsController.getUserActivity);
router.get('/stats-summary', analyticsController.getStatsSummary);
router.get('/rankings', analyticsController.getUserRankings);
router.get('/activity-trends', analyticsController.getActivityTrends);
router.get('/export', analyticsController.exportAnalytics);
router.get('/position-win-rates', analyticsController.getPositionWinRates);
router.get('/merged-stats', analyticsController.getMergedStats);
router.post('/sync-json', analyticsController.syncMergedStatsJson);
router.post('/match', analyticsController.recordMatch);

export default router;
