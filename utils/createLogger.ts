import pino from 'pino';

// const testTransport = pino.transport({
//   target: 'pino/file',
//   options: {
//     destination: './test.txt'
//   }
// })

// Export a shared pino instance for use in server code
const parentLogger = pino({
  // Using trace for now to debug issues in prod hosting
  level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty'
  }
})

const createLogger = (subsystem: string): pino.Logger => parentLogger.child({ subsystem })

export default createLogger
