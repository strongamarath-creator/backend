import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CreateMessageDto } from "./dto/create-message.dto";
import { PrismaService } from "../prisma/prisma.service";
import { EncryptionService } from "../common/encryption.service";
import { EntitlementsService } from "../entitlements/entitlements.service";

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private entitlementsService: EntitlementsService,
  ) {}

  async create(senderId: number, createMessageDto: CreateMessageDto) {
    const sId = senderId;
    const rId = Number(createMessageDto.receiverId);

    const messageType = createMessageDto.type ?? "TEXT";

    // Enforce subscription tier policies & limits (server-side, for all clients)
    await this.entitlementsService.assertCanSendMessage(sId, messageType);

    // Additional per-user block
    const sender = await this.prisma.user.findUnique({ where: { id: sId } });
    if (sender?.messagingBlocked) {
      throw new ForbiddenException("Messaging is blocked for your account.");
    }

    // Check Match
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: sId, user2Id: rId },
          { user1Id: rId, user2Id: sId },
        ],
      },
    });

    if (!match) {
      throw new NotFoundException("Match not found between these users");
    }

    // Encrypt content
    const encryptedContent = this.encryptionService.encrypt(
      createMessageDto.content,
    );

    const message = await this.prisma.message.create({
      data: {
        senderId: sId,
        receiverId: rId,
        content: encryptedContent,
        matchId: match.id,
        type: messageType,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, photos: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, firstName: true, photos: true, avatarUrl: true },
        },
      },
    });

    // Return decrypted for the sender/socket
    return {
      ...message,
      content: createMessageDto.content,
      sender: {
        ...message.sender,
        photos: message.sender.photos.map((p) => p.url),
      },
      receiver: {
        ...message.receiver,
        photos: message.receiver.photos.map((p) => p.url),
      },
    };
  }

  async findAll(userId1: number, userId2: number) {
    const u1 = userId1;
    const u2 = userId2;

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: u1, receiverId: u2 },
          { senderId: u2, receiverId: u1 },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, firstName: true, photos: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, firstName: true, photos: true, avatarUrl: true },
        },
      },
    });

    // Decrypt messages
    return messages.map((msg) => {
      try {
        return {
          ...msg,
          content: this.encryptionService.decrypt(msg.content),
          sender: {
            ...msg.sender,
            photos: msg.sender.photos.map((p) => p.url),
          },
          receiver: {
            ...msg.receiver,
            photos: msg.receiver.photos.map((p) => p.url),
          },
        };
      } catch {
        // Handle legacy unencrypted messages if any (during dev)
        return {
          ...msg,
          sender: {
            ...msg.sender,
            photos: msg.sender.photos.map((p) => p.url),
          },
          receiver: {
            ...msg.receiver,
            photos: msg.receiver.photos.map((p) => p.url),
          },
        };
      }
    });
  }

  // Admin access to read all messages of a user
  async getAdminUserMessages(userId: string | number) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: Number(userId) }, { receiverId: Number(userId) }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            email: true,
            photos: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            email: true,
            photos: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.map((msg) => {
      const decryptedContent = (() => {
        try {
          return this.encryptionService.decrypt(msg.content);
        } catch {
          return msg.content;
        }
      })();

      return {
        ...msg,
        content: decryptedContent,
        sender: {
          ...msg.sender,
          photos: msg.sender.photos ? msg.sender.photos.map((p) => p.url) : [],
        },
        receiver: {
          ...msg.receiver,
          photos: msg.receiver.photos
            ? msg.receiver.photos.map((p) => p.url)
            : [],
        },
      };
    });
  }
}
