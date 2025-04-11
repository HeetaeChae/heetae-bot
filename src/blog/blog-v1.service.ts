import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'puppeteer';

import { BlogV1Prompts } from 'src/common/contants/prompts';
import { HotelType } from 'src/common/enums/hotel-type.enum';
import { HotelInfoV1 } from 'src/common/interfaces/hotel-info.interface';
import { GptService } from 'src/common/services/gpt.service';
import { PuppeteerService } from 'src/common/services/puppeteer.service';
import { UtilsService } from 'src/common/services/utils.service';

@Injectable()
export class BlogV1Service {
  constructor(
    private puppeteerService: PuppeteerService,
    private configService: ConfigService,
    private utilesService: UtilsService,
    private gptService: GptService,
  ) {}

  // 1. TRIPDOTCOM => 호텔 페이지 urls 가져오기
  async getTripdotcomHotelUrls(
    city: string,
    type: HotelType,
    page: Page,
  ): Promise<string[]> {
    // 1-1. 페이지 이동
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://kr.trip.com/hotels/?locale=ko-kr&curr=KRW'),
    ]);

    // 1-2. 로그인
    await page.waitForSelector('.mc-hd__login-btn');
    await page.click('.mc-hd__login-btn');
    await page.waitForSelector('.way_icon_item.way_icon_na');
    const [loginPage] = await Promise.all([
      new Promise<Page>((resolve) => page.once('popup', resolve)),
      page.click('.way_icon_item.way_icon_na'),
    ]);
    const navIdInput = await loginPage.waitForSelector('.input_id');
    const navPassInput = await loginPage.waitForSelector('.input_pw');
    await navIdInput.type(this.configService.get<string>('NAV_ID'), {
      delay: 300,
    });
    await navPassInput.type(this.configService.get<string>('NAV_PASS'), {
      delay: 300,
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      loginPage.click('.btn_login.next_step.nlog-click'),
    ]);

    // 1-3. 도시 검색
    await page.type('#hotels-destinationV8', city, { delay: 300 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click(
        '.tripui-online-btn.tripui-online-btn-large.tripui-online-btn-solid-primary',
      ),
    ]);

    // 1-4. 호텔 타입 필터링
    const clickSortingTap = async (index: number): Promise<void> => {
      await page.click('.tab-sort-v8');
      const list = await page.$$('.drop-options');
      await list[index].click();
    };
    const typePriceInput = async (
      step: 'low' | 'high',
      inputValue: string,
    ): Promise<void> => {
      await page.click(`.price-range-input-${step}`);
      await page.click(`.price-range-input-${step}`, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(`.price-range-input-${step}`, inputValue, {
        delay: 300,
      });
    };
    switch (type) {
      case HotelType.GOOD_REVIEW:
        await clickSortingTap(2);
        break;
      case HotelType.GOOD_LOCATION:
        await clickSortingTap(1);
        break;
      case HotelType.GOOD_PRICE:
        await clickSortingTap(3);
        break;
      case HotelType.RECOMMEND:
        await clickSortingTap(0);
        break;
      case HotelType.LUXURY:
        await clickSortingTap(5);
        break;
      case HotelType.UNDER_10:
        await typePriceInput('low', '0');
        await typePriceInput('high', '100000');
        await page.keyboard.press('Enter');
        break;
      case HotelType.ABOUT_10:
        await typePriceInput('low', '100000');
        await typePriceInput('high', '200000');
        await page.keyboard.press('Enter');
        break;
      case HotelType.ABOUT_20:
        await typePriceInput('low', '200000');
        await typePriceInput('high', '300000');
        await page.keyboard.press('Enter');
        break;
      default:
        break;
    }

    // 1-5. 호텔 url 가져오기
    await this.utilesService.delayRandomTime('slow');
    const hotelPageUrls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.list-card-title > a'), (a) => {
        const baseUrl = 'https://kr.trip.com';
        const href = a.getAttribute('href');
        return baseUrl + href;
      }),
    );

    return hotelPageUrls;
  }

  // 2. TRIPDOTCOM => 호텔 정보 가져오기
  async getTripdotcomHotelInfos(
    hotelPageUrls: string[],
    page: Page,
  ): Promise<HotelInfoV1[]> {
    const hotelInfos: HotelInfoV1[] = [];
    for (const url of hotelPageUrls) {
      // 2-1. 호텔 페이지 이동
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(url),
      ]);

      // 2-2. 호텔 사진 urls
      const imgUrls = [];
      const imgOpenerEls = await page.$$('.headAlbum_headAlbum_img__vfjQm');
      for (let i = 0; i < 6; i += 1) {
        const opener = imgOpenerEls[i];
        await this.utilesService.delayRandomTime('quick');
        await opener.click();
        const imgEl = await page.waitForSelector(
          '.RY8eZnahPBHWQt9CWRRW.EbPLUEOH7RimYsS10M9X > img',
        );
        const imgUrl = await imgEl.evaluate(
          (img) => img.getAttribute('src'),
          imgEl,
        );
        imgUrls.push(imgUrl);
        const closer = await page.waitForSelector('.o7kWSgJIe2nzJrtBhUs0');
        await closer.click();
      }
      console.log('imgUrls', imgUrls);

      // 2-3. 호텔 정보 (이름, 부제목, 주소)
      const name = await page.$eval(
        '.headInit_headInit-title_nameA__EE_LB',
        (el) => (el as HTMLElement).innerText,
      );
      const subName = await page.$eval(
        '.headInit_headInit-title_sub__Bxn1N',
        (el) => (el as HTMLElement).innerText,
      );
      const address = await page.$eval(
        '.headInit_headInit-address_text__D_Atv',
        (el) => (el as HTMLElement).innerText,
      );
      console.log('hotelInfo', name, subName, address);

      // 2-4. 호텔 소개
      await page.click(
        '.style_textLinkButton__XwrMR.hotelDescription_hotelDescription-address_showmoreA__Yt1A4',
        { delay: 300 },
      );
      const descList = await page.$$eval(
        '.hotelDescriptionPop_descriptionInfo-desc__sa6Kz',
        (els) => els.map((el) => (el as HTMLElement).innerText),
      );
      await page.click('.hotelDescriptionPop_descriptionInfo-close__kB9Tw');
      console.log(descList);

      // 2-5. 주변 교통
      const trafficInfos = [];
      const trafficEls = await page.$$(
        '.trafficDetail_headTraffic-item__XpIj_',
      );
      for (const trafficEl of trafficEls) {
        const traffic = await trafficEl.$eval(
          '.trafficDetail_headTraffic-item_desc__9VF_q',
          (el) => (el as HTMLElement).innerText,
        );
        const distance = await trafficEl.$eval(
          '.trafficDetail_headTraffic-item_distance__Zoscp',
          (el) => (el as HTMLElement).innerText,
        );
        trafficInfos.push(`${traffic}${distance}`);
      }
      console.log('trafficInfos', trafficInfos);

      // 2-6. AI 리뷰 요약
      await page.click('.headReviewNew_reviewSwitch-review_numA__Qv6sO');
      const aiReviewEl = await page.waitForSelector('._4ZN0iXixwnbuH73hRaw');
      const aiReview = await page.evaluate(
        (el) => (el as HTMLElement).innerText,
        aiReviewEl,
      );
      const drawerCloser = await page.waitForSelector(
        '.u-icon_ic_new_close_line',
      );
      drawerCloser.click();
      console.log('aiReview', aiReview);

      // 2-7. 최저가 찾기
      await this.utilesService.delayRandomTime('quick');
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      const priceOpenerEl = await page.waitForSelector('.i7MrTkrtLpx7POgWf7Hz');
      await priceOpenerEl.evaluate((el) =>
        el.scrollIntoView({ behavior: 'auto', block: 'center' }),
      );
      await priceOpenerEl.click();
      await page.waitForSelector('li.is-selected span.price');
      const priceTexts = await page.$$eval('span.price', (els) =>
        els.map((el) => (el as HTMLElement).innerText),
      );
      const prices = priceTexts
        .map((priceText) => {
          const sliced = priceText.slice(0, -1);
          return Number(sliced);
        })
        .filter((price) => price > 0);
      const lowestPrice = Math.min(...prices);
      console.log('lowestPrice', lowestPrice);

      const hotelInfo: HotelInfoV1 = {
        imgUrls,
        name,
        subName,
        address,
        description: descList.join(' '),
        trafficInfos,
        aiReview,
        lowestPrice,
      };
      hotelInfos.push(hotelInfo);
    }

    return hotelInfos;
  }

  // 3. GPT => 문장 다듬기
  async rewriteHotelInfos(hotelInfos: HotelInfoV1[]) {
    const rewritedHotelInfos = [];

    for (const hotelInfo of hotelInfos) {
      const { description, aiReview, ...etc } = hotelInfo;

      // 3-1. 호텔 소개 글 다듬기
      const rewritedDesc = await this.gptService.generateGptResponse(
        BlogV1Prompts.descriptionRewriting.replace(
          '{description}',
          description,
        ),
        0.7,
      );

      // 3-2. 호텔 ai 리뷰 요약 글 다듬기
      const rewritedAiReivew = await this.gptService.generateGptResponse(
        BlogV1Prompts.descriptionRewriting.replace('{aiReview}', aiReview),
        0.7,
      );

      rewritedHotelInfos.push({
        description: rewritedDesc,
        aiReview: rewritedAiReivew,
        ...etc,
      });
    }

    return rewritedHotelInfos;
  }

  async devHotelPosting() {
    const { browser, page } = await this.puppeteerService.getBrowser();

    // 1. TRIPDOTCOM => 호텔 페이지 urls 가져오기
    const hotelPageUrls = await this.getTripdotcomHotelUrls(
      '후쿠오카',
      HotelType.GOOD_LOCATION,
      page,
    );

    // 2. TRIPDOTCOM => 호텔 정보 가져오기
    const hotelInfos = await this.getTripdotcomHotelInfos(hotelPageUrls, page);

    browser.close();

    // 3. GPT => 문장 다듬기
    const rewritedHotelInfos = await this.rewriteHotelInfos(hotelInfos);

    // 4. HTML => HTML 생성하기

    console.log('hotelUrls', hotelPageUrls);
    console.log('hotelInfos', hotelInfos);
    console.log('rewritedHotelInfos', rewritedHotelInfos);
  }
}
