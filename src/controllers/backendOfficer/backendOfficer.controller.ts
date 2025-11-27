import { Request, Response } from "express";
import BackendOfficerProfile from "../../models/Profiles/BackendOfficerProfile.model";

// 1. Get Pending Applications
export const getPendingApplications = async (req: Request, res: Response) => {
  try {
    const profile = await BackendOfficerProfile.findOne({ userId: req.params.userId })
      .populate("assignedApplications");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const pendingApps = profile.assignedApplications.filter((app: any) => app.status === "Pending");

    res.json(pendingApps);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// 2. Get Daily Task Report
export const getDailyTaskReport = async (req: Request, res: Response) => {
  try {
    const profile = await BackendOfficerProfile.findOne({ userId: req.params.userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json({
      applicationsStartedToday: Math.floor(Math.random() * 20), // placeholder
      documentsVerified: profile.documentsProcessed,
      offersUploaded: Math.floor(Math.random() * 15),
      tasksCompleted: Math.floor((profile.documentsProcessed / (profile.workload.maximum || 20)) * 100)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// 3. Visa Process
export const getVisaProcess = async (req: Request, res: Response) => {
  try {
    const profile = await BackendOfficerProfile.findOne({ userId: req.params.userId })
      .populate("assignedApplications");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const visaApps = profile.assignedApplications.map((app: any) => ({
      name: app.studentName,
      country: app.country,
      status: app.visaStatus,
      progress: app.progress || 0,
    }));

    res.json(visaApps);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// 4. Confirm Applications
export const getConfirmApplications = async (req: Request, res: Response) => {
  try {
    const profile = await BackendOfficerProfile.findOne({ userId: req.params.userId })
      .populate("assignedApplications");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const readyToConfirm = profile.assignedApplications.filter((app: any) => app.status === "Ready");
    res.json(readyToConfirm);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
