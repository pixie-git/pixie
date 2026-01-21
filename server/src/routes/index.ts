import express, { Router } from "express"
import apiRoutes from "./api"

const router: Router = express.Router()

router.use("/", apiRoutes)

export default router
