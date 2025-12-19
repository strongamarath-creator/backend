import { User } from "../../users/entities/user.entity";
import { Prisma, PaymentStatus, PaymentProvider } from "@prisma/client";

export { PaymentStatus, PaymentProvider };

export class Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId?: string;
  metadata?: Prisma.JsonValue;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}
