import pino from 'pino';

// Export a shared pino instance for use in server code
const parentLogger = pino({
//  level: process.env.NODE_ENV === 'development' ? 'trace' : 'info',
  level: 'trace', // Using trace for now to debug issues in prod hosting
  transport: {
    target: 'pino-pretty'
  }
})

const createLogger = (subsystem: string): pino.Logger => parentLogger.child({ subsystem })

export default createLogger
