const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: [
    'dotenv/config'
  ],

  reporters: [
    'default',
    ['jest-html-reporter', {
      'pageTitle': 'Test Report'
    }]
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!./coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // this setting is required for jest config using config files!
  coverageProvider: 'v8',

  coverageReporters: ['html', 'json-summary'],
};

module.exports = config;
