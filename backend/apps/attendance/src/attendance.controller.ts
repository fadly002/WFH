import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ATTENDANCE_PATTERNS,
  type AdminAttendanceQuery,
  type ClockPayload,
  type DateRangePayload,
} from '@app/common';
import { AttendanceService } from './attendance.service';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern(ATTENDANCE_PATTERNS.CLOCK)
  clock(@Payload() payload: ClockPayload) {
    return this.attendanceService.clock(payload);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.SUMMARY)
  summary(@Payload() payload: DateRangePayload) {
    return this.attendanceService.summary(payload);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.LIST_ALL)
  listAll(@Payload() payload: AdminAttendanceQuery) {
    return this.attendanceService.listAll(payload);
  }
}
