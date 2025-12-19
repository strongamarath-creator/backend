export class User {
  id: number;
  email: string;
  emailVerified: Date | null;
  phoneNumber: string | null;
  phoneVerified: Date | null;
  password?: string | null;
  verificationStatus: string;
  image: string | null;
  firstName: string | null;
  lastName: string | null;
  patronymic: string | null;
  birthDate: Date;
  gender: string;
  nationality: string | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  
  bio: string | null;
  avatarUrl: string | null;
  height: number | null;
  education: string | null;
  jobTitle: string | null;
  company: string | null;
  smoking: string | null;
  drinking: string | null;
  zodiac: string | null;
  genderPreference: string;

  // Permissions
  role: string;
  isBanned: boolean;
  messagingBlocked: boolean;
  callEnabled: boolean;

  // Geo & Search
  latitude: number | null;
  longitude: number | null;
  
  searchRadius: number;
  isGlobalSearch: boolean;
  ageMinPreference: number;
  ageMaxPreference: number;

  isPassportActive: boolean;
  passportLat: number | null;
  passportLon: number | null;

  // Subscription
  subscriptionTier: string;
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
}
