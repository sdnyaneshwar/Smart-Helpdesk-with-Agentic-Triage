import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/user.js';
import Article from './models/article.js';
import Ticket from './models/ticket.js';
import Config from './models/config.js';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
mongoose
  .connect(process.env.MONGO_URI, { dbName: 'helpdesk' })
    // Clear existing data
    await User.deleteMany({});
    await Article.deleteMany({});
    await Ticket.deleteMany({});
    await Config.deleteMany({});

    // Seed Users
    const users = [
      { name: 'Admin User', email: 'admin@example.com', password_hash: await bcrypt.hash('password123', 10), role: 'admin' },
      { name: 'Agent User', email: 'agent@example.com', password_hash: await bcrypt.hash('password123', 10), role: 'agent' },
      { name: 'Regular User', email: 'user@example.com', password_hash: await bcrypt.hash('password123', 10), role: 'user' },
    ];
    const createdUsers = await User.insertMany(users);

    // Seed KB Articles
    const articles = [
      { title: 'How to update payment method', body: 'Go to settings > billing > update card.', tags: ['billing', 'payments'], status: 'published' },
      { title: 'Troubleshooting 500 errors', body: 'Check server logs and restart the app.', tags: ['tech', 'errors'], status: 'published' },
      { title: 'Tracking your shipment', body: 'Visit the tracking page with your order ID.', tags: ['shipping', 'delivery'], status: 'published' },
    ];
    const createdArticles = await Article.insertMany(articles);

    // Seed Tickets
    const tickets = [
      {
        title: 'Refund for double charge',
        description: 'I was charged twice for order #1234',
        category: 'other',
        createdBy: createdUsers[2]._id, // Regular User
      },
      {
        title: 'App shows 500 on login',
        description: 'Stack trace mentions auth module',
        category: 'other',
        createdBy: createdUsers[2]._id,
      },
      {
        title: 'Where is my package?',
        description: 'Shipment delayed 5 days',
        category: 'other',
        createdBy: createdUsers[2]._id,
      },
    ];
    await Ticket.insertMany(tickets);

    // Seed Config
    await new Config({
      autoCloseEnabled: true,
      confidenceThreshold: 0.78,
      slaHours: 24,
    }).save();

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();