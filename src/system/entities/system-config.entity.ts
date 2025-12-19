export enum ConfigType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  JSON = "JSON",
}

export class SystemConfig {
  key: string;
  value: string;
  type: ConfigType;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
