import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_PATTERNS,
  EMPLOYEE_PATTERNS,
  type ActorContext,
  type CreateEmployeePayload,
  type LoginPayload,
  type UpdateEmployeePayload,
  type UpdateMyProfilePayload,
} from '@app/common';
import { EmployeeService } from './employee.service';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  login(@Payload() payload: LoginPayload) {
    return this.employeeService.login(payload);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.GET_ME)
  getMe(@Payload() actor: ActorContext) {
    return this.employeeService.getMe(actor);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.UPDATE_ME)
  updateMe(@Payload() payload: UpdateMyProfilePayload) {
    return this.employeeService.updateMe(payload);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.LIST)
  list() {
    return this.employeeService.list();
  }

  @MessagePattern(EMPLOYEE_PATTERNS.GET)
  get(@Payload() payload: { employeeId: string }) {
    return this.employeeService.getById(payload.employeeId);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.CREATE)
  create(@Payload() payload: CreateEmployeePayload) {
    return this.employeeService.create(payload);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.UPDATE)
  update(@Payload() payload: UpdateEmployeePayload) {
    return this.employeeService.update(payload);
  }
}
