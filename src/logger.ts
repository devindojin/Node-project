import * as winston from 'winston'
const DailyRotateFile = require('winston-daily-rotate-file')

export abstract class Logger {
	public static logger: winston.Logger

	public static initializeLogger() {
		const runningInProduction = process.env.NODE_ENV === 'production'

		const loggingFormats = [
			winston.format.timestamp({
				format: 'YYYY-MM-DD HH:mm:ss'
			}),
			winston.format.errors({ stack: true })
		]

		loggingFormats.push(
			runningInProduction ? 
				winston.format.json() :
				winston.format.cli()
		)

		Logger.logger = winston.createLogger({
			level: 'http',
			format: winston.format.combine(...loggingFormats),
			defaultMeta: { service: 'rezrvapp-api' },
			transports: [
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.colorize({
							all: true
						})
					)
				})
			]
		})

		if (runningInProduction) {
			Logger.logger.add(
				new (DailyRotateFile)({
					filename: 'logs/rezrvapp-api-%DATE%.log',
					datePattern: 'YYYY-MM-DD-HH',
					maxSize: '20m',
					maxFiles: '10d'
				})
			)
		}
	}
}