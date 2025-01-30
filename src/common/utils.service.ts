import { Injectable } from '@nestjs/common';

type Delay = 'quick' | 'slow';

@Injectable()
export class UtilsService {
  getRandomTime(delay: Delay) {
    let min = 0;
    let max = 0;
    switch (delay) {
      case 'quick':
        min = 500;
        max = 2000;
        break;
      case 'slow':
        min = 2000;
        max = 3000;
        break;
      default:
        break;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async delayRandomTime(delay: Delay) {
    const randomTime = this.getRandomTime(delay);
    await new Promise((resolve) => setTimeout(resolve, randomTime));
  }
}
