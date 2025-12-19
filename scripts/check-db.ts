
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Database ---');

    const userCount = await prisma.user.count();
    console.log(`Total Users: ${userCount}`);

    const lastUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
    });
    console.log('Last User:', lastUser ? `${lastUser.email} (ID: ${lastUser.id})` : 'None');

    const swipeCount = await prisma.swipe.count();
    console.log(`Total Swipes: ${swipeCount}`);

    const lastSwipe = await prisma.swipe.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { fromUser: true },
    });
    console.log('Last Swipe:', lastSwipe ? `From ${lastSwipe.fromUser.email} -> To ID ${lastSwipe.toUserId} (${lastSwipe.isLike ? 'LIKE' : 'PASS'})` : 'None');

    const matchCount = await prisma.match.count();
    console.log(`Total Matches: ${matchCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
