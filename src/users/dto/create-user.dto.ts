import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "P@ssw0rd" })
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiProperty({ example: "Ivan" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Petrov" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: "Ivanovich" })
  @IsOptional()
  @IsString()
  patronymic?: string;

  @ApiProperty({ example: "1995-01-31" })
  @IsNotEmpty()
  birthDate: string | Date;

  @ApiProperty({ example: "MALE" })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional({ example: "+15551234567" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "RU" })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: "ru" })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: "Bio..." })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: "University" })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ example: "Engineer" })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: "MyCompany" })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: "NO" })
  @IsOptional()
  @IsString()
  smoking?: string;

  @ApiPropertyOptional({ example: "SOCIALLY" })
  @IsOptional()
  @IsString()
  drinking?: string;

  @ApiPropertyOptional({ example: "Leo" })
  @IsOptional()
  @IsString()
  zodiac?: string;

  @ApiPropertyOptional({ type: [String], example: ["RELATIONSHIP"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lookingFor?: string[];

  @ApiPropertyOptional({ example: "FEMALE" })
  @IsOptional()
  @IsString()
  genderPreference?: string;

  @ApiPropertyOptional({ type: [String], example: ["music", "travel"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
