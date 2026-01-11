import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import requestIp from "request-ip";
import geoip from "geoip-lite";

const prisma = new PrismaClient();

// Интерфейс для расширения типа Request, так как у нас есть middleware авторизации
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: unknown;
  };
}

// 1. Обновление координат (GPS)
export const updateCoordinates = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user || typeof authReq.user.id !== "number") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = authReq.user.id;
    let { latitude, longitude } = req.body;

    // FALLBACK: Если координат нет, пробуем определить по IP
    if (!latitude || !longitude) {
      const clientIp = requestIp.getClientIp(req);
      const geo = geoip.lookup(clientIp || "");

      if (geo && geo.ll) {
        latitude = geo.ll[0];
        longitude = geo.ll[1];
      }
    }

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Coordinates could not be determined" });
    }

    // Обновляем координаты в модели User (согласно schema.prisma)
    await prisma.user.update({
      where: { id: userId },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updatedAt: new Date(),
      },
    });

    return res.json({ success: true, message: "Location updated" });
  } catch (error) {
    console.error("Update coordinates error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 2. Обновление настроек поиска
export const updateSearchSettings = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user || typeof authReq.user.id !== "number") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = authReq.user.id;

    // Извлекаем поля, соответствующие schema.prisma
    const {
      searchRadius,
      isGlobalSearch,
      ageMin, // Маппим на ageMinPreference
      ageMax, // Маппим на ageMaxPreference
      isPassportActive,
      passportLat,
      passportLon,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Настройки радиуса и глобального поиска
        searchRadius: searchRadius ? parseInt(searchRadius) : undefined,
        isGlobalSearch:
          isGlobalSearch !== undefined ? Boolean(isGlobalSearch) : undefined,

        // Возрастные предпочтения
        ageMinPreference: ageMin ? parseInt(ageMin) : undefined,
        ageMaxPreference: ageMax ? parseInt(ageMax) : undefined,

        // Настройки Passport Mode (виртуальная локация)
        isPassportActive:
          isPassportActive !== undefined
            ? Boolean(isPassportActive)
            : undefined,
        passportLat: passportLat ? parseFloat(passportLat) : undefined,
        passportLon: passportLon ? parseFloat(passportLon) : undefined,
      },
    });

    return res.json({ success: true, settings: updatedUser });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({ message: "Error updating settings" });
  }
};
