import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class DateService {
  getTripdotcomRange(): { dateRange: string[]; dayRange: string[] } {
    const startDate = dayjs()
      .add(1, 'month')
      .startOf('week')
      .format('YYYY-MM-DD');
    const endDate = dayjs(startDate).add(2, 'day').format('YYYY-MM-DD');
    const dateRange = [startDate, endDate].map((date) =>
      dayjs(date).format('YYYY.MM.DD'),
    );
    const dayRange = [startDate, endDate].map((date) => date.split('-')[2]);
    return { dateRange, dayRange };
  }

  getTodayDate(): string {
    const todayDate = dayjs().format('YYYY-MM-DD');
    return todayDate;
  }
}
