// import express from 'express';
// import { z } from 'zod';
// import Ticket from '../models/ticket.js';
// import AuditLog from '../models/auditLog.js';
// import { authenticate } from '../middlewares/authMiddleware.js';
// import { v4 as uuidv4 } from 'uuid';
// import agentService from '../services/agentService.js';

// const router = express.Router();

// // Schemas
// const createTicketSchema = z.object({
//   title: z.string().min(1),
//   description: z.string().min(1),
//   category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
// });

// // GET /api/tickets (filter by status/my tickets, add pagination)
// router.get('/', authenticate(), async (req, res) => {
//   console.log('Fetching tickets with params:', req.query);
//   try {
//     const { status, myTickets, page = 1, limit = 10 } = req.query;
//     let query = {};
//     console.log(status, myTickets);
    
//     if (status) query.status = status;
//     if (myTickets === 'true' && req.user.role === 'user') {
//       query.createdBy = req.user.id;
//     } else if (req.user.role === 'agent') {
//       query.assignee = req.user.id;
//     }
//     console.log("11111111111111");
    
//     const tickets = await Ticket.find(query)
//       .populate('createdBy', 'name')
//       .sort({ createdAt: -1 })
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .limit(parseInt(limit));
//       console.log("22222222222222222");
      
//     const total = await Ticket.countDocuments(query);
//     console.log("33333333333333333");
//     res.json({ tickets, total, page: parseInt(page), limit: parseInt(limit) });
//   } catch (err) {
//     console.error({ error: err.message, stack: err.stack, userId: req.user?.id });
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // ... (rest of the routes unchanged)
// router.post('/', authenticate(['user']), async (req, res) => {
//   try {
//     const data = createTicketSchema.parse(req.body);
//     const ticket = new Ticket({
//       ...data,
//       createdBy: req.user.id,
//       status: 'open',
//     });
//     await ticket.save();

//     const traceId = uuidv4();
//     await new AuditLog({
//       ticketId: ticket._id,
//       traceId,
//       actor: 'user',
//       action: 'TICKET_CREATED',
//       meta: { userId: req.user.id },
//     }).save();

//     agentService.enqueueTriage(ticket._id, traceId);

//     res.status(201).json(ticket);
//   } catch (err) {
//     if (err instanceof z.ZodError) {
//       return res.status(400).json({ error: err.errors });
//     }
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.get('/:id', authenticate(), async (req, res) => {
//   console.log("Fetching ticket:", req.params.id);
//   try {
//     const ticket = await Ticket.findById(req.params.id);
//     if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
//     if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user.id) {
//       return res.status(403).json({ error: 'Unauthorized' });
//     }
//     res.json(ticket);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/:id/reply', authenticate(['agent']), async (req, res) => {
//   try {
//     const { reply, status } = z.object({ reply: z.string().min(1), status: z.enum(['resolved', 'closed']).optional() }).parse(req.body);
//     const ticket = await Ticket.findById(req.params.id);
//     if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

//     ticket.description += `\n\nAgent Reply: ${reply}`;
//     if (status) ticket.status = status;
//     await ticket.save();

//     await new AuditLog({
//       ticketId: ticket._id,
//       traceId: uuidv4(),
//       actor: 'agent',
//       action: 'REPLY_SENT',
//       meta: { reply, agentId: req.user.id },
//     }).save();

//     res.json(ticket);
//   } catch (err) {
//     if (err instanceof z.ZodError) {
//       return res.status(400).json({ error: err.errors });
//     }
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/:id/assign', authenticate(['admin', 'agent']), async (req, res) => {
//   try {
//     const { assigneeId } = z.object({ assigneeId: z.string() }).parse(req.body);
//     const ticket = await Ticket.findById(req.params.id);
//     if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
//     ticket.assignee = assigneeId;
//     ticket.status = 'waiting_human';
//     await ticket.save();

//     await new AuditLog({
//       ticketId: ticket._id,
//       traceId: uuidv4(),
//       actor: 'agent',
//       action: 'ASSIGNED_TO_HUMAN',
//       meta: { assigneeId },
//     }).save();

//     res.json(ticket);
//   } catch (err) {
//     if (err instanceof z.ZodError) {
//       return res.status(400).json({ error: err.errors });
//     }
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// export default router;

import express from 'express';
import { z } from 'zod';
import Ticket from '../models/ticket.js';
import AuditLog from '../models/auditLog.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import agentService from '../services/agentService.js';

const router = express.Router();

// Schemas
const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
});

// GET /api/tickets (with pagination)
router.get('/', authenticate(), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, myTickets } = z
      .object({
        page: z.string().optional().transform(val => parseInt(val) || 1),
        limit: z.string().optional().transform(val => parseInt(val) || 10),
        status: z.enum(['open', 'triaged', 'waiting_human', 'resolved', 'closed']).optional(),
        myTickets: z.string().optional().transform(val => val === 'true'),
      })
      .parse(req.query);

    let query = {};
    if (status) query.status = status;
    if (myTickets && req.user.role === 'user') {
      query.createdBy = req.user.id;
    } else if (req.user.role === 'agent') {
      query.assignee = req.user.id;
    }

    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'name')
        .populate('assignee', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query),
    ]);

    res.json({ tickets, total });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tickets/unassigned (for agents to see unassigned waiting_human tickets)
router.get('/unassigned', authenticate(['agent']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = z
      .object({
        page: z.string().optional().transform(val => parseInt(val) || 1),
        limit: z.string().optional().transform(val => parseInt(val) || 10),
      })
      .parse(req.query);

    const skip = (page - 1) * limit;
    const query = { status: 'waiting_human'};

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query),
    ]);
    console.log(tickets, total);
    
    res.json({ tickets, total });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
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

// GET /api/tickets/:id
router.get('/:id', authenticate(), async (req, res) => {
  console.log("Fetching ticket:", req.params.id);
  
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignee', 'name')
      .populate('agentSuggestionId');
    //console.log("Ticket fetched:", ticket);


    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tickets/:id/reply (agent)
router.post('/:id/reply', authenticate(['agent']), async (req, res) => {
  try {
    const { reply, status } = z.object({
      reply: z.string().min(1),
      status: z.enum(['resolved', 'closed']).optional(),
    }).parse(req.body);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.assignee?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.description += `\n\nAgent Reply: ${reply}`;
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

// POST /api/tickets/:id/assign (admin or agent self-assign)
router.post('/:id/assign', authenticate(['admin', 'agent']), async (req, res) => {
  try {
    const { assigneeId } = z.object({
      assigneeId: z.string().optional(),
    }).parse(req.body);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role === 'agent' && assigneeId && assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Agents can only self-assign' });
    }

    ticket.assignee = assigneeId || req.user.id; // Agent self-assigns if no assigneeId
    ticket.status = 'waiting_human';
    await ticket.save();

    // Log
    await new AuditLog({
      ticketId: ticket._id,
      traceId: uuidv4(),
      actor: 'agent',
      action: 'ASSIGNED_TO_HUMAN',
      meta: { assigneeId: ticket.assignee },
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