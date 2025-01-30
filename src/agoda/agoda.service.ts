import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { UtilsService } from 'src/common/utils.service';

@Injectable()
export class AgodaService {
  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
  ) {}

  getCalendarDateRange(): string[] {
    const startDate = dayjs()
      .add(1, 'month')
      .startOf('week')
      .format('YYYY-MM-DD');
    const endDate = dayjs(startDate).add(2, 'day').format('YYYY-MM-DD');

    return [startDate, endDate].map((day) => day.split('-')[2]);
  }

  async goToSearchPage(page: Page) {
    // 트립닷컴 이동
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://kr.trip.com/?locale=ko-kr'),
    ]);
    await this.utilsService.delayRandomTime('slow');
    // 숙소 태그 클릭
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('#header_action_nav_hotels'),
    ]);
    await this.utilsService.delayRandomTime('slow');
  }

  async searchCity(page: Page, city: string) {
    // 도시명 타이핑
    await page.type('#hotels-destinationV8', city, { delay: 300 });
    await this.utilsService.delayRandomTime('quick');
    // 캘린더 열기
    await page.click('.calendar-container-v8');
    await this.utilsService.delayRandomTime('quick');
    // 시작일, 마지막일 선택
    const calendars = await page.$$('.c-calendar-month');
    const nextMonthCalendar = calendars[1];
    const dayElements = await nextMonthCalendar.$$('.day');
    const dateRange = this.getCalendarDateRange();
    for (const date of dateRange) {
      const dayIndex = Number(date) - 1;
      dayElements[dayIndex].click();
      await this.utilsService.delayRandomTime('quick');
    }
    // 검색 버튼 클릭
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click(
        '.tripui-online-btn.tripui-online-btn-large.tripui-online-btn-solid-primary',
      ),
    ]);
    await this.utilsService.delayRandomTime('slow');
  }

  async sortByReviewCount(page: Page) {
    // 정렬 탭 클릭
    await page.click('.tab-sort-v8');
    await this.utilsService.delayRandomTime('quick');
    // 리뷰 순 옵션으로 정렬 클릭
    const tapOptions = await page.$$('.drop-options');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      tapOptions[2].click(),
    ]);
    await this.utilsService.delayRandomTime('slow');
  }

  async captureHotelImgs(page: Page, hotelName: string) {
    const root = path.resolve('.');
    const savePath = path.join(root, 'screenshot', 'tripdotcom');
    const imgElements = await page.$$('.headAlbum_headAlbum_img__vfjQm');
    console.log(imgElements);
    let imgCount = 1;
    for (const imgElement of imgElements) {
      console.log(imgElement);
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }
      const fullPath = path.join(savePath, `${hotelName}_${imgCount}.png`);
      await imgElement.screenshot({ path: fullPath });
      imgCount += 1;
    }
  }

  async getHotelInfos(page: Page) {
    const hotelElements = (await page.$$('.hotel-info')).slice(0, 5);
    const hotelInfos = [];
    for (const hotelElement of hotelElements) {
      const [hotelPage] = await Promise.all([
        new Promise<Page>((resolve) => page.once('popup', resolve)),
        hotelElement.click(),
      ]);
      await this.utilsService.delayRandomTime('quick');
      // 호텔 명
      const [_name, name] = await Promise.all([
        await hotelPage.waitForSelector(
          '.headInit_headInit-title_nameA__EE_LB',
        ),
        await hotelPage.$eval(
          '.headInit_headInit-title_nameA__EE_LB',
          (nameElement) => (nameElement as HTMLElement).innerText,
        ),
      ]);
      // 호텔 가격
      const [_price, price] = await Promise.all([
        await hotelPage.waitForSelector(
          '.priceBox_priceBox-container_realPrice__4VuNW',
        ),
        await hotelPage.$eval(
          '.priceBox_priceBox-container_realPrice__4VuNW',
          (priceElement) => (priceElement as HTMLElement).innerText,
        ),
      ]);
      /*
      // 호텔 평점
      const [_score, score] = await Promise.all([
        await hotelPage.waitForSelector(
          '.headReview_headReviewV2-scoreBox_bold__iELuw',
        ),
        await hotelPage.$eval(
          '.headReview_headReviewV2-scoreBox_bold__iELuw',
          (scoreElement) => (scoreElement as HTMLElement).innerText,
        ),
      ]);
      // 리뷰 개수
      const [_reviewCount, reviewCount] = await Promise.all([
        await hotelPage.waitForSelector(
          '.headReview_headReviewV2-totalNumText__eLhiz',
        ),
        await hotelPage.$eval(
          '.headReview_headReviewV2-totalNumText__eLhiz',
          (reviewElement) => (reviewElement as HTMLElement).innerText,
        ),
      ]);
      // 요약
      await hotelPage.click('.headReview_headReviewV2__DDg7J');
      await this.utilsService.delayRandomTime('quick');
      const [_summary, summary] = await Promise.all([
        await hotelPage.waitForSelector('.aiSummary_aiSummary-summary__sWsfB'),
        await hotelPage.$eval(
          '.aiSummary_aiSummary-summary__sWsfB',
          (summaryElement) => (summaryElement as HTMLElement).innerText,
        ),
      ]);
      await hotelPage.click('.drawer_drawerContainer-icon__46_V');
      */
      // 호텔 사진
      await this.captureHotelImgs(hotelPage, name);
      const hotelInfo = {
        name,
        price,
        /*
        score: `${score}점`,
        reviewCount,
        summary,
        */
      };
      hotelInfos.push(hotelInfo);
      await hotelPage.close();
    }
    console.log(hotelInfos);
  }

  async getHotelInfosByCity(city: string) {
    const { browser, page } = await this.puppeteerService.getBrowser();
    // 호텔 검색으로 이동
    await this.goToSearchPage(page);
    // 검색
    await this.searchCity(page, city);
    // 리뷰순으로 정렬
    await this.sortByReviewCount(page);
    // 로그인 페이지 처리
    const isLoginPage = await page.$('.ibu_login_online');
    if (isLoginPage) {
      await page.goBack();
    }
    // 호텔 정보 가져오기
    await this.getHotelInfos(page);
    // await browser.close();
  }
}
