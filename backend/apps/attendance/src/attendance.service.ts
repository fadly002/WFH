import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AttendanceType } from '@prisma/client';
import { PrismaService } from '@app/common';
import type {
  ActorContext,
  AdminAttendanceQuery,
  ClockPayload,
  DateRangePayload,
} from '@app/common';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clock(payload: ClockPayload) {
    if (payload.actor.role !== 'EMPLOYEE') {
      throw new RpcException({ status: 403, message: 'Hanya karyawan yang dapat absen' });
    }

    const employee = await this.prisma.employee.findUnique({
      where: { userId: payload.actor.userId },
    });

    if (!employee) {
      throw new RpcException({ status: 404, message: 'Profil karyawan tidak ditemukan' });
    }

    const { start, end } = this.todayRange();
    const todayRecords = await this.prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: 'asc' },
    });

    const hasMasuk = todayRecords.some((row) => row.type === AttendanceType.MASUK);
    const hasPulang = todayRecords.some((row) => row.type === AttendanceType.PULANG);

    if (payload.type === 'MASUK' && hasMasuk) {
      throw new RpcException({ status: 409, message: 'Anda sudah absen masuk hari ini' });
    }

    if (payload.type === 'PULANG' && !hasMasuk) {
      throw new RpcException({
        status: 400,
        message: 'Absen pulang hanya bisa setelah absen masuk',
      });
    }

    if (payload.type === 'PULANG' && hasPulang) {
      throw new RpcException({ status: 409, message: 'Anda sudah absen pulang hari ini' });
    }

    const record = await this.prisma.attendance.create({
      data: {
        employeeId: employee.id,
        type: payload.type,
      },
    });

    return {
      id: record.id,
      type: record.type,
      timestamp: record.timestamp,
      employeeId: employee.id,
    };
  }

  async summary(payload: DateRangePayload) {
    if (payload.actor.role !== 'EMPLOYEE') {
      throw new RpcException({ status: 403, message: 'Akses karyawan diperlukan' });
    }

    const employee = await this.prisma.employee.findUnique({
      where: { userId: payload.actor.userId },
    });

    if (!employee) {
      throw new RpcException({ status: 404, message: 'Profil karyawan tidak ditemukan' });
    }

    const range = this.parseRange(payload.from, payload.to);
    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        timestamp: { gte: range.start, lte: range.end },
      },
      orderBy: { timestamp: 'asc' },
    });

    return {
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      rows: this.groupByDate(records),
    };
  }

  async listAll(payload: AdminAttendanceQuery) {
    if (payload.actor.role !== 'ADMIN') {
      throw new RpcException({ status: 403, message: 'Akses admin diperlukan' });
    }

    const now = new Date();
    const from = payload.from ?? this.toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = payload.to ?? this.toDateInput(now);
    const range = this.parseRange(from, to);

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId: payload.employeeId,
        timestamp: { gte: range.start, lte: range.end },
      },
      include: {
        employee: {
          include: { user: { select: { email: true } } },
        },
      },
      orderBy: [{ timestamp: 'desc' }],
    });

    const grouped = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        email: string;
        date: string;
        checkIn: string | null;
        checkOut: string | null;
      }
    >();

    for (const record of records) {
      const date = this.toDateInput(record.timestamp);
      const key = `${record.employeeId}:${date}`;
      const current = grouped.get(key) ?? {
        employeeId: record.employeeId,
        employeeName: record.employee.name,
        email: record.employee.user.email,
        date,
        checkIn: null,
        checkOut: null,
      };

      const stamp = record.timestamp.toISOString();
      if (record.type === AttendanceType.MASUK) {
        current.checkIn = stamp;
      } else {
        current.checkOut = stamp;
      }
      grouped.set(key, current);
    }

    return {
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      rows: Array.from(grouped.values()).sort((a, b) => {
        if (a.date === b.date) {
          return a.employeeName.localeCompare(b.employeeName);
        }
        return a.date < b.date ? 1 : -1;
      }),
    };
  }

  private groupByDate(
    records: Array<{ type: AttendanceType; timestamp: Date }>,
  ): Array<{ date: string; checkIn: string | null; checkOut: string | null }> {
    const grouped = new Map<
      string,
      { date: string; checkIn: string | null; checkOut: string | null }
    >();

    for (const record of records) {
      const date = this.toDateInput(record.timestamp);
      const current = grouped.get(date) ?? { date, checkIn: null, checkOut: null };
      const stamp = record.timestamp.toISOString();
      if (record.type === AttendanceType.MASUK) {
        current.checkIn = stamp;
      } else {
        current.checkOut = stamp;
      }
      grouped.set(date, current);
    }

    return Array.from(grouped.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  private parseRange(from: string, to: string) {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new RpcException({ status: 400, message: 'Format tanggal tidak valid' });
    }

    if (start > end) {
      throw new RpcException({
        status: 400,
        message: 'Tanggal awal tidak boleh setelah tanggal akhir',
      });
    }

    return { start, end };
  }

  private todayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  private toDateInput(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
