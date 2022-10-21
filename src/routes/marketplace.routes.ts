import { Router } from "express"
import { BusinessesService } from "../services/businesses.service"
import { IdValidator } from "../validators/id.validator"
import { CitiesLookUp } from '../data/citiesList';
import {BusinessTypesLookUp } from '../data/businessTypes'
import { BusinessTypesService } from "../services/business-types.service";


export abstract class MarketplaceRoutes {
	public static marketplacePath = '/marketplace'

	public static addMobileRoutes(): Router {
		const router = Router()
		MarketplaceRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {
		//Get 1 Business
		router.get('/business/:businessId', async (req, res, next) => {
			try {
				res.json(await BusinessesService.getBySlug(req.params.businessId))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		//Get all businesses by City and Country
		router.get('/businesses', async (req, res, next) => {
			const businessTypeParam = req.query.category as string
			const countryParam = req.query.country as string
			const cityParam = req.query.city as string
			try {
				if (countryParam) {
					if (businessTypeParam) {
						console.log(businessTypeParam);
						
						var resp = await BusinessesService.getAll(cityParam, countryParam, businessTypeParam)
						res.json(resp)
					} else {
						//show all businesses
						var resp = await BusinessesService.getAll(cityParam, countryParam)
						res.json(resp)
					}
					
				} 
				else {
					res.status(400).send()
					return
				}
			} catch (err) {
				next(err)
				return
			}
		})
		//Get all Types
		router.get('/types', async (req, res, next) => {
			try {
				res.json(BusinessTypesLookUp)
			} catch (err) {
				next(err)
				return
			}
		})
		//Get all Cities
		router.get('/locations', async (req, res, next) => {
			try {
				res.json(CitiesLookUp)
			} catch (err) {
				next(err)
				return
			}
		})
		

	}
}
