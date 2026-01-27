import { Router } from "express";
// Импортируем твои функции из контроллера
import { updateCoordinates, updateSearchSettings } from "./user-geo.controller";
// Импортируем middleware авторизации (название может отличаться у тебя)
// import { isAuthenticated } from '../../middlewares/auth';

const router = Router();

// --- СУЩЕСТВУЮЩИЕ РОУТЫ (если были) ---
// router.get('/profile', ...);

// --- НОВЫЕ ГЕО РОУТЫ ---

// 1. Принимаем координаты (GPS)
// POST /api/users/geo
// Добавь middleware авторизации перед обработчиком, если нужно
router.post("/geo", updateCoordinates);

// 2. Сохраняем настройки ползунка
// PATCH /api/users/settings/search
router.patch("/settings/search", updateSearchSettings);

export default router;
