import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { UtilsService } from 'src/common/utils.service';
import { DateService } from 'src/common/date.service';
import { HotelInfo, Star } from './tripdotcom.dto';
import { Logger } from '@nestjs/common';
import { GptService } from 'src/common/gpt.service';

@Injectable()
export class TripdotcomHotelTop5Service {
  private logger = new Logger();
  private savePath: string;

  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
    private dateService: DateService,
    private gptService: GptService,
  ) {
    this.initializeSavePath();
  }

  // 이미지 저장경로 초기화
  private initializeSavePath() {
    const root = path.resolve('.');
    this.savePath = path.join(
      root,
      'screenshot',
      'tripdotcom',
      this.dateService.getTodayDate(),
    );
    if (!fs.existsSync(this.savePath)) {
      fs.mkdirSync(this.savePath, { recursive: true });
    }
  }

  // 숙소(호텔) 검색 페이지로 이동
  async goToSearchPage(page: Page): Promise<void> {
    try {
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
    } catch (error) {
      throw new Error(`숙소(호텔) 검색 페이지로 이동\n${error.stack}`);
    }
  }

  // 검색 처리
  async searchCity(
    page: Page,
    city: string,
    star: Star,
    dayRange: string[],
  ): Promise<void> {
    try {
      // 도시명 입력
      await page.type('#hotels-destinationV8', city, { delay: 300 });
      await this.utilsService.delayRandomTime('quick');
      // 캘린더 열기
      await page.click('.calendar-container-v8');
      await this.utilsService.delayRandomTime('quick');
      // 기준일 선택
      const calendars = await page.$$('.c-calendar-month');
      const nextMonthCalendar = calendars[1];
      const dayElements = await nextMonthCalendar.$$('.day');
      for (const day of dayRange) {
        const dayIndex = Number(day) - 1;
        await dayElements[dayIndex].click();
        await this.utilsService.delayRandomTime('quick');
      }
      // 별점 클릭
      if (star) {
        const starElements = await page.$$('.star-rate-containerV8 > .rate');
        const starIndex = Number(star) - 2;
        await starElements[starIndex].click();
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
    } catch (error) {
      throw new Error(`검색 처리\n${error.stack}`);
    }
  }

  // 리뷰순으로 정렬
  async sortByReviewCount(page: Page): Promise<void> {
    try {
      // 정렬 탭 클릭
      await page.click('.tab-sort-v8');
      await this.utilsService.delayRandomTime('quick');
      // 정렬 탭에서 리뷰순 클릭
      const tapOptions = await page.$$('.drop-options');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        tapOptions[2].click(),
      ]);
      await this.utilsService.delayRandomTime('slow');
    } catch (error) {
      throw new Error(`리뷰순으로 정렬\n${error.stack}`);
    }
  }

  // 로그인 페이지 처리
  async processLoginPage(page: Page): Promise<void> {
    try {
      const isLoginPage = await page.$('.ibu_login_online');
      if (isLoginPage) {
        await this.utilsService.delayRandomTime('quick');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.goBack(),
        ]);
        await this.utilsService.delayRandomTime('slow');
      }
    } catch (error) {
      throw new Error(`로그인 페이지 처리\n${error.stack}`);
    }
  }

  // 호텔 각 상세 정보 가져오기
  async getHotelDetail(hotelPage: Page, selector: string): Promise<string> {
    await hotelPage.waitForSelector(selector);
    const detail = await hotelPage.$eval(
      selector,
      (element) => (element as HTMLElement).innerText,
    );
    await this.utilsService.delayRandomTime('quick');
    return detail;
  }

  // 호텔 이미지 url 목록
  async getHotelImgUrls(hotelPage: Page): Promise<string[]> {
    const imgUrls = [];
    // 이미지 선택기 목록 가져오기
    const imgSelectors = await hotelPage.$$('.headAlbum_headAlbum_img__vfjQm');
    for (let i = 0; i < imgSelectors.length - 1; i += 1) {
      // 특정 이미지 선택기 클릭
      await imgSelectors[i].click();
      await this.utilsService.delayRandomTime('slow');
      // 특정 이미지 url 가져오기
      await hotelPage.waitForSelector(
        '.EbPLUEOH7RimYsS10M9X > .VouSwSHeDhUzR1MmyiCA',
      );
      const imgUrl = await hotelPage.$eval(
        '.EbPLUEOH7RimYsS10M9X > .VouSwSHeDhUzR1MmyiCA',
        (element) => element.getAttribute('src'),
      );
      imgUrls.push(imgUrl);
      // 선택된 이미지 닫기
      await hotelPage.click('.o7kWSgJIe2nzJrtBhUs0');
      await this.utilsService.delayRandomTime('slow');
    }
    return imgUrls;
  }

  // 호텔 객실 정보 이미지 캡쳐
  async captureHotelRoomImg(hotelPage: Page, hotelName: string): Promise<void> {
    const roomImgs = await hotelPage.$$(
      '.mainRoomList__UlISo > .commonRoomCard__BpNjl',
    );
    const firstRoomImg = roomImgs[0];
    // 호텔 객실 정보 이미지가 보일 때 까지 스크롤
    await hotelPage.evaluate((element) => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, firstRoomImg);
    const imgName = `${hotelName}_객실정보.png`;
    const imgPath = path.join(this.savePath, imgName);
    await firstRoomImg.screenshot({ path: imgPath });
  }

  // 호텔 정보 가져오기
  async getHotelInfos(page: Page): Promise<HotelInfo[]> {
    const hotelInfos = [];
    let hotelRank = 1;
    const hotelElements = (await page.$$('.hotel-info')).slice(0, 5);
    for (const hotelElement of hotelElements) {
      // 호텔 페이지 열기
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
      // 이미지 url 목록
      const hotelImgUrls = await this.getHotelImgUrls(hotelPage);
      // 객실정보 캡쳐
      await this.captureHotelRoomImg(hotelPage, hotelName);

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
      await hotelPage.close();
      hotelRank += 1;
    }
    return hotelInfos;
  }

  // 호텔 이미지 목록 캡쳐하기
  async captureHotelImgs(page: Page, hotelInfos: HotelInfo[]) {
    try {
      for (const hotelInfo of hotelInfos) {
        const { name: hotelName, imgUrls } = hotelInfo;
        let imgNum = 1;
        for (const imgUrl of imgUrls) {
          // 이미지 페이지로 이동
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            page.goto(imgUrl),
          ]);
          // 이미지 캡쳐
          const imgElement = await page.waitForSelector('img');
          const imgName = `${hotelName}_${imgNum}.png`;
          const imgPath = path.join(this.savePath, imgName);
          await imgElement.screenshot({ path: imgPath });
          imgNum += 1;
        }
      }
    } catch (error) {
      throw new Error(
        '호텔 이미지 목록 캡쳐중 에러가 발생했습니다.\n-이미지 페이지로 이동\n이미지 캡쳐',
      );
    }
  }

  async createCityDescMent(city: string) {
    const prompt = `입력된 도시를 소개하는 멘트를 20글자 내외로 생성.\n도시: ${city}.\n예시: 전통이 살아 숨쉬는 일본의 옛 수도 교토.`;
    try {
      const gptResponse = await this.gptService.generateGptResponse(prompt);
      return gptResponse;
    } catch (error) {
      throw new Error(error);
    }
  }

  createHeadLine(star: Star) {
    switch (star) {
      case '3':
        return '3성급 가성비 호텔';
      case '4':
        return '4성급 고급 호텔';
      case '5':
        return '5성급 럭셔리 호텔';
      default:
        return '추천 호텔';
    }
  }

  createHashTag(city: string) {
    return `#${city} #${city}여행 #${city}호텔 #${city}호텔추천`;
  }

  createDateStandard(dateRange: string[]) {
    return `[가격기준일] ${dateRange[0]}(일)~${dateRange[1]}(화)`;
  }

  createTitle(city: string, star: Star) {
    const headLine = this.createHeadLine(star);
    const hashTag = this.createHashTag(city);
    return `${city} ${headLine} TOP5 ${hashTag}`;
  }

  // 콘텐츠 만들기
  async createScript(
    hotelInfos: HotelInfo[],
    city: string,
    star: Star,
  ): Promise<string> {
    const cityDescMent = await this.createCityDescMent(city);
    const headLine = `이곳에 위치한 ${this.createHeadLine(star)} 다섯 곳을 준비했습니다.\n매일 업로드되는 호텔 추천을 받고 싶으시면 구독 눌러주세요.`;
    const shorts = [];
    for (const hotelInfo of hotelInfos) {
      const { name, price, score, reviewCount, summary, rank } = hotelInfo;
      const short = `${rank}위 ${name}.\n${summary}\n5점 만점에 ${score}점.\n${reviewCount}.\n1박 ${price}으로 ${rank}위.`;
      shorts.push(short);
    }
    const content = shorts.join('\n');
    const closingMent = '댓글을 열어 최저가 링크를 확인해주세요.';
    const script = `${cityDescMent}\n${headLine}\n${content}\n${closingMent}`;
    return script;
  }

  createDescField(hotelInfos: HotelInfo[], city: string, dateStandard: string) {
    const hashTag = this.createHashTag(city);

    return `${dateStandard}\n\n\n${hashTag}`;
  }

  // 생성된 콘텐츠 보여주기
  showContents(
    title: string,
    script: string,
    dateStandard: string,
    descField: string,
  ): void {
    console.log('-------------------컨텐츠제목-------------------');
    console.log(title);
    console.log('-------------------컨텐츠대본-------------------');
    console.log(script);
    console.log('-------------------가격기준일-------------------');
    console.log(dateStandard);
    console.log('-------------------설명란----------------------');
    console.log(descField);
    console.log('----------------------------------------------');
  }

  async getHotelTop5(city: string, star: Star) {
    const { browser, page } = await this.puppeteerService.getBrowser();
    const { dateRange, dayRange } = this.dateService.getTripdotcomRange();

    try {
      this.logger.log('Processing: 숙소(호텔) 검색 페이지로 이동');
      await this.goToSearchPage(page);

      this.logger.log('Processing: 검색 처리');
      await this.searchCity(page, city, star, dayRange);

      this.logger.log('Processing: 리뷰순으로 정렬');
      await this.sortByReviewCount(page);

      this.logger.log('Processing: 로그인 페이지 처리');
      await this.processLoginPage(page);

      this.logger.log('Processing: 호텔 정보 목록 가져오기');
      const hotelInfos = await this.getHotelInfos(page);

      this.logger.log('Processing: 호텔 이미지 목록 캡쳐하기');
      await this.captureHotelImgs(page, hotelInfos);

      this.logger.log('Processing: 콘텐츠 생성하기');
      const title = this.createTitle(city, star);
      const script = await this.createScript(hotelInfos, city, star);
      const dateStandard = this.createDateStandard(dateRange);
      const descField = this.createDescField(hotelInfos, city, dateStandard);

      this.logger.log('Success: 작업을 완료하였습니다.');
      this.showContents(title, script, dateStandard, descField);
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
}
