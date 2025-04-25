import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'puppeteer';
import * as dayjs from 'dayjs';

import { BlogV1Prompts } from 'src/common/contants/prompts';
import { BlogV1Styles } from 'src/common/contants/styles';
import { BlogV1Templates } from 'src/common/contants/templates';
import { HotelType } from 'src/common/enums/hotel-type.enum';
import { HotelInfoV1 } from 'src/common/interfaces/hotel-info.interface';
import { GptService } from 'src/common/services/gpt.service';
import { PuppeteerService } from 'src/common/services/puppeteer.service';
import { UtilsService } from 'src/common/services/utils.service';

@Injectable()
export class BlogV2Service {
  constructor(
    private puppeteerService: PuppeteerService,
    private configService: ConfigService,
    private utilsService: UtilsService,
    private gptService: GptService,
  ) {}

  async searchGoogleHotels(page: Page, city: string, hotelType: HotelType) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto(`https://www.google.com/travel/search?q=${city}`),
    ]);

    const displayedFilterBox = await this.puppeteerService.clickElementByText(
      page,
      '.VfPpkd-vQzf8d',
      '모든 필터',
    );
    if (displayedFilterBox) {
      await this.puppeteerService.clickElementByText(
        page,
        '.VfPpkd-V67aGc',
        '리뷰가 가장 많음',
      );

      switch (hotelType) {
        case HotelType.PRICE_UNDER_5:
          //
          break;
        case HotelType.PRICE_UNDER_10:
          //
          break;
        case HotelType.PRICE_ABOUT_10:
          //
          break;
        case HotelType.PRICE_ABOUT_20:
          //
          break;
        case HotelType.FACILITY_SPA:
          //
          break;
        case HotelType.FACILITY_POOL:
          //
          break;
        case HotelType.FACILITY_BAR:
          //
          break;
      }
    }
  }

  async getHotelUrls() {}

  async getHotelInfos() {}

  async getAffiliateLinks() {}

  async devBlogPosting() {
    const city = '후쿠오카';
    const hotelType = HotelType.PRICE_UNDER_10;

    const { browser, page } = await this.puppeteerService.getBrowser();

    // 1. google 호텔 검색하기
    await this.searchGoogleHotels(page, city, hotelType);

    // 2. 검색된 호텔 url 가져오기

    // 3. 호텔 정보 가져오기

    // 4. 제휴 링크 가져오기
  }
}
