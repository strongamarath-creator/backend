import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPages() {
  const pages = [
    {
      route: "/terms",
      title: "Terms of Service",
      content: "<h1>Terms of Service</h1><p>Welcome to Likes-love.com...</p>",
      description: "Our terms and conditions.",
    },
    {
      route: "/privacy",
      title: "Privacy Policy",
      content: "<h1>Privacy Policy</h1><p>We respect your privacy...</p>",
      description: "How we handle your data.",
    },
    {
      route: "/safety",
      title: "Safety Tips",
      content: "<h1>Safety Tips</h1><p>Stay safe while dating...</p>",
      description: "Tips for safe dating.",
    },
    {
      route: "/support",
      title: "Support",
      content: "<h1>Support</h1><p>Contact us at support@likes-love.com</p>",
      description: "Get help.",
    },
  ];

  for (const page of pages) {
    await prisma.pageConfig.upsert({
      where: { route: page.route },
      update: {},
      create: page,
    });
  }
}
