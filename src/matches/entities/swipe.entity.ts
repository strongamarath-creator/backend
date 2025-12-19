import { User } from "../../users/entities/user.entity";

export class Swipe {
  id: string;
  fromUser: User;
  toUser: User;
  isLike: boolean;
  createdAt: Date;
}
