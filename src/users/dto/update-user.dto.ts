import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  patronymic?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  education?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  smoking?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  drinking?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  zodiac?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lookingFor?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  genderPreference?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  birthDate?: string;
  
  // Search Preferences
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  searchRadius?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isGlobalSearch?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(18)
  ageMinPreference?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Max(99)
  ageMaxPreference?: number;
  
  // Passport (Virtual Location)
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPassportActive?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  passportLat?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  passportLon?: number;
}
