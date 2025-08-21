module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['./jest.setup.js'],
     transform: {
       '^.+\\.(js|jsx)$': 'babel-jest',
     },
   };