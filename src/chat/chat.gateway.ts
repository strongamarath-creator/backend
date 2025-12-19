import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SystemService } from "../system/system.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { PrismaService } from "../prisma/prisma.service";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user?: JwtPayload;
  };
}

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly systemService: SystemService,
    private readonly entitlementsService: EntitlementsService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.headers.authorization?.split(" ")[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow("JWT_SECRET"),
      });

      client.data.user = payload;

      await client.join(`user_${payload.sub}`);
      console.log(`Client connected: ${client.id}, User: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitToUser(userId: string | number, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user_${userId}`).emit(event, payload);
  }

  private getUser(client: AuthenticatedSocket): JwtPayload {
    if (!client.data.user) {
      throw new Error("User not authenticated");
    }
    return client.data.user;
  }

  @SubscribeMessage("sendMessage")
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = this.getUser(client);
    const senderId = Number(user.sub);

    // Logic is in service (includes encryption and block checks)
    const message = await this.chatService.create(senderId, createMessageDto);

    // Emit to receiver
    this.server
      .to(`user_${createMessageDto.receiverId}`)
      .emit("newMessage", message);

    // Also emit to sender (for multiple devices)
    this.server.to(`user_${senderId}`).emit("newMessage", message);

    return message;
  }

  @SubscribeMessage("joinChat")
  joinChat() {
    // Just confirming presence logic if needed
    return { status: "joined" };
  }

  // WebRTC Signaling Events
  // Signal data is usually a JSON object from simple-peer or similar libs.
  // Using Record<string, unknown> instead of any.
  @SubscribeMessage("callUser")
  async callUser(
    @MessageBody()
    data: {
      userToCall: string;
      signalData: unknown;
      from?: string;
      isVideo?: boolean;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const enabled = await this.systemService.getConfig("enable_calls");
    if (enabled !== "true") {
      return;
    }

    const user = this.getUser(client);
    const callerId = Number(user.sub);
    const calleeId = Number(data.userToCall);
    if (!Number.isFinite(calleeId)) {
      return;
    }

    const isVideo = data.isVideo ?? true;

    // Must be matched to call
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: callerId, user2Id: calleeId },
          { user1Id: calleeId, user2Id: callerId },
        ],
      },
      select: { id: true },
    });
    if (!match) {
      return;
    }

    await this.entitlementsService.assertCanCall(callerId, calleeId, isVideo);

    this.server.to(`user_${calleeId}`).emit("callUser", {
      signal: data.signalData,
      from: String(callerId),
      isVideo,
    });
  }

  @SubscribeMessage("answerCall")
  async answerCall(
    @MessageBody() data: { to: string; signal: unknown; isVideo?: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const enabled = await this.systemService.getConfig("enable_calls");
    if (enabled !== "true") {
      return;
    }

    const user = this.getUser(client);
    const calleeId = Number(user.sub);
    const callerId = Number(data.to);
    if (!Number.isFinite(callerId)) {
      return;
    }

    const isVideo = data.isVideo ?? true;

    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: callerId, user2Id: calleeId },
          { user1Id: calleeId, user2Id: callerId },
        ],
      },
      select: { id: true },
    });
    if (!match) {
      return;
    }

    await this.entitlementsService.assertCanCall(callerId, calleeId, isVideo);

    this.server.to(`user_${callerId}`).emit("callAccepted", data.signal);
  }

  @SubscribeMessage("ice-candidate")
  async handleIceCandidate(
    @MessageBody()
    data: { to: string; candidate: Record<string, unknown>; isVideo?: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const enabled = await this.systemService.getConfig("enable_calls");
    if (enabled !== "true") {
      return;
    }

    const user = this.getUser(client);
    const fromId = Number(user.sub);
    const toId = Number(data.to);
    if (!Number.isFinite(toId)) {
      return;
    }

    const isVideo = data.isVideo ?? true;

    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: fromId, user2Id: toId },
          { user1Id: toId, user2Id: fromId },
        ],
      },
      select: { id: true },
    });
    if (!match) {
      return;
    }

    await this.entitlementsService.assertCanCall(fromId, toId, isVideo);

    this.server.to(`user_${toId}`).emit("ice-candidate", data.candidate);
  }

  @SubscribeMessage("endCall")
  async endCall(
    @MessageBody() data: { to: string; duration?: number; isVideo?: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Require auth; only allow ending calls to matched user
    const user = this.getUser(client);
    const fromId = Number(user.sub);
    const toId = Number(data.to);
    if (!Number.isFinite(toId)) {
      return;
    }

    // Only allow ending calls with matched user
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: fromId, user2Id: toId },
          { user1Id: toId, user2Id: fromId },
        ],
      },
      select: { id: true },
    });

    if (!match) return;

    // Log the call in the database
    try {
      const callType = data.isVideo ? "VIDEO_CALL" : "AUDIO_CALL";
      const duration = data.duration || 0;
      const content = `${callType}:${duration}`;

      const callLog = await this.prisma.message.create({
        data: {
          senderId: fromId,
          receiverId: toId,
          matchId: match.id,
          type: "CALL_LOG",
          content,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              photos: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              photos: true,
            },
          },
        },
      });

      // Emit call log to both users
      this.server.to(`user_${fromId}`).emit("newMessage", callLog);
      this.server.to(`user_${toId}`).emit("newMessage", callLog);
    } catch (error) {
      console.error("Failed to log call:", error);
    }

    this.server.to(`user_${toId}`).emit("endCall");
  }
}
