import { User } from "../../users/entities/user.entity";

export class Match {
  id: string;
  user1: User;
  user2: User;
  createdAt: Date;
}
