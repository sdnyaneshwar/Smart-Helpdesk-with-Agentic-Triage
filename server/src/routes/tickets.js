import express from 'express';
import { z } from 'zod';
import Ticket from '../models/ticket.js';
import AuditLog from '../models/auditLog.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import agentService from '../services/agentService.js'; // We'll create this next

const router = express.Router();

// Schemas
const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
  // attachments: z.array(z.string()).optional(), // Stretch: URL attachments
});

// POST /api/tickets (user)
router.post('/', authenticate(['user']), async (req, res) => {
  try {
    const data = createTicketSchema.parse(req.body);
    const ticket = new Ticket({
      ...data,
      createdBy: req.user.id,
      status: 'open',
    });
    await ticket.save();

    // Log creation
    const traceId = uuidv4();
    await new AuditLog({
      ticketId: ticket._id,
      traceId,
      actor: 'user',
      action: 'TICKET_CREATED',
      meta: { userId: req.user.id },
    }).save();

    // Enqueue triage
    agentService.enqueueTriage(ticket._id, traceId);

    res.status(201).json(ticket);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tickets (filter by status/my tickets)
router.get('/', authenticate(), async (req, res) => {
  try {
    const { status, myTickets } = req.query;
    let query = {};
    if (status) query.status = status;
    // if (myTickets === 'true' && req.user.role === 'user') {
    //   query.createdBy = req.user.id;
    // } else if (req.user.role === 'agent') {
    //   query.assignee = req.user.id;
    // }
    const tickets = await Ticket.find(query).populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tickets/:id
router.get('/:id', authenticate(), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignee', 'name')
      .populate('agentSuggestionId');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    // Role check: user owns it or agent/admin
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tickets/:id/reply (agent) - Also updates status
router.post('/:id/reply', authenticate(['agent']), async (req, res) => {
  try {
    const { reply, status } = z.object({ reply: z.string().min(1), status: z.enum(['resolved', 'closed']).optional() }).parse(req.body);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Here, we'd append reply to a conversation thread; for simplicity, update description or use meta
    ticket.description += `\n\nAgent Reply: ${reply}`; // Placeholder; better to add a replies array in model if time
    if (status) ticket.status = status;
    await ticket.save();

    // Log
    await new AuditLog({
      ticketId: ticket._id,
      traceId: uuidv4(),
      actor: 'agent',
      action: 'REPLY_SENT',
      meta: { reply, agentId: req.user.id },
    }).save();

    res.json(ticket);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tickets/:id/assign (admin/agent)
router.post('/:id/assign', authenticate(['admin', 'agent']), async (req, res) => {
  try {
    const { assigneeId } = z.object({ assigneeId: z.string() }).parse(req.body);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    ticket.assignee = assigneeId;
    ticket.status = 'waiting_human';
    await ticket.save();

    // Log
    await new AuditLog({
      ticketId: ticket._id,
      traceId: uuidv4(),
      actor: 'agent',
      action: 'ASSIGNED_TO_HUMAN',
      meta: { assigneeId },
    }).save();

    res.json(ticket);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;