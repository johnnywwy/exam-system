import { Controller, Get } from '@nestjs/common';
import { ExamService } from './exam.service';

@Controller()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  getHello(): string {
    return this.examService.getHello();
  }
}
