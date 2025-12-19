import { User } from "../../users/entities/user.entity";

export class Message {
  id: number;
  sender: User;
  receiver: User;
  content: string;
  isRead: boolean;
  createdAt: Date;
}
