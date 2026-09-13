import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ProfileController } from '../../../presentation/controllers/ProfileController';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

function mockReq(
  data: Partial<Request> & { body?: unknown; user?: { id: string }; file?: unknown },
): Request {
  return { body: {}, ...data } as unknown as Request;
}

describe('ProfileController', () => {
  const next: NextFunction = vi.fn() as unknown as NextFunction;
  let useCases: {
    get: { execute: ReturnType<typeof vi.fn> };
    update: { execute: ReturnType<typeof vi.fn> };
    upload: { execute: ReturnType<typeof vi.fn> };
  };
  let controller: ProfileController;

  beforeEach(() => {
    vi.clearAllMocks();
    useCases = {
      get: { execute: vi.fn() },
      update: { execute: vi.fn() },
      upload: { execute: vi.fn() },
    };
    controller = new ProfileController(
      useCases.get as never,
      useCases.update as never,
      useCases.upload as never,
    );
  });

  it('should return the profile', async () => {
    const profile = { id: 'u1', firstName: 'Ana' };
    useCases.get.execute.mockResolvedValue(profile);
    const { res, status, json } = mockRes();

    await controller.getMyProfile(mockReq({ user: { id: 'u1' } }), res, next);

    expect(useCases.get.execute).toHaveBeenCalledWith('u1');
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Perfil obtenido exitosamente' }),
    );
  });

  it('should update with parsed birthDate', async () => {
    const profile = { id: 'u1', firstName: 'Maria' };
    useCases.update.execute.mockResolvedValue(profile);
    const { res, status } = mockRes();

    await controller.updateMyProfile(
      mockReq({ body: { firstName: 'Maria', birthDate: '1995-03-20' }, user: { id: 'u1' } }),
      res,
      next,
    );

    expect(useCases.update.execute).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ firstName: 'Maria', birthDate: new Date('1995-03-20T00:00:00') }),
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should map null, empty and missing birthDate', async () => {
    useCases.update.execute.mockResolvedValue({ id: 'u1' });
    const { res } = mockRes();

    await controller.updateMyProfile(
      mockReq({ body: { firstName: 'Ana', birthDate: null }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(useCases.update.execute).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ birthDate: null }),
    );

    await controller.updateMyProfile(
      mockReq({ body: { firstName: 'Ana', birthDate: '' }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(useCases.update.execute).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ birthDate: null }),
    );

    await controller.updateMyProfile(
      mockReq({ body: { firstName: 'Ana' }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(useCases.update.execute).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ birthDate: undefined }),
    );
  });

  it('should call next when getMyProfile throws', async () => {
    useCases.get.execute.mockRejectedValue(new Error('x'));
    const { res } = mockRes();

    await controller.getMyProfile(mockReq({ user: { id: 'u1' } }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next on invalid update body', async () => {
    const { res } = mockRes();

    await controller.updateMyProfile(
      mockReq({ body: { phone: '123' }, user: { id: 'u1' } }),
      res,
      next,
    );

    expect(next).toHaveBeenCalled();
    expect(useCases.update.execute).not.toHaveBeenCalled();
  });

  it('should upload the document buffer', async () => {
    const profile = { id: 'u1', documentVerified: true };
    useCases.upload.execute.mockResolvedValue(profile);
    const { res, status } = mockRes();
    const file = { buffer: Buffer.from('%PDF'), originalname: 'cedula.pdf' };

    await controller.uploadMyDocument(mockReq({ user: { id: 'u1' }, file }), res, next);

    expect(useCases.upload.execute).toHaveBeenCalledWith('u1', file.buffer, 'cedula.pdf');
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should call next when uploadDocument is not configured', async () => {
    const withoutUpload = new ProfileController(
      useCases.get as never,
      useCases.update as never,
      undefined,
    );
    const { res } = mockRes();

    await withoutUpload.uploadMyDocument(
      mockReq({ user: { id: 'u1' }, file: { buffer: Buffer.from('x'), originalname: 'a.pdf' } }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(useCases.upload.execute).not.toHaveBeenCalled();
  });

  it('should call next when no file is received', async () => {
    const { res } = mockRes();

    await controller.uploadMyDocument(mockReq({ user: { id: 'u1' } }), res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
