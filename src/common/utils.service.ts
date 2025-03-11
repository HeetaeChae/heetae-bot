import { Injectable } from '@nestjs/common';

type Delay = 'quick' | 'slow';

interface ElementTree {
  type: string;
  text: string | null;
  elementTree: ElementTree[] | null;
}

@Injectable()
export class UtilsService {
  async delayRandomTime(delay: Delay) {
    const time = { min: 0, max: 0 };
    if (delay === 'quick') {
      Object.assign(time, { min: 500, max: 2000 });
    }
    if (delay === 'slow') {
      Object.assign(time, { min: 2000, max: 3000 });
    }

    const randomTime =
      Math.floor(Math.random() * (time.max - time.min + 1)) + time.min;
    await new Promise((resolve) => setTimeout(resolve, randomTime));
  }
}
