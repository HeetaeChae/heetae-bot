import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  getRandomTime() {
    const min = 1000;
    const max = 3000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async delayRandomTime() {
    const randomTime = this.getRandomTime();
    await new Promise((resolve) => setTimeout(resolve, randomTime));
  }
}
