import express from 'express';
import AuditLog from '../models/auditLog.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/tickets/:id/audit
router.get('/:id/audit', authenticate(), async (req, res) => {
  console.log("Fetching audit logs for ticket:", req.params.id);
  try {
    const logs = await AuditLog.find({ ticketId: req.params.id }).sort({ timestamp: 1 });
    console.log("Audit logs fetched:", logs);
    
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;