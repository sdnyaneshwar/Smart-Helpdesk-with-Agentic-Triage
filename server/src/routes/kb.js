import express from 'express';
import { z } from 'zod';
import Article from '../models/article.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Schemas
const articleSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

// GET /api/kb?query=... (search, public but filtered to published)
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = query
      ? { $text: { $search: query }, status: 'published' }
      : { status: 'published' };
    const articles = await Article.find(searchQuery).sort({ updatedAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/kb (admin)
router.post('/', authenticate(['admin']), async (req, res) => {
  try {
    const data = articleSchema.parse(req.body);
    const article = new Article(data);
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/kb/:id (admin)
router.put('/:id', authenticate(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const data = articleSchema.partial().parse(req.body); // Partial for updates
    const article = await Article.findByIdAndUpdate(id, data, { new: true });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/kb/:id (admin)
router.delete('/:id', authenticate(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;