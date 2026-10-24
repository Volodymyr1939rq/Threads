import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: DatabaseService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockCompare = bcrypt.compare as jest.Mock;
  const hashmock = bcrypt.hash as jest.Mock;

  const mockDataBaseService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-jwt-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDataBaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    const dto = { email: 'test1@gmail.com', password: 'password123' };

    it('повинен викинути NotFoundException якщо користувача з таким email не існує', async () => {
      mockDataBaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.validate(dto)).rejects.toThrow(NotFoundException);
      expect(mockDataBaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockCompare).not.toHaveBeenCalled();
    });

    it('повинен повернути користувача без пароля якщо паролі зійшлися', async () => {
      const dbUser = {
        id: 'user-1',
        email: dto.email,
        name: 'Volodymyr',
        password: 'hashedPassword',
      };
      mockDataBaseService.user.findUnique.mockResolvedValue(dbUser);
      mockCompare.mockResolvedValue(true);

      const result = await service.validate(dto);

      expect(mockCompare).toHaveBeenCalledWith(dto.password, dbUser.password);
      expect(result).toEqual({
        id: 'user-1',
        email: dto.email,
        name: 'Volodymyr',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('повинен повертати null якщо пароль не вірний', async () => {
      const dbUser = {
        id: 'user-1',
        email: dto.email,
        password: 'hashedPassword',
      };
      mockDataBaseService.user.findUnique.mockResolvedValue(dbUser);
      mockCompare.mockResolvedValue(false);

      const result = await service.validate(dto);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const dto = { email: 'test1@gmail.com', password: 'password123' };

    it('повинен викинути UnauthorizedException якщо валідація не пройшла', async () => {
      jest.spyOn(service, 'validate').mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      expect(mockDataBaseService.user.update).not.toHaveBeenCalled();
    });

    it('повинен успішно згенерувати токен, зберегти хеш refresh-токена та повернути результат', async () => {
      const validateUser = {
        id: 'user-1',
        name: 'Volodymyr',
        email: dto.email,
      };

      jest.spyOn(service, 'validate').mockResolvedValue(validateUser as any);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token-xyz')
        .mockResolvedValueOnce('refresh-token-xyz');

      hashmock.mockResolvedValue('hashed-refresh-token');
      mockDataBaseService.user.update.mockResolvedValue({});

      const result = await service.login(dto);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: validateUser.id,
          email: validateUser.email,
        },
        {
          expiresIn: '7d',
          secret: 'test-jwt-secret',
        },
      );
      expect(hashmock).toHaveBeenCalledWith('refresh-token-xyz', 10);
      expect(mockDataBaseService.user.update).toHaveBeenCalledWith({
        where: {
          id: validateUser.id,
        },
        data: {
          hashedRefreshTokens: 'hashed-refresh-token',
        },
      });
      expect(result).toEqual({
        user: validateUser,
        token: {
          accessToken: 'access-token-xyz',
          refreshToken: 'refresh-token-xyz',
        },
      });
    });
  });

  describe('refresh', () => {
    const dto = { refreshToken: 'valid-refresh-token' };

    it('повинен викинути UnauthorizedException, якщо токен прострочений або невалідний', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refresh(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid or Expired Refresh Token'),
      );
      expect(mockDataBaseService.user.findUnique).not.toHaveBeenCalled();
    });

    it('повинен викинути UnauthorizedException, якщо користувача або hashedRefreshTokens не знайдено в базі', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'test@example.com' });
      mockDataBaseService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        hashedRefreshTokens: null,
      });

      await expect(service.refresh(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid or Expired Refresh Token'),
      );
    });

    it('повинен викинути UnauthorizedException, якщо переданий токен не збігається з хешем у базі', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'test@example.com' });
      mockDataBaseService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        hashedRefreshTokens: 'stored-hash',
      });
      mockCompare.mockResolvedValue(false);

      await expect(service.refresh(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid or Expired Refresh Token'),
      );
    });

    it('повинен згенерувати нову пару токенів та оновити базу, якщо токен валідний', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        hashedRefreshTokens: 'stored-hash',
      };

      mockJwtService.verifyAsync.mockResolvedValue({ sub: user.id, email: user.email });
      mockDataBaseService.user.findUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      hashmock.mockResolvedValue('new-hashed-refresh-token');
      mockDataBaseService.user.update.mockResolvedValue({});

      const result = await service.refresh(dto);

      expect(mockCompare).toHaveBeenCalledWith(dto.refreshToken, user.hashedRefreshTokens);
      expect(hashmock).toHaveBeenCalledWith('new-refresh-token', 10);
      expect(mockDataBaseService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { hashedRefreshTokens: 'new-hashed-refresh-token' },
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });
  });

  describe('logout', () => {
    it('повинен занулити hashedRefreshTokens для зазначеного userId', async () => {
      const userId = 'user-123';
      mockDataBaseService.user.update.mockResolvedValue({});

      await service.logout(userId);

      expect(mockDataBaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { hashedRefreshTokens: null },
      });
    });
  });
});