import { PrismaClient, Gender, ConfigType } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Создаем админа
    const adminPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            password: adminPassword,
            firstName: "Admin",
            lastName: "User",
            birthDate: new Date("1990-01-01"),
            
            
            gender: Gender.MALE,   // ИСПРАВЛЕНИЕ 1: Gender должен соответствовать enum (MALE или FEMALE)
            
            genderPreference: Gender.FEMALE,   // ИСПРАВЛЕНИЕ 2: Добавлено обязательное поле genderPreference

            role: "ADMIN",
            
            // ИСПРАВЛЕНИЕ 3: Поля videos нет в схеме, используем media (или убираем, если пустое)
            media: {
                create: [] 
            },
            photos: {
                create: []
            },
            // relations обычно создаются через вложенные create или connect, пустые массивы [] работают для update, но для create лучше использовать явный синтаксис или опустить, если нет данных.
        },
    });

    console.log("Admin user processed");

    // 2. Пример SystemConfig
    await prisma.systemConfig.upsert({
        where: { key: "site_name" },
        update: {},
        create: {
            key: "site_name",
            value: "Likes‑love.com",
            description: "Название сайта",
            
            // ИСПРАВЛЕНИЕ 4: Используем значение из Enum (Upper Case)
            type: ConfigType.STRING, 
            
            isPublic: true,
        },
    });

    console.log("SystemConfig processed");

    // 3. Пример PageConfig
    await prisma.pageConfig.upsert({
        where: { route: "/" },
        update: {},
        create: {
            route: "/",
            title: "Главная",
            description: "Добро пожаловать на Likes‑love.com",
            isEnabled: true,
        },
    });

    console.log("PageConfig processed");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });