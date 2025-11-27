import { Router } from "express";
import ManagerController from "../controllers/manager/manager.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { UserRole } from "../types/user.types";

const router = Router();

// Auth + Role
router.use(protect);
router.use(authorize(UserRole.MANAGER));

// GET own profile
router.get("/profile", ManagerController.getProfile);

// UPDATE own profile
router.put("/profile", ManagerController.updateProfile);

// GET team members
router.get("/team-members", ManagerController.getTeamMembers);

// ADD team member
router.post("/team-members", ManagerController.addTeamMember);

// REMOVE team member
router.delete("/team-members/:userId", ManagerController.removeTeamMember);

export default router;
