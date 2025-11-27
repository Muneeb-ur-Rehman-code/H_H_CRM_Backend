import { Router } from "express";
import {
  getPendingApplications,
  getDailyTaskReport,
  getVisaProcess,
  getConfirmApplications
} from "../controllers/backendOfficer/backendOfficer.controller";

const router = Router();

// All routes need userId param for now
router.get("/pending/:userId", getPendingApplications);
router.get("/daily-task/:userId", getDailyTaskReport);
router.get("/visa-process/:userId", getVisaProcess);
router.get("/confirm/:userId", getConfirmApplications);

export default router;
