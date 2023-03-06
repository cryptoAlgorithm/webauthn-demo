module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: [
    'dotenv/config'
  ],

  reporters: [
    'default',
    [
      'jest-html-reporter', {
        'pageTitle': 'Test Report',
        'dateFormat': "UTC:yyyy-mm-dd HH:MM:ss' UTC'",
      },
    ]
  ],

  testResultsProcessor: './node_modules/jest-json-reporter',

  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,mjs,ts,tsx}',
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

  coverageReporters: ['html', 'text', 'json-summary'],
}

