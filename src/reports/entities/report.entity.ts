import { User } from "../../users/entities/user.entity";

export enum ReportReason {
  FAKE_PROFILE = "FAKE_PROFILE",
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  HARASSMENT = "HARASSMENT",
  SPAM = "SPAM",
  OTHER = "OTHER",
}

export enum ReportStatus {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export class Report {
  id: string;
  reporter: User;
  reportedUser: User;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}
