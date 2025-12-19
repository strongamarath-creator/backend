import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from "./dto/create-system-config.dto";
import { SystemConfig, ConfigType } from "@prisma/client";

export interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  database: "up" | "down";
}

@Injectable()
export class SystemService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default configs if needed
    const maintenanceMode = await this.prisma.systemConfig.findUnique({
      where: { key: "maintenance_mode" },
    });
    if (!maintenanceMode) {
      await this.prisma.systemConfig.create({
        data: {
          key: "maintenance_mode",
          value: "false",
          description: "Enable maintenance mode to block user access",
          type: ConfigType.BOOLEAN, // FIX: Строгое соответствие Enum (UPPERCASE)
        },
      });
    }

    const enableCalls = await this.prisma.systemConfig.findUnique({
      where: { key: "enable_calls" },
    });
    if (!enableCalls) {
      await this.prisma.systemConfig.create({
        data: {
          key: "enable_calls",
          value: "true",
          description: "Enable Audio/Video Calls",
          type: ConfigType.BOOLEAN, // FIX: Строгое соответствие Enum (UPPERCASE)
        },
      });
    }

    const subscriptionPolicies = await this.prisma.systemConfig.findUnique({
      where: { key: "subscription_policies" },
    });
    if (!subscriptionPolicies) {
      await this.prisma.systemConfig.create({
        data: {
          key: "subscription_policies",
          // FIX: Ключи JSON строго соответствуют значениям SubscriptionTier из schema.prisma
          value: JSON.stringify({
            FREE: {
              messaging: {
                enabled: true,
                dailyTextLimit: 30,
                mediaEnabled: false,
              },
              calls: { audio: false, video: false },
            },
            SILVER: { // TIER1 в комментариях схемы, но SILVER в Enum
              messaging: {
                enabled: true,
                dailyTextLimit: 0,
                mediaEnabled: true,
              },
              calls: { audio: true, video: false },
            },
            GOLD: { // TIER2 -> GOLD
              messaging: {
                enabled: true,
                dailyTextLimit: 0,
                mediaEnabled: true,
              },
              calls: { audio: true, video: true },
            },
            PLATINUM: { // TIER3 -> PLATINUM
              messaging: {
                enabled: true,
                dailyTextLimit: 0,
                mediaEnabled: true,
              },
              calls: { audio: true, video: true },
            },
          }),
          description: "Subscription tier policies (feature access & limits)",
          type: ConfigType.JSON, // FIX: Строгое соответствие Enum (UPPERCASE)
          isPublic: false,
        },
      });
    }

    // Seed default pages (safe mode: create only if missing; do NOT overwrite admin edits)
    await this.seedDefaultPagesIfMissing();
  }

  async getConfig(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    return config ? config.value : null;
  }

  private getDefaultPages() {
    return [
      {
        route: "/terms",
        title: "Terms of Service",
        description: "Terms and Conditions for use of Likes-love.com",
        content: `
          <div class="legal-content">
            <h1>Terms of Service</h1>
            <p><strong>Last Updated: ${new Date().toLocaleDateString()}</strong></p>
            
            <h2>1. Acceptance of Agreement</h2>
            <p>By accessing or using the Likes-love.com website, mobile application, or any other services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Agreement"). If you do not agree, you may not use the Service.</p>
            
            <h2>2. Eligibility</h2>
            <p>You must be at least 18 years of age to create an account on Likes-love.com and use the Service. By creating an account, you represent and warrant that:</p>
            <ul>
              <li>You are legally capable of entering into a binding contract.</li>
              <li>You are not a person who is barred from using the Service under the laws of the United States or any other applicable jurisdiction.</li>
              <li>You have not been convicted of or pled no contest to a felony, a sex crime, or any crime involving violence.</li>
            </ul>

            <h2>3. Account Security</h2>
            <p>You are responsible for maintaining the confidentiality of your login credentials you use to sign up for Likes-love.com, and you are solely responsible for all activities that occur under those credentials.</p>

            <h2>4. Community Rules & Code of Conduct</h2>
            <p>Likes-love.com has a <strong>Zero Tolerance Policy</strong> for the following behavior. Violation will result in immediate account termination:</p>
            <ul>
              <li><strong>Harassment & Hate Speech:</strong> Bullying, stalking, or advocating violence against individuals or groups.</li>
              <li><strong>Nudity & Sexual Content:</strong> Publicly posting NSFW content, pornography, or soliciting sexual acts.</li>
              <li><strong>Spam & Scams:</strong> Soliciting money, promoting commercial links, or phishing.</li>
              <li><strong>Impersonation:</strong> Creating fake profiles or misrepresenting your identity.</li>
            </ul>

            <h2>5. Subscriptions and Purchases</h2>
            <p><strong>Auto-Renewal:</strong> If you purchase a subscription, it will automatically renew until you cancel. You must cancel at least 24 hours before the end of the current period to avoid being charged.</p>
            <p><strong>Refunds:</strong> Generally, all charges for purchases are non-refundable, and there are no refunds or credits for partially used periods, except as required by applicable law.</p>

            <h2>6. Safety & Location Services</h2>
            <p>The Service may use your location to identify matches. You consent to the collection and use of your location data. We recommend using caution when sharing your location with other users.</p>

            <h2>7. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.</p>

            <h2>8. Limitation of Liability</h2>
            <p>TO THE FULLEST EXTENT PERMITTED BY LAW, LIKES-LOVE.COM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.</p>

            <h2>9. Dispute Resolution</h2>
            <p>Any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration, except where prohibited by law.</p>

            <h2>10. Contact Us</h2>
            <p>For any questions regarding these Terms, please contact us at support@likes-love.com.</p>
          </div>
        `,
      },
      {
        route: "/privacy",
        title: "Privacy Policy",
        description: "How Likes-love.com collects, uses, and shares your data.",
        content: `
          <div class="legal-content">
            <h1>Privacy Policy</h1>
            <p><strong>Last Updated: ${new Date().toLocaleDateString()}</strong></p>
            
            <p>Welcome to Likes-love.com. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and share information.</p>

            <h2>1. Information We Collect</h2>
            <ul>
              <li><strong>Account Information:</strong> Name, email, date of birth, gender, and photos.</li>
              <li><strong>Usage Data:</strong> Activity on the app, swipes, matches, and chat interactions.</li>
              <li><strong>Geolocation:</strong> Latitude and longitude coordinates (if permitted by your device settings) to suggest nearby matches.</li>
              <li><strong>Device Information:</strong> IP address, device ID, and operating system.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your data to:</p>
            <ul>
              <li>Create and manage your account.</li>
              <li>Provide customer support.</li>
              <li>Analyze usage to improve the Service.</li>
              <li>Prevent fraud and ensure safety.</li>
              <li>Process payments.</li>
            </ul>

            <h2>3. Sharing Your Information</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul>
              <li><strong>Service Providers:</strong> For hosting, analytics, and payment processing (e.g., Stripe, Google Play).</li>
              <li><strong>Legal Authorities:</strong> If required by law or to protect rights and safety.</li>
            </ul>

            <h2>4. Your Rights (GDPR / CCPA)</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your data.</li>
              <li><strong>Correction:</strong> Update inaccurate information.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data.</li>
            </ul>
            <p>To exercise these rights, contact us at support@likes-love.com.</p>

            <h2>5. Data Retention</h2>
            <p>We retain your information only as long as we need it for legitimate business purposes and as permitted by applicable law.</p>

            <h2>6. Cookies</h2>
            <p>We use cookies to operate and improve our Service. You can control cookies through your browser settings.</p>

            <h2>7. Children's Privacy</h2>
            <p>Our Service is restricted to users who are 18 years of age or older. We do not knowingly collect information from children under 18.</p>
          </div>
        `,
      },
      {
        route: "/safety",
        title: "Safety Tips",
        description: "Guidelines for safe dating on Likes-love.com",
        content: `
          <div class="legal-content">
            <h1>Dating Safety Tips</h1>
            <p>Your safety is our top priority. While we strive to keep our community safe, it's important to exercise caution when interacting with strangers online and in person.</p>

            <h2>Online Safety</h2>
            <ul>
              <li><strong>Never Send Money:</strong> Be extremely wary of anyone asking for money, wire transfers, or gift cards. This is the #1 sign of a scam.</li>
              <li><strong>Protect Personal Info:</strong> Don't share your home address, social security number, or financial details with someone you just met.</li>
              <li><strong>Stay on the App:</strong> Keep conversations on Likes-love.com while you're getting to know someone. Scammers often try to move you to text or email immediately.</li>
              <li><strong>Report Suspicious Behavior:</strong> If someone is abusive, rude, or seems fake, report them immediately using the shield icon on their profile.</li>
            </ul>

            <h2>Meeting in Person</h2>
            <ul>
              <li><strong>Meet in Public:</strong> Always meet for the first time in a populated, public place. Never meet at your home or theirs.</li>
              <li><strong>Tell a Friend:</strong> Inform a friend or family member of your plans, including where you are going and who you are meeting.</li>
              <li><strong>Self-Transportation:</strong> Provide your own transportation to and from the date so you are not dependent on your date.</li>
              <li><strong>Stay Sober:</strong> Keep a clear mind by limiting alcohol consumption.</li>
            </ul>

            <h2>Consent & Respect</h2>
            <p>All sexual activity must be consensual. You have the right to say no at any time. Respect boundaries and demand respect in return.</p>

            <h2>Resources</h2>
            <p>If you feel you are in immediate danger, call your local emergency number (911 in the US) immediately.</p>
          </div>
        `,
      },
      {
        route: "/support",
        title: "Support Center",
        description: "Get help with Likes-love.com",
        content: `
          <div class="legal-content">
            <h1>Support Center</h1>
            <p>We are here to help! If you have any issues with your account, billing, or technical problems, please reach out.</p>

            <h2>Frequently Asked Questions</h2>
            
            <h3>How do I cancel my subscription?</h3>
            <p>Go to your Profile settings > Subscriptions and select "Cancel Subscription". Note that deleting the app does not cancel your subscription.</p>

            <h3>How do I change my location?</h3>
            <p>Your location updates automatically based on your device's GPS. Ensure location permissions are enabled for Likes-love.com.</p>

            <h3>How do I report a user?</h3>
            <p>Navigate to the user's profile, tap the "..." menu or Shield icon, and select "Report". Choose the reason and submit.</p>

            <h2>Contact Us</h2>
            <p>If you couldn't find the answer above, please email our support team:</p>
            <p><strong>Email:</strong> <a href="mailto:support@likes-love.com">support@likes-love.com</a></p>
            <p>Please include your account email and a detailed description of the issue. We aim to respond within 24-48 hours.</p>
          </div>
        `,
      },
    ];
  }

  /**
   * Safe mode: creates pages only when they do not exist.
   * Does not overwrite existing content edited by Admin.
   */
  async seedDefaultPagesIfMissing() {
    const pages = this.getDefaultPages();

    for (const page of pages) {
      await this.prisma.pageConfig.upsert({
        where: { route: page.route },
        update: {},
        create: page,
      });
    }
  }

  /**
   * Force mode: overwrites title/description/content with bundled defaults.
   * Use ONLY from explicit admin action (scripts), not on service start.
   */
  async syncDefaultPagesOverwrite() {
    const pages = this.getDefaultPages();

    for (const page of pages) {
      await this.prisma.pageConfig.upsert({
        where: { route: page.route },
        update: {
          content: page.content,
          title: page.title,
          description: page.description,
        },
        create: page,
      });
    }
  }

  async create(createConfigDto: CreateSystemConfigDto): Promise<SystemConfig> {
    return await this.prisma.systemConfig.create({
      data: {
        key: createConfigDto.key,
        value: createConfigDto.value,
        description: createConfigDto.description,
        type: createConfigDto.type,
        isPublic: createConfigDto.isPublic,
      },
    });
  }

  async findAll(): Promise<SystemConfig[]> {
    return await this.prisma.systemConfig.findMany({
      orderBy: { key: "asc" },
    });
  }

  async findOne(key: string): Promise<SystemConfig> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!config) {
      throw new NotFoundException(`Configuration with key "${key}" not found`);
    }
    return config;
  }

  async update(
    key: string,
    updateConfigDto: UpdateSystemConfigDto,
  ): Promise<SystemConfig> {
    await this.findOne(key);
    return await this.prisma.systemConfig.update({
      where: { key },
      data: {
        value: updateConfigDto.value,
        type: updateConfigDto.type,
        description: updateConfigDto.description,
        isPublic: updateConfigDto.isPublic,
      },
    });
  }

  async remove(key: string): Promise<void> {
    await this.findOne(key);
    await this.prisma.systemConfig.delete({ where: { key } });
  }

  async getHealth(): Promise<HealthStatus> {
    let dbStatus: "up" | "down" = "down";
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "up";
    } catch (e) {
      console.error("Health check failed:", e);
      dbStatus = "down";
    }

    return {
      status: dbStatus === "up" ? "ok" : "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  }
}