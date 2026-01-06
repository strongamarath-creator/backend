import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserProfileDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber?: string | null;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  patronymic?: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  birthDate: string;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  language: string;

  @ApiPropertyOptional({ nullable: true })
  nationality?: string | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  longitude?: number | null;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt: string;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  lastLoginAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio?: string | null;

  @ApiProperty({ type: [String] })
  photos: string[];

  @ApiProperty({ type: [String] })
  videos: string[];

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ type: [String] })
  interests: string[];

  @ApiPropertyOptional({ nullable: true, type: Number })
  height?: number | null;

  @ApiPropertyOptional({ nullable: true })
  education?: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  company?: string | null;

  @ApiPropertyOptional({ nullable: true })
  smoking?: string | null;

  @ApiPropertyOptional({ nullable: true })
  drinking?: string | null;

  @ApiPropertyOptional({ nullable: true })
  zodiac?: string | null;

  @ApiPropertyOptional({ nullable: true, type: [String] })
  lookingFor?: string[] | null;

  @ApiPropertyOptional({ nullable: true })
  genderPreference?: string | null;

  @ApiProperty({ type: Boolean })
  isBanned: boolean;

  @ApiProperty({ type: Boolean })
  messagingBlocked: boolean;

  @ApiProperty({ type: Boolean })
  callEnabled: boolean;

  // Search Preferences
  @ApiProperty()
  searchRadius: number;

  @ApiProperty()
  isGlobalSearch: boolean;

  @ApiProperty()
  ageMinPreference: number;

  @ApiProperty()
  ageMaxPreference: number;

  // Passport
  @ApiProperty()
  isPassportActive: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  passportLat?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  passportLon?: number | null;

  // Subscription
  @ApiProperty()
  subscriptionTier: string;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  subscriptionExpiresAt?: string | null;

  @ApiProperty()
  verificationStatus: string;
}
