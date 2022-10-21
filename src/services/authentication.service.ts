import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'

import { Credentials } from "../types/credentials"
import { Tokens } from "../types/tokens"
import { InvalidTokenError } from '../errors/invalid-token.error'
import { Logger } from '../logger'
import { BusinessesService } from "./businesses.service"
import { Business } from "../types/business"

export abstract class AuthenticationService {
	
	public static async authenticate(credentials: Credentials): Promise<Tokens> {
		const businessDoc = await BusinessesService.getByEmail(credentials.email)

		if (businessDoc == null) {
			return null
		}

		try {
			if (await bcrypt.compare(credentials.password, businessDoc.password) == false) {
				return null
			}
		} catch (err) {
			Logger.logger.error("Failed to compare passwords", err)
			throw new Error("Failed to compare passwords")
		}

		try {
			return await AuthenticationService.generateTokens(businessDoc._id.toString())
		} catch (err) {
			Logger.logger.error("Failed to generate tokens", err)
			throw new Error("Failed to generate tokens")
		}
	}

	public static async refreshToken(token: string): Promise<Tokens> {
		let payload: object
		try {
			payload = await AuthenticationService.getTokenPayload(token)
		} catch (err) {
			Logger.logger.error("Invalid refresh token", err)
			throw new InvalidTokenError("Invalid refresh token")
		}

		// This should be checking db if the user is allowed to regenerate token
		if (!(payload as any).isRefreshToken) {
			Logger.logger.error("Invalid refresh token - doesn't contain 'isRefreshToken' flag")
			throw new InvalidTokenError("Invalid refresh token - doesn't contain 'isRefreshToken' flag")
		}

		const operatorId: string = (payload as any).sub

		let business: Business
		business = await BusinessesService.getById(operatorId, false)

		if (business == null) {
			Logger.logger.error(`Invalid refresh token - operator ${operatorId} does not exist`)
			throw new InvalidTokenError(`Invalid refresh token - operator ${operatorId} does not exist`)
		}

		try {
			let tokens = await AuthenticationService.generateToken(operatorId)
			delete tokens.refreshToken
			return tokens
		} catch (err) {
			Logger.logger.error("Failed to generate token", err)
			throw new Error("Failed to generate token")
		}
	}

	private static async getTokenPayload(token: string): Promise<object> {
		return new Promise((resolve, reject) => {
			jwt.verify(
				token,
				process.env.JWT_SECRET,
				(err, payload) => {
					if (err) {
						return reject()
					}
					resolve(payload as object)
				})
		})
	}

	public static async getUserIdFromToken(token: string): Promise<string> {
		const payload = await AuthenticationService.getTokenPayload(token)
		return new Promise((resolve, reject) => {
			if ((payload as any).sub == null || (payload as any).isRefreshToken) {
				return reject()
			}
			resolve((payload as any).sub)
		})
	}

	private static async generateToken(userId: string): Promise<Tokens> {
		return new Promise<Tokens>((resolve, reject) => {
			jwt.sign(
				{},
				process.env.JWT_SECRET,
				{
					subject: userId,
					expiresIn: "30m"
				},
				(error, t) => {
					if (error) {
						reject()
						return
					}
					resolve(new Tokens(t, null))
				})
		})
	}

	private static async generateTokens(userId: string): Promise<Tokens> {
		return new Promise<Tokens>((resolve, reject) => {
			jwt.sign(
				{},
				process.env.JWT_SECRET,
				{
					subject: userId,
					expiresIn: "30m"
				},
				(error, token) => {
					if (error) {
						reject()
						return
					}
					jwt.sign(
						{
							isRefreshToken: true,
						},
						process.env.JWT_SECRET,
						{
							subject: userId,
							expiresIn: "30 days"
						},
						(error, refreshToken) => {
							if (error) {
								reject()
								return
							}
							resolve(new Tokens(token, refreshToken))
						})
				})
		})
	}
}