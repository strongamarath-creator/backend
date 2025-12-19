# Force cleanup of conflict containers
Write-Host "Очистка контейнеров и томов Dating App..."

# Stop specific containers if running
docker stop dating_app_db dating_app_redis dating_app_minio 2>$null
docker rm dating_app_db dating_app_redis dating_app_minio 2>$null

# Remove volumes (Caution: Deletes Data!)
# We prompt user or assume force if this script is run explicitly for cleaning.
$title = "Внимание / Warning"
$message = "Вы собираетесь удалить ВСЕ данные базы данных (пользователи, настройки). Продолжить? / Do you want to delete ALL database data?"
$yes = New-Object System.Management.Automation.Host.ChoiceDescription "&Yes", "Да / Yes"
$no = New-Object System.Management.Automation.Host.ChoiceDescription "&No", "Нет / No"
$options = [System.Management.Automation.Host.ChoiceDescription[]]($yes, $no)

$result = $host.ui.PromptForChoice($title, $message, $options, 1) 

if ($result -eq 0) {
    Write-Host "Удаление томов..."
    docker volume rm itog_likes-love_mini_postgres_data itog_likes-love_mini_redis_data itog_likes-love_mini_minio_data 2>$null
    # Also try generic names if compose project name varied
    docker volume rm dating_app_postgres_data dating_app_redis_data dating_app_minio_data 2>$null
    # Also try current repo-derived compose names (e.g. when project folder is 'll')
    docker volume rm ll_postgres_data ll_redis_data ll_minio_data 2>$null
    Write-Host "Очистка завершена. Теперь можно запустить 'docker-compose up -d'"
} else {
    Write-Host "Удаление томов отменено. Только контейнеры были остановлены."
}
