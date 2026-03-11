import { Router } from "express";
import { API_ROUTES } from "../apiCollectionsBackend";
import { paperController } from "./controller";

const router = Router();

router.get(API_ROUTES.PAPER.GET_ALL, paperController.getAll);
router.get(API_ROUTES.PAPER.GET_BY_SN, paperController.getBySn);

export default router;
