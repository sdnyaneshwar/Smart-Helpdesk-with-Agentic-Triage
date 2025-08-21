import '@testing-library/jest-dom';
   import { setupServer } from 'msw/node';
   import { rest } from 'msw';

   const server = setupServer();
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());