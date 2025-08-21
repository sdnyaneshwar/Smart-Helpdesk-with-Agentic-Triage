import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { rest } from 'msw';
   import { setupServer } from 'msw/node';
   import TicketList from '../pages/TicketList';
   import { useAuthStore } from '../store/authStore';
   import { MemoryRouter } from 'react-router-dom';

   const server = setupServer();

   jest.mock('../store/authStore', () => ({
     useAuthStore: jest.fn(),
   }));

   describe('TicketList', () => {
     beforeAll(() => server.listen());
     afterEach(() => server.resetHandlers());
     afterAll(() => server.close());

     const mockUser = { id: '1', role: 'agent' };
     const mockTickets = [
       { _id: '1', title: 'Test Ticket', status: 'waiting_human', category: 'billing', createdBy: { name: 'User' } },
     ];

     beforeEach(() => {
       useAuthStore.mockReturnValue({ user: mockUser });
       localStorage.setItem('token', 'mock-token');
     });

     it('renders tickets for agent', async () => {
       server.use(
         rest.get('/api/tickets', (req, res, ctx) => {
           return res(ctx.json({ tickets: mockTickets, total: 1 }));
         })
       );

       render(
         <MemoryRouter>
           <TicketList />
         </MemoryRouter>
       );

       await waitFor(() => {
         expect(screen.getByText('Test Ticket')).toBeInTheDocument();
         expect(screen.getByText('Status: waiting_human')).toBeInTheDocument();
         expect(screen.getByText('Category: billing')).toBeInTheDocument();
       });
     });

     it('allows agent to assign unassigned ticket', async () => {
       const mockUnassigned = [{ _id: '2', title: 'Unassigned', status: 'waiting_human', createdBy: { name: 'User' } }];
       server.use(
         rest.get('/api/tickets/unassigned', (req, res, ctx) => {
           return res(ctx.json({ tickets: mockUnassigned, total: 1 }));
         }),
         rest.post('/api/tickets/:id/assign', (req, res, ctx) => {
           return res(ctx.json({ _id: '2', assignee: '1', status: 'waiting_human' }));
         })
       );

       render(
         <MemoryRouter>
           <TicketList />
         </MemoryRouter>
       );

       fireEvent.click(screen.getByText('Unassigned Tickets'));
       await waitFor(() => {
         expect(screen.getByText('Unassigned')).toBeInTheDocument();
       });

       fireEvent.click(screen.getByText('Assign to Me'));
       await waitFor(() => {
         expect(screen.queryByText('Unassigned')).not.toBeInTheDocument();
       });
     });
   });