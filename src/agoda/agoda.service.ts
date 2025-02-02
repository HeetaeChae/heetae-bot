import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { UtilsService } from 'src/common/utils.service';
import { DateService } from 'src/common/date.service';

interface HotelInfo {
  name: string;
  price: string;
  score: string;
  reviewCount: string;
  summary: string;
  rank: number;
  imgUrls: string[];
}

@Injectable()
export class AgodaService {
  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
    private dateService: DateService,
  ) {}

  // 호텔 검색으로 이동
  async goToSearchPage(page: Page): Promise<void> {
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
  async searchCity(page: Page, city: string): Promise<void> {
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
    const dayRange = this.dateService.getTripdotcomDayRange();
    for (const day of dayRange) {
      const dayIndex = Number(day) - 1;
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
  async sortByReviewCount(page: Page): Promise<void> {
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
  async processLoginPage(page: Page): Promise<void> {
    await this.utilsService.delayRandomTime('quick');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goBack(),
    ]);
    await this.utilsService.delayRandomTime('slow');
  }

  // 호텔 각 상세 정보 가져오기
  async getHotelDetail(hotelPage: Page, selector: string): Promise<string> {
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

  // 호텔 이미지 urls 가져오기
  async getHotelImgUrls(hotelPage: Page): Promise<string[]> {
    const imgUrls = [];
    // 이미지 선택기들 가져오기
    const imgSelectors = await hotelPage.$$('.headAlbum_headAlbum_img__vfjQm');
    for (let i = 0; i < imgSelectors.length - 1; i += 1) {
      // 이미지 선택기 클릭
      await imgSelectors[i].click();
      await this.utilsService.delayRandomTime('slow');
      // 이미지 url 가져오기
      await hotelPage.waitForSelector(
        '.EbPLUEOH7RimYsS10M9X > .VouSwSHeDhUzR1MmyiCA',
      );
      const imgUrl = await hotelPage.$eval(
        '.EbPLUEOH7RimYsS10M9X > .VouSwSHeDhUzR1MmyiCA',
        (element) => element.getAttribute('src'),
      );
      console.log(imgUrl);
      imgUrls.push(imgUrl);
      // 선택된 이미지 닫기
      await hotelPage.click('.o7kWSgJIe2nzJrtBhUs0');
      await this.utilsService.delayRandomTime('slow');
    }
    return imgUrls;
  }

  // 호텔 정보 가져오기
  async getHotelInfos(page: Page): Promise<HotelInfo[]> {
    const hotelInfos = [];
    let hotelRank = 1;
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
      // 이미지 url
      const hotelImgUrls = await this.getHotelImgUrls(hotelPage);

      const hotelInfo = {
        name: hotelName,
        price: hotelPrice,
        score: hotelScore,
        reviewCount: hotelReviewCnt,
        summary: hotelSummary,
        imgUrls: hotelImgUrls,
        rank: hotelRank,
      };
      hotelInfos.push(hotelInfo);

      hotelRank += 1;

      await hotelPage.close();
    }
    return hotelInfos;
  }

  async captureHotelImgs(page: Page, hotelInfos: HotelInfo[]) {
    console.log('hotelInfos', hotelInfos);
    // 이미지 저장 경로
    const root = path.resolve('.');
    const savePath = path.join(root, 'screenshot', 'tripdotcom');
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }
    for (const hotelInfo of hotelInfos) {
      console.log('hotelInfo', hotelInfo);
      const { name: hotelName, imgUrls } = hotelInfo;
      let imgNum = 1;
      for (const imgUrl of imgUrls) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.goto(imgUrl),
        ]);
        const imgElement = await page.waitForSelector('img');
        const imgName = `${hotelName}_${imgNum}.png`;
        await imgElement.screenshot({
          path: path.join(savePath, imgName),
        });
        imgNum += 1;
      }
    }
  }

  // 스크립트 만들기
  createScript(hotelInfos: HotelInfo[]) {
    const headLine = `
아시아 여행의 허브, 태국 방콕 
무더운 여름 호캉스하기 좋은
5성급 럭셔리호텔 top3를 준비했습니다.
매일 아침 호텔추천을 받고 싶으시면
구독 눌러주세요.
`;
    const shorts = [];
    for (const hotelInfo of hotelInfos) {
      const { name, price, score, reviewCount, summary, rank } = hotelInfo;
      const short = `${rank}위 ${name}\n${summary}\n별점 5점 만점에 ${score}점\n등록된 ${reviewCount}\n1박 ${price}으로 ${rank}위에 선정되었습니다.`;
      shorts.push(short);
    }
    const content = shorts.join('\n');
    const closingMent = '댓글을 열어 최저가 링크를 확인하세요.';
    const script = `${headLine}\n${content}\n${closingMent}`;
    return script;
  }

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
    await this.captureHotelImgs(page, hotelInfos);
    // 스크립트 생성하기
    const script = this.createScript(hotelInfos);
    console.log(script);
    await browser.close();
  }
}
