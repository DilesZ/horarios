module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/horarios/'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
