import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { UtilsService } from 'src/common/utils.service';

@Injectable()
export class AgodaService {
  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
  ) {}

  async getAgodaHotelInfosByCity(city: string) {
    console.log(city);
    const { browser, page } = await this.puppeteerService.getBrowser();

    await page.goto('https://www.naver.com');

    await this.utilsService.delayRandomTime();

    await browser.close();
  }
}

/*
https://www.agoda.com/ko-kr/?pcs=1&cid=-1&hl=ko-kr&checkIn=2025-03-17&checkOut=2025-03-18&adults=1&rooms=1&pslc=1&ds=jVx7epDQvXJSl%2BJ%2B
*/
