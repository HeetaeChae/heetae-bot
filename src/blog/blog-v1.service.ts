import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'puppeteer';
import { HOTEL_TITLE_TEMPLATES } from 'src/common/contants/hotel-blog-templates';

import { BlogV1Prompts } from 'src/common/contants/prompts';
import { BlogV1Styles } from 'src/common/contants/styles';
import { BlogV1Templates } from 'src/common/contants/templates';
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
    private utilsService: UtilsService,
    private gptService: GptService,
  ) {}

  async getHotelPageUrls(
    page: Page,
    city: string,
    type: HotelType,
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
    await navIdInput.type(this.configService.get<string>('NAVER_ID'), {
      delay: 300,
    });
    await navPassInput.type(this.configService.get<string>('NAVER_PASS'), {
      delay: 300,
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      loginPage.click('.btn_login.next_step.nlog-click'),
    ]);

    // 1-2. 도시 검색
    await page.type('#hotels-destinationV8', city, { delay: 300 });
    await this.utilsService.delayRandomTime('quick');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('.search-button-new'),
    ]);

    // 1-3. 호텔 타입 필터링

    // 1-4. 호텔 url 가져오기
    await this.utilsService.delayRandomTime('slow');
    const hotelPageUrls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.list-card-title > a'), (a) => {
        const baseUrl = 'https://kr.trip.com';
        const href = a.getAttribute('href');
        return baseUrl + href;
      }),
    );

    return hotelPageUrls;
  }

  async getHotelInfos(
    page: Page,
    hotelPageUrls: string[],
  ): Promise<HotelInfoV1[]> {
    const hotelInfos: HotelInfoV1[] = [];

    for (const url of hotelPageUrls) {
      // 1-5. 호텔 페이지 이동
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(url),
      ]);

      // 1-6. 호텔 1박 최저가 금액 찾기
      await page.click('.i7MrTkrtLpx7POgWf7Hz');
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
      const y = await page.evaluate(() => window.innerHeight);
      await page.mouse.click(1, y - 1);

      // 1-7. 호텔 사진 urls
      const imgUrls = [];
      const imgOpenerEls = await page.$$('.headAlbum_headAlbum_img__vfjQm');
      for (let i = 0; i < 4; i += 1) {
        const opener = imgOpenerEls[i];
        await this.utilsService.delayRandomTime('quick');
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

      // 1-8. 호텔 정보 가져오기 (이름, 부제목, 주소)
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

      // 1-9. 호텔 소개글 가져오기
      await page.click(
        '.style_textLinkButton__XwrMR.hotelDescription_hotelDescription-address_showmoreA__Yt1A4',
        { delay: 300 },
      );
      const descList = await page.$$eval(
        '.hotelDescriptionPop_descriptionInfo-desc__sa6Kz',
        (els) => els.map((el) => (el as HTMLElement).innerText),
      );
      await page.click('.hotelDescriptionPop_descriptionInfo-close__kB9Tw');

      const hotelInfo: HotelInfoV1 = {
        imgUrls,
        name,
        subName,
        address,
        lowestPrice,
        description: descList.join(' '),
      };
      hotelInfos.push(hotelInfo);
    }

    return hotelInfos;
  }

  // 2. ADPICK => 애드픽 제휴링크 첨부
  async getAffiliateLinks(
    page: Page,
    hotelPageUrls: string[],
  ): Promise<string[]> {
    // 2-1. 애드픽 로그인
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://adpick.co.kr/?ac=login'),
    ]);

    const [loginPage] = await Promise.all([
      new Promise<Page>((resolve) => page.once('popup', resolve)),
      await page.click('.btnNaver'),
    ]);
    const idInput = await loginPage.waitForSelector('.input_id');
    await idInput.type(this.configService.get<string>('NAVER_ID'), {
      delay: 300,
    });
    const passInput = await loginPage.waitForSelector('.input_pw');
    await passInput.type(this.configService.get<string>('NAVER_PASS'), {
      delay: 300,
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      loginPage.click('.btn_login.next_step.nlog-click'),
    ]);

    const affiliateLinks: string[] = [];

    // 2-2. 애드픽 제휴링크 생성 => 첨부하기
    for (const url of hotelPageUrls) {
      const newUrl = new URL(url);
      const { origin: o, pathname: p, searchParams: sp } = newUrl;
      const formattedUrl = `${o}${p}?cityId=${sp.get('cityId')}&hotelId=${sp.get('hotelId')}`;

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto('https://adpick.co.kr/?ac=link&tac=shopping&md=addlink'),
      ]);

      const input = await page.waitForSelector('input[type="text"]');
      await input.type(formattedUrl, { delay: 300 });

      const addBtn = await page.$('#addbtn');

      // disabled가 false 또는 속성이 사라질 때까지 대기
      await page.waitForFunction(
        (el) => !el.hasAttribute('disabled'),
        { timeout: 3000 },
        addBtn,
      );

      await addBtn.click({ delay: 1000 });

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto('https://adpick.co.kr/?ac=link&tac=shopping'),
      ]);

      const linkEl = await page.waitForSelector('.slink');
      const linkUrl = await linkEl.evaluate((el) => el.textContent);

      affiliateLinks.push(linkUrl);
    }

    return affiliateLinks;
  }

  // 4. GPT => 문장 다듬기
  async rewriteHotelInfos(hotelInfos: HotelInfoV1[]): Promise<HotelInfoV1[]> {
    const rewritedHotelInfos = [];

    for (const hotelInfo of hotelInfos) {
      const { description, ...etc } = hotelInfo;

      // 4-1. 호텔 소개 글 다듬기
      const rewritedDescription = await this.gptService.generateGptResponse(
        BlogV1Prompts.descriptionRewriting.replace(
          '{description}',
          description,
        ),
        0.7,
      );

      rewritedHotelInfos.push({ description: rewritedDescription, ...etc });
    }

    return rewritedHotelInfos;
  }

  // 4. GPT => 인트로 글 작성
  async writeIntro(city: string, hotelTypeDesc: string) {
    const textForIntro = `${city} ${hotelTypeDesc} 호텔 추천`;
    const writedIntro = await this.gptService.generateGptResponse(
      BlogV1Prompts.openingMent.replace('${text}', textForIntro),
      0.7,
    );

    return writedIntro;
  }

  // 4. BLOG => 블로그 컨텐츠 (HTML) 생성하기
  createHTMLContent(hotelInfos: HotelInfoV1[], intro: string) {
    // 4-1. 도입부 (intro) 생성
    const introHTML = BlogV1Templates.createIntroHTML(intro, BlogV1Styles);

    // 4-2. 목차 (index) 생성
    const outlineHTML = BlogV1Templates.createOutlineHTML(
      hotelInfos,
      BlogV1Styles,
    );

    // 4-3. 단락 / 본문 (sections) 생성
    const sectionHTML = hotelInfos
      .map((hotelInfo, index) =>
        BlogV1Templates.createSectionHTML(hotelInfo, index, BlogV1Styles),
      )
      .join('\n');

    const HTML = `${introHTML}\n${outlineHTML}\n${sectionHTML}\n`;
    return HTML;
  }

  async devHotelPosting() {
    const city = '후쿠오카';
    const hotelType = HotelType.AMENITY_OCEAN_VIEW;

    const { browser, page } = await this.puppeteerService.getBrowser();

    // 1. TRIPDOTCOM => 호텔 페이지 urls 가져오기
    const hotelPageUrls = await this.getHotelPageUrls(page, city, hotelType);
    console.log(hotelPageUrls);

    // 2. TRIPDOTCOM => 호텔 정보 가져오기
    const hotelInfos = await this.getHotelInfos(page, hotelPageUrls);
    console.log(hotelInfos);

    // 3. ADPICK => 제휴 링크 url 가져오기
    const affiliateLinks = await this.getAffiliateLinks(page, hotelPageUrls);
    console.log(affiliateLinks);

    // 4. GPT => 호텔 정보 글 다듬기
    const rewritedHotelInfos = await this.rewriteHotelInfos(hotelInfos);
    console.log(rewritedHotelInfos);

    // 5. GPT => 인트로 글 쓰기
    const writedIntro = await this.writeIntro(
      city,
      HOTEL_TITLE_TEMPLATES[hotelType],
    );
    console.log(writedIntro);

    // 6. HTML => 블로그 내용 (HTML) 생성하기
    const HTMLContent = this.createHTMLContent(rewritedHotelInfos, writedIntro);
    console.log(HTMLContent);

    browser.close();
  }
}
