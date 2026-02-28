import { Router } from 'express';
import multer from 'multer';
import * as dataExportController from '../controllers/dataExportController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/all', dataExportController.exportAllData);
router.get('/matches', dataExportController.exportMatchesData);
router.post('/import', upload.single('file'), dataExportController.importData);
router.post(
  '/validate',
  upload.single('file'),
  dataExportController.validateImportFile
);

export default router;
