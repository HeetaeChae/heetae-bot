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

  // 호텔 검색으로 이동
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

  // 검색 처리
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

  // 리뷰순으로 정렬
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

  // 로그인 페이지 처리
  async processLoginPage(page: Page) {
    await this.utilsService.delayRandomTime('quick');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goBack(),
    ]);
    await this.utilsService.delayRandomTime('slow');
  }

  // 호텔 각 시설별 이미지 캡쳐
  async captureHotelImgs(hotelPage: Page, hotelName: string) {
    // 이미지 저장 경로
    const root = path.resolve('.');
    const savePath = path.join(root, 'screenshot', 'tripdotcom');
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    // 이미지 캡쳐
    const imgSelectors = await hotelPage.$$('.headAlbum_headAlbum_img__vfjQm');
    for (let i = 0; i < imgSelectors.length - 1; i += 1) {
      // 이미지 선택기 클릭
      await imgSelectors[i].click();
      await this.utilsService.delayRandomTime('slow');
      // 선택된 이미지 캡쳐
      const imgElement = await hotelPage.waitForSelector(
        '.EbPLUEOH7RimYsS10M9X > .VouSwSHeDhUzR1MmyiCA',
      );
      const imgBox = await imgElement.boundingBox();
      await hotelPage.screenshot({
        path: path.join(savePath, `${hotelName}_${i + 1}.png`),
        clip: {
          x: imgBox.x,
          y: imgBox.y,
          width: imgBox.width,
          height: imgBox.height,
        },
      });
      // 선택된 이미지 닫기
      await hotelPage.click('.o7kWSgJIe2nzJrtBhUs0');
      await this.utilsService.delayRandomTime('slow');
    }
  }

  // 호텔 각 상세 정보 가져오기
  async getHotelDetail(hotelPage: Page, selector: string) {
    const [_, detail] = await Promise.all([
      hotelPage.waitForSelector(selector),
      hotelPage.$eval(
        selector,
        (element) => (element as HTMLElement).innerText,
      ),
    ]);
    await this.utilsService.delayRandomTime('quick');
    return detail;
  }

  // 호텔 정보 가져오기
  async getHotelInfos(page: Page) {
    const hotelInfos = [];

    const hotelElements = (await page.$$('.hotel-info')).slice(0, 5);
    for (const hotelElement of hotelElements) {
      const [hotelPage] = await Promise.all([
        new Promise<Page>((resolve) => page.once('popup', resolve)),
        hotelElement.click(),
      ]);
      await this.utilsService.delayRandomTime('slow');

      // 이름
      const hotelName = await this.getHotelDetail(
        hotelPage,
        '.headInit_headInit-title_nameA__EE_LB',
      );

      // 가격
      const hotelPrice = await this.getHotelDetail(
        hotelPage,
        '.priceBox_priceBox-container_realPrice__4VuNW',
      );

      // drawer 열기
      const drawerSelector = await Promise.race([
        hotelPage
          .waitForSelector('.headReview_headReviewV2__DDg7J')
          .then(() => '.headReview_headReviewV2__DDg7J'),
        hotelPage
          .waitForSelector('.headReviewNew_reviewSwitch-review_numA__Qv6sO')
          .then(() => '.headReviewNew_reviewSwitch-review_numA__Qv6sO'),
      ]);
      await hotelPage.click(drawerSelector);
      await this.utilsService.delayRandomTime('slow');

      // 호텔 평점
      const hotelScore = await this.getHotelDetail(
        hotelPage,
        '.reviewScores_reviewOverallScores-currentScore__v5Qtj',
      );

      // 리뷰 개수
      const hotelReviewCnt = await this.getHotelDetail(
        hotelPage,
        '.reviewScores_reviewOverallScores-scoreCount__AkXS5',
      );

      // 요약
      const hotelSummary = await this.getHotelDetail(
        hotelPage,
        '.aiSummary_aiSummary-summary__sWsfB',
      );

      // drawer 닫기
      await hotelPage.click('.drawer_drawerContainer-icon__46_Vj');
      await this.utilsService.delayRandomTime('slow');

      const hotelInfo = {
        name: hotelName,
        price: hotelPrice,
        score: hotelScore,
        reviewCount: hotelReviewCnt,
        summary: hotelSummary,
      };
      hotelInfos.push(hotelInfo);

      // 호텔 사진 캡쳐
      await this.captureHotelImgs(hotelPage, hotelName);

      await hotelPage.close();
    }
    return hotelInfos;
  }

  // 호텔 정보 출력하기
  showHotelInfos(hotelInfos: {
    name: string;
    price: string;
    score: string;
    reviewCount: string;
    summary: string;
  }) {}

  async getHotelInfosByCity(city: string) {
    const { browser, page } = await this.puppeteerService.getBrowser();
    // 호텔 검색으로 이동
    await this.goToSearchPage(page);
    // 검색 처리
    await this.searchCity(page, city);
    // 리뷰순으로 정렬
    await this.sortByReviewCount(page);
    // 로그인 페이지 처리
    const isLoginPage = await page.$('.ibu_login_online');
    if (isLoginPage) {
      await this.processLoginPage(page);
    }
    // 호텔 정보 가져오기
    const hotelInfos = await this.getHotelInfos(page);
    // 호텔 정보 출력하기
    console.log(hotelInfos);
    // await browser.close();
  }
}
