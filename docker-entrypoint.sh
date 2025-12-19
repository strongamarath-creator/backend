#!/bin/sh

# Остановка скрипта при любой ошибке
set -e

echo "🚀 Starting deployment script..."

# 1. (Опционально) Ждем пока БД будет готова (если используешь pg_isready)
# echo "Waiting for database..."
# ./wait-for-it.sh db:5432

# 2. Накатываем миграции Prisma
# Важно: используем 'migrate deploy', а не 'dev', для продакшена/контейнеров
echo "📦 Running database migrations..."
npx prisma migrate deploy

# 3. (Опционально) Запускаем сиды (начальные данные)
# echo "🌱 Seeding database..."
# npx prisma db seed

# 4. Запускаем само приложение
echo "⚡ Starting application..."
# Используй команду запуска твоего проекта (например, npm start, node dist/main, и т.д.)
exec "$@"