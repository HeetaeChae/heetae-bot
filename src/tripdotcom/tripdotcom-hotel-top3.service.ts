import { Injectable } from '@nestjs/common';
import { ElementHandle, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { UtilsService } from 'src/common/utils.service';
import { DateService } from 'src/common/date.service';
import { HotelInfo, PriceInfo, Star } from './tripdotcom.dto';
import { Logger } from '@nestjs/common';
import { GptService } from 'src/common/gpt.service';
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TripdotcomHotelTop3Service {
  private logger = new Logger();
  private savePath: string;

  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
    private dateService: DateService,
    private gptService: GptService,
    private configService: ConfigService,
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
        page.goto('https://kr.trip.com/hotels/?locale=ko-kr&curr=KRW'),
      ]);
      await this.utilsService.delayRandomTime('slow');
    } catch (error) {
      throw new Error(`숙소(호텔) 검색 페이지로 이동\n${error.stack}`);
    }
  }

  async handleLogin(page: Page) {
    try {
      await page.waitForSelector('.mc-hd__login-btn');
      await page.click('.mc-hd__login-btn');
      await this.utilsService.delayRandomTime('quick');

      await page.waitForSelector('.way_icon_item.way_icon_na');
      const [navLoginPage] = await Promise.all([
        new Promise<Page>((resolve) => page.once('popup', resolve)),
        page.click('.way_icon_item.way_icon_na'),
      ]);
      await this.utilsService.delayRandomTime('quick');

      const navIdInput = await navLoginPage.$('.input_id');
      const navPassInput = await navLoginPage.$('.input_pw');
      await navIdInput.type(this.configService.get<string>('NAV_ID'), {
        delay: 300,
      });
      await navPassInput.type(this.configService.get<string>('NAV_PASS'), {
        delay: 300,
      });
      await this.utilsService.delayRandomTime('quick');

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        navLoginPage.click('.btn_login.next_step.nlog-click'),
      ]);
      await this.utilsService.delayRandomTime('slow');
    } catch (error) {
      throw new Error(`로그인 페이지 처리\n${error.stack}`);
    }
  }

  // 검색 처리
  async searchCity(
    page: Page,
    city: string,
    dayRange: string[],
    star?: Star,
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

  // 호텔 각 상세 정보 가져오기
  async getHotelDetail(
    hotelPageOrElement: Page | ElementHandle<Element>,
    selector: string,
  ): Promise<string> {
    const isExistSelector = await hotelPageOrElement.$(selector);
    if (!isExistSelector) {
      return null;
    }
    const detail = await hotelPageOrElement.$eval(
      selector,
      (element) => (element as HTMLElement).innerText,
    );
    await this.utilsService.delayRandomTime('quick');
    return detail;
  }

  // 호텔 가격정보 가져오기
  async getHotelPriceInfo(hotelElement: ElementHandle<Element>) {
    const originPrice = await this.getHotelDetail(
      hotelElement,
      '.whole > .underline',
    );
    const salesPrice = await this.getHotelDetail(
      hotelElement,
      '.real > span > div',
    );
    const promotionType = await this.getHotelDetail(
      hotelElement,
      '.promotion-tag',
    );
    const promotionStatus = await this.getHotelDetail(
      hotelElement,
      '.discount-tag',
    );
    return { originPrice, salesPrice, promotionType, promotionStatus };
  }

  // 호텔 시설 이미지 url 목록
  async getHotelFacilityImgUrls(hotelPage: Page): Promise<string[]> {
    const imgUrls = [];
    // 이미지 선택기 목록 가져오기
    const imgSelectors = await hotelPage.$$('.headAlbum_headAlbum_img__vfjQm');
    for (let i = 0; i < 5; i += 1) {
      // 특정 이미지 선택기 클릭
      await imgSelectors[i].click();
      await this.utilsService.delayRandomTime('quick');
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
      await this.utilsService.delayRandomTime('quick');
    }
    return imgUrls;
  }

  // 호텔 객실 이미지 url 목록
  async getHotelRoomImgUrls(hotelPage: Page): Promise<string[]> {
    const imgUrls = [];
    const imgSelectors = await hotelPage.$$(
      '.RY8eZnahPBHWQt9CWRRW > .VouSwSHeDhUzR1MmyiCA',
    );
    await imgSelectors[0].click();
    for (let i = 0; i < 5; i += 1) {
      await this.utilsService.delayRandomTime('quick');
      // 특정 이미지 url 가져오기
      await hotelPage.waitForSelector(
        '.W_JIQ1gJI3tCysgtRwwC > ._3lkI3SSl54meZjmgxmp',
      );
      const imgUrl = await hotelPage.$eval(
        '.W_JIQ1gJI3tCysgtRwwC > ._3lkI3SSl54meZjmgxmp',
        (element) => element.getAttribute('src'),
      );
      imgUrls.push(imgUrl);
      // 다음 사진 보기
      if (i < 4) {
        const nextBtn = await hotelPage.$(
          'nEo4SJE5PWNA8F4eFrJQ.xGABiiravxcy23y5HujR',
        );
        if (!nextBtn) return;
        await nextBtn.click();
        await this.utilsService.delayRandomTime('quick');
      }
    }
    return imgUrls;
  }

  // 호텔 객실 정보 캡쳐
  async captureHotelRoomInfoImg(
    hotelPage: Page,
    hotelName: string,
  ): Promise<void> {
    const roomInfos = await hotelPage.$$(
      '.mainRoomList__UlISo > .commonRoomCard__BpNjl',
    );
    const firstRoomInfo = roomInfos[0];
    // 호텔 객실 정보 이미지가 보일 때 까지 스크롤
    await hotelPage.evaluate((element) => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, firstRoomInfo);
    // 호텔 객실 정보 이미지 스샷 캡쳐
    const imgName = `${hotelName}_객실정보.png`;
    const imgPath = path.join(this.savePath, imgName);
    await firstRoomInfo.screenshot({ path: imgPath });
    // 호텔 객실 이미지 모달 열기
    const roomImgsModalOpener =
      (await firstRoomInfo.$('.baseRoom-singleRoomImgBox_bigImg__BPflu')) ||
      (await firstRoomInfo.$('.baseRoom-singleRoomImgBox_img__f31HV'));
    await roomImgsModalOpener.click();
    await this.utilsService.delayRandomTime('slow');
  }

  // 호텔 정보 가져오기
  async getHotelInfos(page: Page): Promise<HotelInfo[]> {
    const hotelInfos = [];
    let hotelRank = 1;
    const hotelElements = (await page.$$('.hotel-info')).slice(0, 3);
    for (const hotelElement of hotelElements) {
      // 가격 정보
      const hotelPriceInfo = await this.getHotelPriceInfo(hotelElement);
      // 호텔 상세 페이지 열기
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
      // 시설 이미지 url 목록
      const hotelFacilityImgUrls =
        await this.getHotelFacilityImgUrls(hotelPage);
      // 객실정보 캡쳐
      await this.captureHotelRoomInfoImg(hotelPage, hotelName);
      // 객실 이미지 url 목록
      const hotelRoomImgUrls = await this.getHotelRoomImgUrls(hotelPage);

      const hotelInfo = {
        name: hotelName,
        priceInfo: hotelPriceInfo,
        score: hotelScore,
        reviewCount: hotelReviewCnt,
        summary: hotelSummary,
        facilityImgUrls: hotelFacilityImgUrls,
        roomImgUrls: hotelRoomImgUrls,
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
        const { name: hotelName, facilityImgUrls, roomImgUrls } = hotelInfo;
        const imgUrlsList = [facilityImgUrls, roomImgUrls];
        const prefixes = ['시설', '객실'];
        for (let i = 0; i < imgUrlsList.length; i += 1) {
          let imgNum = 1;
          const prefix = prefixes[i];
          for (const imgUrl of imgUrlsList[i]) {
            // 이미지 페이지로 이동
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'load' }),
              page.goto(imgUrl),
            ]);
            // 이미지 캡쳐
            const imgElement = await page.waitForSelector('img');
            const imgName = `${hotelName}_${prefix}_${imgNum}.png`;
            const imgPath = path.join(this.savePath, imgName);
            await imgElement.screenshot({ path: imgPath });
            imgNum += 1;
          }
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

  createHeadLine(star?: Star) {
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

  createPriceInfoShort(priceInfo: PriceInfo): string {
    const { originPrice } = priceInfo;
    const isPromotionHotel = originPrice;
    if (isPromotionHotel) {
      const { salesPrice, promotionType, promotionStatus } = priceInfo;
      const formattedStatus = promotionStatus.split(' ')[0];
      return `1박 ${originPrice}\n링크타고 예약시\n${formattedStatus} ${promotionType}\n${salesPrice}`;
    } else {
      const { salesPrice } = priceInfo;
      return `1박 ${salesPrice}`;
    }
  }

  createShortHashTag(city: string) {
    return `#${city} #${city}여행 #${city}호텔 #${city}호텔추천 #특가 #할인`;
  }

  createLongHashTag(city: string) {
    return `#${city} #${city}여행 #${city}호텔 #${city}호텔추천 #${city}호텔예약 #${city}가성비호텔 #${city}가성비호텔추천 #${city}가성비호텔예약 #${city}숙소 #${city}숙소추천 #${city}숙소예약 #${city}리조트 #${city}리조트추천 #${city}리조트예약 #${city}맛집 #${city}가볼만한곳 #${city}한달살기 #${city}호캉스 #${city}혼자여행 #${city}가족여행`;
  }

  createRelatedWord(city: string) {
    return `${city}, ${city} 여행, ${city} 호텔, ${city} 호텔 추천, ${city} 호텔 예약, ${city} 가성비 호텔, ${city} 가성비 호텔 추천, ${city} 가성비 호텔 예약, ${city}숙소, ${city} 숙소 추천, ${city} 숙소 예약, ${city} 리조트, ${city} 리조트 추천, ${city} 리조트 예약, ${city} 맛집, ${city} 가볼만한곳, ${city} 한달 살기, ${city} 호캉스, ${city} 혼자 여행, ${city} 가족 여행`;
  }

  createDateStandard(dateRange: string[]) {
    return `[가격기준일] ${dateRange[0]}(일)~${dateRange[1]}(화)`;
  }

  createSummaryTxts(hotelInfos: HotelInfo[]) {
    const summaryTxtList = [];
    for (const hotelInfo of hotelInfos) {
      const { name, priceInfo, score, reviewCount, rank } = hotelInfo;
      const { originPrice, salesPrice, promotionType, promotionStatus } =
        priceInfo;
      const isPromotionHotel = originPrice;
      const baseTxt = `${rank}위 ${name}\n⭐ 별점 ${score}점 | ${reviewCount}\n💰 1박 ${originPrice || salesPrice}원`;
      if (isPromotionHotel) {
        summaryTxtList.push(
          baseTxt +
            ` → ${promotionType} ${promotionStatus}!\n📌 ${salesPrice} (추천!)`,
        );
      } else {
        summaryTxtList.push(baseTxt);
      }
    }
    return summaryTxtList.join('\n\n');
  }

  createTitle(city: string, star?: Star) {
    const headLine = this.createHeadLine(star);
    const hashTag = this.createShortHashTag(city);
    return `${city} ${headLine} 특가 할인 TOP3 ${hashTag}`;
  }

  // 콘텐츠 만들기
  async createScript(
    hotelInfos: HotelInfo[],
    city: string,
    star?: Star,
  ): Promise<string> {
    const cityDescMent = await this.createCityDescMent(city);
    const headLine = `이곳에 위치한 특가 할인 진행중인 ${this.createHeadLine(star)} 세 곳을 준비했습니다.\n매일 업로드되는 특가 호텔을 추천 받고 싶으시면 구독 눌러주세요.`;
    const shorts = [];
    for (const hotelInfo of hotelInfos) {
      const { name, priceInfo, score, reviewCount, summary, rank } = hotelInfo;
      const priceInfoShort = this.createPriceInfoShort(priceInfo);
      const short = `${rank}위 ${name}.\n${summary}\n별점 ${score}점, ${reviewCount}.\n${priceInfoShort}으로 ${rank}위.`;
      shorts.push(short);
    }
    const content = shorts.join('\n');
    const closingMent = '댓글을 열어 링크를 확인해주세요.';
    const script = `${cityDescMent}\n${headLine}\n${content}\n${closingMent}`;
    return script;
  }

  // 설명란 만들기
  createDescField(hotelInfos: HotelInfo[], city: string, dateStandard: string) {
    const hashTag = this.createLongHashTag(city);
    const relatedWord = this.createRelatedWord(city);
    const linkList = [];
    for (const hotelInfo of hotelInfos) {
      const { name, rank } = hotelInfo;
      const linkText = `${rank}위. ${name}\n링크첨부`;
      linkList.push(linkText);
    }
    const linkContent = linkList.join('\n\n');

    return `${dateStandard}\n\n\n${linkContent}\n\n\n※ 호텔가격은 가격기준일에 따라 상이할 수 있습니다\n\n\n${hashTag} ${relatedWord}`;
  }

  // 콘텐츠 생성하기
  createContents(
    title: string,
    script: string,
    dateStandard: string,
    summaryTxts: string,
    descField: string,
  ): string {
    return `-컨텐츠제목\n${title}\n\n-컨텐츠대본\n${script}\n\n-가격기준일\n${dateStandard}\n\n-요약텍스트\n${summaryTxts}\n\n-설명란\n${descField}`;
  }

  // 콘텐츠 작성하기
  writeContents(contents: string): void {
    const txtPath = path.join(this.savePath, '콘텐츠.txt');
    // 파일 저장
    fs.writeFileSync(txtPath, contents, 'utf8');
  }

  // savePath 열기
  openSavePath(): void {
    if (process.platform === 'win32') {
      exec(`explorer "${this.savePath}"`); // Windows 탐색기에서 열기
    } else if (process.platform === 'darwin') {
      exec(`open "${this.savePath}"`); // macOS Finder에서 열기
    } else {
      exec(`xdg-open "${this.savePath}"`); // Linux 파일 관리자에서 열기
    }
  }

  async getHotelTop3(city: string, star?: Star) {
    const { browser, page } = await this.puppeteerService.getBrowser();
    const { dateRange, dayRange } = this.dateService.getTripdotcomRange();

    try {
      this.logger.log('Processing: 숙소(호텔) 검색 페이지로 이동');
      await this.goToSearchPage(page);

      this.logger.log('Processing: 로그인 처리');
      await this.handleLogin(page);

      this.logger.log('Processing: 검색 처리');
      await this.searchCity(page, city, dayRange, star);

      this.logger.log('Processing: 리뷰순으로 정렬');
      await this.sortByReviewCount(page);

      this.logger.log('Processing: 호텔 정보 목록 가져오기');
      const hotelInfos = await this.getHotelInfos(page);

      this.logger.log('Processing: 호텔 이미지 목록 캡쳐하기');
      await this.captureHotelImgs(page, hotelInfos);

      this.logger.log('Processing: 콘텐츠 생성하기');
      const title = this.createTitle(city, star);
      const script = await this.createScript(hotelInfos, city, star);
      const dateStandard = this.createDateStandard(dateRange);
      const summaryTxts = this.createSummaryTxts(hotelInfos);
      const descField = this.createDescField(hotelInfos, city, dateStandard);
      const contents = this.createContents(
        title,
        script,
        dateStandard,
        summaryTxts,
        descField,
      );

      this.logger.log('Processing: 콘텐츠 작성하기');
      this.writeContents(contents);

      this.logger.log('Success: 작업을 완료하였습니다.');
      this.openSavePath();
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
    } finally {
      await browser.close();
    }
  }

  async test(city: string, minPrice: number, maxPrice: number) {
    const { browser, page } = await this.puppeteerService.getBrowser();
    const { dateRange, dayRange } = this.dateService.getTripdotcomRange();

    this.logger.log('Processing: 숙소(호텔) 검색 페이지로 이동');
    await this.goToSearchPage(page);

    // TODO: 네이버 로그인
    this.logger.log('Processing: 로그인 처리');
    await this.handleLogin(page);

    this.logger.log('Processing: 검색 처리');
    await this.searchCity(page, city, dayRange);

    // TODO: 가격 범위 설정
    const minPointer = await page.waitForSelector('.price-range-floor');
    const maxPointer = await page.waitForSelector('.price-range-ceil');

    const { x: minX, y: minY } = await minPointer.boundingBox();
    const { x: maxX, y: maxY } = await maxPointer.boundingBox();
    console.log(minX, minY, maxX, maxY);

    const priceTxts = await page.$$eval('.price-tooltip', (elements) =>
      elements.map((element) => (element as HTMLElement).innerText),
    );
    console.log(priceTxts);

    let curMinX = minX + 1;
    let curMaxX = maxX;
    for (let i = 0; i < 10; i += 1) {
      // min pointer가 1px 좌측에 위치함.
      await page.mouse.move(curMinX, minY);
      await page.mouse.down();

      curMinX += 5;

      await page.mouse.move(curMinX, minY);
      await page.mouse.up();
      await this.utilsService.delayRandomTime('quick');
    }

    for (let i = 0; i < 10; i += 1) {
      await page.mouse.move(curMaxX, maxY);
      await page.mouse.down();

      curMaxX -= 5;

      await page.mouse.move(curMaxX, maxY);
      await page.mouse.up();
      await this.utilsService.delayRandomTime('quick');
    }
  }
}
