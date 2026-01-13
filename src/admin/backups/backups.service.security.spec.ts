
import { Test, TestingModule } from '@nestjs/testing';
import { BackupsService } from './backups.service';
import { ConfigService } from '@nestjs/config';

describe('BackupsService Security', () => {
  let service: BackupsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BackupsService>(BackupsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should prevent command injection in escapeShell', () => {
    const escapeShell = (service as any).escapeShell.bind(service);

    const inputWithQuote = "foo'bar";
    const escapedWithQuote = escapeShell(inputWithQuote);
    expect(escapedWithQuote).toBe("'foo'\\''bar'");

    const inputWithMetachars = "$(whoami)";
    const escapedMetachars = escapeShell(inputWithMetachars);
    expect(escapedMetachars).toBe("'$(whoami)'");

    const inputWithDoubleQuote = 'foo"bar';
    const escapedDoubleQuote = escapeShell(inputWithDoubleQuote);
    expect(escapedDoubleQuote).toBe("'foo\"bar'");
  });
});
