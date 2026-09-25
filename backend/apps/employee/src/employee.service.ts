import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService, QueueService } from '@app/common';
import type {
  ActorContext,
  CreateEmployeePayload,
  LoginPayload,
  UpdateEmployeePayload,
  UpdateMyProfilePayload,
} from '@app/common';

const SALT_ROUNDS = 10;

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async login(payload: LoginPayload) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      throw new RpcException({ status: 401, message: 'Email atau password salah' });
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      throw new RpcException({ status: 401, message: 'Email atau password salah' });
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.employee?.name ?? 'Administrator',
    };
  }

  async getMe(actor: ActorContext) {
    return this.getProfileByUserId(actor.userId);
  }

  async updateMe(payload: UpdateMyProfilePayload) {
    if (payload.actor.role !== 'EMPLOYEE') {
      throw new RpcException({
        status: 403,
        message: 'Hanya karyawan yang dapat mengubah profil sendiri',
      });
    }

    const employee = await this.prisma.employee.findUnique({
      where: { userId: payload.actor.userId },
    });

    if (!employee) {
      throw new RpcException({ status: 404, message: 'Profil karyawan tidak ditemukan' });
    }

    const data: Prisma.EmployeeUpdateInput = {};
    const userData: Prisma.UserUpdateInput = {};
    const changes: Record<string, unknown> = {};

    if (payload.phone && payload.phone !== employee.phone) {
      data.phone = payload.phone;
      changes.phone = { from: employee.phone, to: payload.phone };
    }

    if (payload.photoUrl && payload.photoUrl !== employee.photoUrl) {
      data.photoUrl = payload.photoUrl;
      changes.photoUrl = { from: employee.photoUrl, to: payload.photoUrl };
    }

    if (payload.password) {
      userData.passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
      changes.password = { changed: true };
    }

    if (Object.keys(data).length === 0 && Object.keys(userData).length === 0) {
      throw new RpcException({ status: 400, message: 'Tidak ada data yang diubah' });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: payload.actor.userId },
          data: userData,
        });
      }

      return tx.employee.update({
        where: { id: employee.id },
        data,
        include: { user: { select: { email: true, role: true } } },
      });
    });

    await this.queue.publishAudit({
      action: 'EMPLOYEE_SELF_UPDATE',
      entity: 'Employee',
      entityId: employee.id,
      actorId: payload.actor.userId,
      actorEmail: payload.actor.email,
      payload: {
        name: updated.name,
        changes,
      },
    });

    return {
      profile: this.toPublic(updated),
      notification: {
        title: 'Perubahan profil karyawan',
        message: `${updated.name} memperbarui ${Object.keys(changes).join(', ')}`,
        employeeId: employee.id,
        employeeName: updated.name,
        changes,
        at: new Date().toISOString(),
      },
    };
  }

  async list() {
    const employees = await this.prisma.employee.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { name: 'asc' },
    });
    return employees.map((item) => this.toPublic(item));
  }

  async getById(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!employee) {
      throw new RpcException({ status: 404, message: 'Karyawan tidak ditemukan' });
    }

    return this.toPublic(employee);
  }

  async create(payload: CreateEmployeePayload) {
    this.assertAdmin(payload.actor);
    this.assertCompanyEmail(payload.email);

    const email = payload.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new RpcException({ status: 409, message: 'Email sudah terdaftar' });
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(payload.password, SALT_ROUNDS),
        role: Role.EMPLOYEE,
        employee: {
          create: {
            name: payload.name.trim(),
            position: payload.position.trim(),
            phone: payload.phone.trim(),
            photoUrl: payload.photoUrl,
          },
        },
      },
      include: { employee: { include: { user: { select: { email: true, role: true } } } } },
    });

    if (!created.employee) {
      throw new RpcException({ status: 500, message: 'Gagal membuat data karyawan' });
    }

    await this.queue.publishAudit({
      action: 'EMPLOYEE_CREATED',
      entity: 'Employee',
      entityId: created.employee.id,
      actorId: payload.actor.userId,
      actorEmail: payload.actor.email,
      payload: { email, name: payload.name },
    });

    return this.toPublic(created.employee);
  }

  async update(payload: UpdateEmployeePayload) {
    this.assertAdmin(payload.actor);

    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new RpcException({ status: 404, message: 'Karyawan tidak ditemukan' });
    }

    const employeeData: Prisma.EmployeeUpdateInput = {};
    const userData: Prisma.UserUpdateInput = {};

    if (payload.name) employeeData.name = payload.name.trim();
    if (payload.position) employeeData.position = payload.position.trim();
    if (payload.phone) employeeData.phone = payload.phone.trim();
    if (payload.photoUrl) employeeData.photoUrl = payload.photoUrl;
    if (payload.email) {
      this.assertCompanyEmail(payload.email);
      userData.email = payload.email.trim().toLowerCase();
    }
    if (payload.password) {
      userData.passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: employee.userId },
          data: userData,
        });
      }

      return tx.employee.update({
        where: { id: employee.id },
        data: employeeData,
        include: { user: { select: { email: true, role: true } } },
      });
    });

    await this.queue.publishAudit({
      action: 'EMPLOYEE_UPDATED',
      entity: 'Employee',
      entityId: employee.id,
      actorId: payload.actor.userId,
      actorEmail: payload.actor.email,
      payload: {
        name: updated.name,
        fields: Object.keys({ ...employeeData, ...userData }),
      },
    });

    return this.toPublic(updated);
  }

  private async getProfileByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!employee) {
      throw new RpcException({ status: 404, message: 'Profil karyawan tidak ditemukan' });
    }

    return this.toPublic(employee);
  }

  private toPublic(employee: {
    id: string;
    userId: string;
    name: string;
    position: string;
    phone: string;
    photoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: { email: string; role: Role };
  }) {
    return {
      id: employee.id,
      userId: employee.userId,
      name: employee.name,
      email: employee.user.email,
      position: employee.position,
      phone: employee.phone,
      photoUrl: employee.photoUrl,
      role: employee.user.role,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  private assertAdmin(actor: ActorContext) {
    if (actor.role !== 'ADMIN') {
      throw new RpcException({ status: 403, message: 'Akses admin diperlukan' });
    }
  }

  private assertCompanyEmail(email: string) {
    const domain = process.env.COMPANY_EMAIL_DOMAIN ?? 'dexagroup.com';
    if (!email.toLowerCase().endsWith(`@${domain}`)) {
      throw new RpcException({
        status: 400,
        message: `Email harus menggunakan domain perusahaan @${domain}`,
      });
    }
  }
}
