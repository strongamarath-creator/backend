import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, Gender, LookingFor } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const userSafeSelect = {
  id: true,
  email: true,
  emailVerified: true,
  phoneNumber: true,
  phoneVerified: true,
  verificationStatus: true,
  
  firstName: true,
  lastName: true,
  patronymic: true,
  birthDate: true,
  gender: true,
  nationality: true,
  language: true,
  
  latitude: true,
  longitude: true,
  
  role: true,
  isBanned: true,
  messagingBlocked: true,
  callEnabled: true,
  
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  lastActiveAt: true,
  
  bio: true,
  avatarUrl: true,
  height: true,
  education: true,
  jobTitle: true,
  company: true,
  smoking: true,
  drinking: true,
  zodiac: true,
  
  lookingFor: true,
  genderPreference: true,
  
  interests: { select: { name: true } }, 
  photos: true,
  media: true,
  
  searchRadius: true,
  isGlobalSearch: true,
  ageMinPreference: true,
  ageMaxPreference: true,
  
  isPassportActive: true,
  passportLat: true,
  passportLon: true,
  
  subscriptionTier: true,
  subscriptionExpiresAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const {
      password,
      email,
      firstName,
      lastName,
      patronymic,
      birthDate,
      gender,
      phoneNumber,
      nationality,
      language,
      bio,
      height,
      education,
      jobTitle,
      company,
      smoking,
      drinking,
      zodiac,
      lookingFor,
      genderPreference,
      interests,
    } = createUserDto;

    if (!password) {
      throw new Error("Password is required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      patronymic,
      birthDate: new Date(birthDate),
      gender: gender as Gender,
      phoneNumber: phoneNumber || null,
      nationality,
      language: language || "ru",
      
      bio,
      height,
      education,
      jobTitle,
      company,
      smoking,
      drinking,
      zodiac,
      genderPreference: genderPreference as Gender,
      lookingFor: lookingFor as LookingFor[],
      
      role: "USER",
      
      interests: interests?.length ? {
        connectOrCreate: interests.map((name) => ({
          where: { name },
          create: { name },
        }))
      } : undefined,
    };

    return this.prisma.user.create({
      data,
      select: userSafeSelect,
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params || {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        select: userSafeSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
  }

  async findByIdWithPassword(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByPhone(phoneNumber: string) {
    return this.prisma.user.findUnique({ where: { phoneNumber } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.firstName !== undefined) data.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) data.lastName = updateUserDto.lastName;
    if (updateUserDto.patronymic !== undefined) data.patronymic = updateUserDto.patronymic;
    if (updateUserDto.email !== undefined) data.email = updateUserDto.email;
    if (updateUserDto.phoneNumber !== undefined) data.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.language !== undefined) data.language = updateUserDto.language;
    if (updateUserDto.nationality !== undefined) data.nationality = updateUserDto.nationality;
    
    if (updateUserDto.birthDate) {
      data.birthDate = new Date(updateUserDto.birthDate);
    }
    if (updateUserDto.gender) data.gender = updateUserDto.gender as Gender;

    if (updateUserDto.bio !== undefined) data.bio = updateUserDto.bio;
    if (updateUserDto.height !== undefined) data.height = updateUserDto.height;
    if (updateUserDto.education !== undefined) data.education = updateUserDto.education;
    if (updateUserDto.jobTitle !== undefined) data.jobTitle = updateUserDto.jobTitle;
    if (updateUserDto.company !== undefined) data.company = updateUserDto.company;
    if (updateUserDto.smoking !== undefined) data.smoking = updateUserDto.smoking;
    if (updateUserDto.drinking !== undefined) data.drinking = updateUserDto.drinking;
    if (updateUserDto.zodiac !== undefined) data.zodiac = updateUserDto.zodiac;
    if (updateUserDto.genderPreference !== undefined) data.genderPreference = updateUserDto.genderPreference as Gender;
    if (updateUserDto.lookingFor !== undefined) data.lookingFor = updateUserDto.lookingFor as LookingFor[];

    if (updateUserDto.latitude !== undefined) data.latitude = updateUserDto.latitude;
    if (updateUserDto.longitude !== undefined) data.longitude = updateUserDto.longitude;
    
    if (updateUserDto.searchRadius !== undefined) data.searchRadius = updateUserDto.searchRadius;
    if (updateUserDto.isGlobalSearch !== undefined) data.isGlobalSearch = updateUserDto.isGlobalSearch;
    if (updateUserDto.ageMinPreference !== undefined) data.ageMinPreference = updateUserDto.ageMinPreference;
    if (updateUserDto.ageMaxPreference !== undefined) data.ageMaxPreference = updateUserDto.ageMaxPreference;
    
    if (updateUserDto.isPassportActive !== undefined) data.isPassportActive = updateUserDto.isPassportActive;
    if (updateUserDto.passportLat !== undefined) data.passportLat = updateUserDto.passportLat;
    if (updateUserDto.passportLon !== undefined) data.passportLon = updateUserDto.passportLon;

    if (updateUserDto.interests) {
        data.interests = {
            set: [], 
            connectOrCreate: updateUserDto.interests.map((name) => ({
                where: { name },
                create: { name },
            }))
        };
    }

    if (updateUserDto.photos) {
      const newUrls = updateUserDto.photos;

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data,
          select: userSafeSelect,
        });

        try {
          await tx.userPhoto.findMany({
            where: { userId: id },
            select: { id: true, url: true },
          });

          // Deactivate removed
          await tx.userPhoto.updateMany({
            where: {
              userId: id,
              url: { notIn: newUrls },
            },
            data: { isActive: false },
          });

          await Promise.all(
            newUrls.map((url, index) =>
              tx.userPhoto.upsert({
                where: {
                  userId_url: { userId: id, url },
                },
                update: {
                  isActive: true,
                  order: index,
                  visibility: "PUBLIC",
                  isAvatar: updated.avatarUrl
                    ? updated.avatarUrl === url
                    : false,
                },
                create: {
                  userId: id,
                  url,
                  isActive: true,
                  order: index,
                  visibility: "PUBLIC",
                  moderationStatus: "APPROVED",
                  isAvatar: updated.avatarUrl
                    ? updated.avatarUrl === url
                    : false,
                },
              }),
            ),
          );

          if (
            updated.avatarUrl &&
            !newUrls.includes(updated.avatarUrl)
          ) {
            await tx.userPhoto.updateMany({
              where: { userId: id },
              data: { isAvatar: false },
            });
          }
        } catch {
          // ignore
        }

        return updated;
      });
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSafeSelect,
    });
  }

  async updatePassword(id: number, password: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password },
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id }, select: userSafeSelect });
  }
}
