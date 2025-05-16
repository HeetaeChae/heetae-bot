import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'puppeteer';

import { GptService } from 'src/common/services/gpt.service';
import { PuppeteerService } from 'src/common/services/puppeteer.service';
import { UtilsService } from 'src/common/services/utils.service';
import { BlogV2KeywordService } from './blog-v2-keyword.service';

import { HotelType } from './common/blog-v2.enum';
import {
  HotelInfo,
  KakaoAuthInfo,
  PostContent,
  ValidCountInfo,
} from './common/blog-v2.interface';
import {
  CSS_STYLES,
  GPT_PROMPTS,
  HOTEL_META_DESCRIPTION_TEMPLATES,
  HOTEL_TITLE_TEMPLATES,
  HOTEL_TYPE_DESCRIPTIONS,
} from './common/blog-v2.contants';

@Injectable()
export class BlogV2PostService {
  private readonly delay: number = Math.floor(Math.random() * 100) + 50;
  private readonly validCountInfo: ValidCountInfo = {
    hotel: { min: 3, max: 5 },
    img: 9,
    reviewList: 3,
  };
  private readonly kakaoAuthInfo: KakaoAuthInfo = {
    email: null,
    pass: null,
  };

  constructor(
    private blogV2KeywordService: BlogV2KeywordService,
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
    private gptService: GptService,
    private configService: ConfigService,
  ) {
    this.kakaoAuthInfo.email = this.configService.get<string>('KAKAO_EMAIL');
    this.kakaoAuthInfo.pass = this.configService.get<string>('KAKAO_PASS');
  }

  async searchGoogleHotels(page: Page, city: string, hotelType: HotelType) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto(`https://www.google.com/travel/search?q=${city}`),
    ]);
    await page.click('.Ryi7tc.hh3Grb', { delay: 500 });

    const dayNextBtn = await page.$$('.wdHXy.NMm5M.hhikbc');
    await dayNextBtn[1].click({ count: 90 });

    const prevCountEl = await page.$('.GDEAO');
    if (!prevCountEl) {
      return null;
    }

    const prevCountText = await prevCountEl.evaluate((el) => el.textContent);
    const prevHotelCount = Number(prevCountText.replace(/[^\d]/g, ''));

    await Promise.all([
      this.utilsService.delayRandomTime('quick'),
      await this.puppeteerService.clickElementByText(
        page,
        '.VfPpkd-vQzf8d',
        '모든 필터',
      ),
    ]);

    await this.puppeteerService.clickElementByText(
      page,
      '.VfPpkd-V67aGc',
      '리뷰가 가장 많음',
    );

    switch (hotelType) {
      case HotelType.PRICE_UNDER_5:
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          { min: 0, max: 50000 },
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;

      case HotelType.PRICE_UNDER_10:
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          { min: 0, max: 100000 },
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;

      case HotelType.PRICE_ABOUT_10:
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          { min: 100000, max: 200000 },
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;

      case HotelType.PRICE_ABOUT_20:
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          { min: 200000, max: 300000 },
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;

      case HotelType.FACILITY_SPA:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '스파',
        );
        break;

      case HotelType.FACILITY_POOL:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '수영장',
        );
        break;

      case HotelType.FACILITY_BAR:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '바',
        );
        break;

      case HotelType.FACILITY_RESORT:
        await this.puppeteerService.clickElementByText(
          page,
          '.OOiKUe.ogfYpf.kFRDoc',
          '리조트',
        );
        break;

      case HotelType.FACILITY_HOSTEL:
        await this.puppeteerService.clickElementByText(
          page,
          '.OOiKUe.ogfYpf.kFRDoc',
          '호스텔',
        );
        break;

      case HotelType.AMENITY_BREAKFAST:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '조식 포함',
        );
        break;

      case HotelType.AMENITY_OCEAN_VIEW:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '해변 인접',
        );
        break;

      case HotelType.AMENITY_PET:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '반려동물 허용',
        );
        break;

      case HotelType.STAR_FOUR:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '4성급',
        );
        break;

      case HotelType.STAR_FIVE:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '5성급',
        );
        break;

      case HotelType.GUEST_ALONE:
        break;

      case HotelType.GUEST_FAMILY:
        break;

      case HotelType.GUEST_KID:
        break;

      case HotelType.GUEST_BABY:
        await this.puppeteerService.clickElementByText(
          page,
          '.l4J6ze.QB2Jof',
          '유아 동반 환영',
        );
        break;

      case HotelType.RATING_HIGH:
        await this.puppeteerService.clickElementByText(page, '.idyJXe', '4.5+');
        break;

      default:
        break;
    }

    await this.utilsService.delayRandomTime('quick');

    await page.waitForSelector('.tlY0V', {
      hidden: true,
      timeout: 10000, // 로딩 최대 10초 대기
    });

    await this.utilsService.delayRandomTime('quick');

    const curHotelCountHandle = await page
      .waitForFunction(
        (prevCount) => {
          console.log(prevCount);

          const countEl = document.querySelector('.GDEAO');
          if (!countEl) return null;

          const curCount = Number(countEl.textContent.replace(/[^\d]/g, ''));
          console.log(curCount);
          if (curCount < prevCount) return curCount;

          return null;
        },
        { timeout: 10000 },
        prevHotelCount,
      )
      .catch(() => null);

    if (!curHotelCountHandle) {
      return null;
    }

    const curHotelCount: number = await curHotelCountHandle.jsonValue();

    if (curHotelCount < this.validCountInfo.hotel.min) {
      return null;
    }

    return curHotelCount;
  }

  async getGoogleHotelInfos(page: Page, searchedCount: number) {
    let hotelUrls = await page.$$eval('.PVOOXe', (els) =>
      els.map((el) => {
        const href = el.getAttribute('href');
        return `https://www.google.com${href}`;
      }),
    );

    if (hotelUrls.length > searchedCount) {
      hotelUrls = hotelUrls.slice(0, searchedCount);
    }

    const hotelInfos: HotelInfo[] = [];

    for (const url of hotelUrls) {
      if (hotelInfos.length >= this.validCountInfo.hotel.max) {
        break;
      }

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(url),
      ]);

      const name = await page.$eval('.FNkAEc.o4k8l', (el) =>
        el.textContent?.trim(),
      );

      const starEl = await this.puppeteerService.getElementByText(
        page,
        '.CFH2De',
        '성급',
      );
      let star = null;
      if (starEl) {
        star = await starEl.evaluate((el) => {
          const text = el.textContent?.trim();
          return text?.length ? text : null;
        });
      }

      await this.puppeteerService.clickElementByText(
        page,
        '.SxZPid.VZhFab',
        '리뷰',
      );
      const reviewScore = await page
        .$eval('.FBsWCd', (el) => {
          const text = el.textContent?.trim();
          return text?.length ? text : null;
        })
        .catch(() => null);
      const reviewCount = await page
        .$eval('.P2NYOe.GFm7je.sSHqwe', (el) => {
          const text = el.textContent?.trim();
          return text?.length ? text : null;
        })
        .catch(() => null);

      if (!reviewScore || !reviewCount) {
        continue;
      }

      const reviewEls = await page.$$('.Svr5cf.bKhjM');
      const reviewList = [];

      for (const reviewEl of reviewEls) {
        if (reviewList.length >= this.validCountInfo.reviewList) break;

        const authorText = await reviewEl
          .$eval('.DHIhE.QB2Jof', (el) => {
            const text = el.textContent?.trim();
            return text?.length ? text : null;
          })
          .catch(() => null);

        const author = authorText
          ? `${authorText[0]}${'*'.repeat(authorText.length - 1)}`
          : null;

        const contentText = await reviewEl
          .$eval('.K7oBsc', (el) => {
            const text = el.textContent?.trim();
            return text?.length ? text : null;
          })
          .catch(() => null);

        let content = contentText;
        if (content) {
          content = contentText.endsWith('더보기')
            ? contentText.slice(0, -3)
            : contentText;
          content =
            content.length <= 100 ? content : `${content.slice(0, 100)}...`;

          if (!author || !content) {
            continue;
          }
        }

        reviewList.push({ author, content });
      }

      if (reviewList.length < this.validCountInfo.reviewList) {
        continue;
      }

      await this.puppeteerService.clickElementByText(
        page,
        '.SxZPid.VZhFab',
        '정보',
      );

      const descMoreBtn = await page.$('.d6eqsd button');
      if (!descMoreBtn) {
        continue;
      }
      await Promise.all([
        this.utilsService.delayRandomTime('quick'),
        descMoreBtn.click(),
      ]);

      const descriptionList = await page.$$eval(
        '.D35lie > .GtAk2e',
        (els: HTMLElement[]) =>
          els.map((el) => {
            const text = el.textContent?.trim();
            return text?.length ? text.replace('… 더보기', '') : null;
          }),
      );

      const [checkIn, checkOut] = await page.$$eval(
        '.D35lie > .b9tWsd',
        (els: HTMLElement[]) =>
          els.map((el) => {
            const text = el.textContent?.trim();
            return text?.length ? text : null;
          }),
      );

      const [address, contact] = await page.$$eval(
        '.G8T82 > .GtAk2e > .XGa8fd',
        (els: HTMLElement[]) =>
          els.map((el) => {
            const text = el.textContent?.trim();
            return text?.length ? text : null;
          }),
      );

      if (!descriptionList || !checkIn || !checkOut || !address || !contact) {
        continue;
      }

      await this.puppeteerService.clickElementByText(
        page,
        '.SxZPid.VZhFab',
        '사진',
      );

      const imgSection = await page
        .waitForSelector('.aXvbdb > .NgCL1e')
        .catch(() => null);

      const imgCount = await imgSection
        .$eval('.qUbkDc.BgYkof', (el: HTMLElement) => {
          const text = el.textContent?.trim();
          return text?.length ? Number(text.replace(/[^\d]/g, '')) : null;
        })
        .catch(() => null);

      const isValidImgCount =
        typeof imgCount === 'number' && imgCount >= this.validCountInfo.img;

      if (!isValidImgCount) {
        continue;
      }

      while (true) {
        const curImgEls = await imgSection.$$('img');
        if (curImgEls.length >= this.validCountInfo.img) break;

        const moreBtn = await imgSection.$('.Zorfwe');
        if (!moreBtn) break;

        await Promise.all([
          await this.utilsService.delayRandomTime('quick'),
          await moreBtn.click(),
        ]);
      }

      const imgUrls = await imgSection.$$eval(
        'img',
        (els: HTMLImageElement[], maxCount: number) =>
          els.slice(0, maxCount).map((el) => el.src),
        this.validCountInfo.img,
      );

      hotelInfos.push({
        name,
        star,
        review: { score: reviewScore, count: reviewCount, list: reviewList },
        imgUrls,
        descriptionList,
        checkInfo: { checkIn, checkOut },
        address,
        contact,
      });
    }

    if (hotelInfos.length < this.validCountInfo.hotel.min) {
      return null;
    }

    return hotelInfos;
  }

  async generatePostContents(
    hotelInfos: HotelInfo[],
    city: string,
    hotelType: string,
  ) {
    const title = HOTEL_TITLE_TEMPLATES[hotelType]
      .replace('{city}', city)
      .replace('{count}', hotelInfos.length);

    const metaDescription = HOTEL_META_DESCRIPTION_TEMPLATES[hotelType]
      .replace('{city}', city)
      .replace('{count}', hotelInfos.length);

    const hashtags = await this.gptService.generateGptResponse(
      GPT_PROMPTS.hashtags.replace('{title}', title),
      0.7,
    );

    const intro = await this.gptService.generateGptResponse(
      GPT_PROMPTS.intro.replace('{title}', title),
      0.7,
    );

    const tagList = [];

    const indexTags = hotelInfos
      .map((hotelInfo, idx) => {
        const indexNum = idx + 1;
        return `<p>${indexNum}) <a href="#section${indexNum}" style="${CSS_STYLES.indexText}">${hotelInfo.name}</a></p>`;
      })
      .join('');

    tagList.push(
      `<div style="${CSS_STYLES.indexContainer}">${indexTags}</div>`,
    );
    tagList.push(`<h2 style="${CSS_STYLES.title}">${title}</h2>`);
    tagList.push(
      `<p style="${CSS_STYLES.metaDescription}">${metaDescription}</p>`,
    );
    tagList.push(`<p style="${CSS_STYLES.intro}">${intro}</p>`);

    let sectionNum = 1;

    for (const hotelInfo of hotelInfos) {
      const imgTags = hotelInfo.imgUrls
        .map((url, idx) => {
          const alt = `${hotelInfo.name}_${idx}`;
          return `<img style="${CSS_STYLES.image}" src="${url}" alt="${alt}"/>`;
        })
        .join();

      const reviewTags = hotelInfo.review.list
        .map((item) => {
          const authorTag = `<p style="">${item.author}</p>`;
          const contentTag = `<p style="">${item.content}</p>`;
          return `<div>${authorTag}${contentTag}</div>`;
        })
        .join();

      const descriptionTags = hotelInfo.descriptionList
        .map(
          (text) =>
            `<p style="${CSS_STYLES.empty}"/><p style="${CSS_STYLES.description}">${text}</p>`,
        )
        .join();

      const infoTags = [
        { key: '주소: ', value: hotelInfo.address },
        { key: '연락처: ', value: hotelInfo.contact },
        { key: 'Check-In: ', value: hotelInfo.checkInfo.checkIn },
        { key: 'Check-Out: ', value: hotelInfo.checkInfo.checkOut },
      ]
        .map((item) => `<li><strong>${item.key}</strong>${item.value}</li>`)
        .join();

      const createEmptyTags = (tagCount: number) =>
        new Array(tagCount)
          .fill(null)
          .map(() => `<div style="${CSS_STYLES.empty}"/>`)
          .join();

      tagList.push(createEmptyTags(2));
      tagList.push(`<hr ${CSS_STYLES.line} />`);
      tagList.push(
        `<h3 id="#section${sectionNum}" style="${CSS_STYLES.sectionTitle}">${sectionNum}) ${hotelInfo.name}</h3>`,
      );
      tagList.push(
        `<div style="${CSS_STYLES.infoBox}"><ul>${infoTags}</ul></div>`,
      );
      tagList.push(`<div style="${CSS_STYLES.frame}">${imgTags}</div>`);
      tagList.push(`<div>${descriptionTags}</div>`);
      tagList.push(`<div>${reviewTags}</div>`);
      tagList.push(createEmptyTags(3));

      sectionNum += 1;
    }

    const HTML = tagList.join();

    return {
      title,
      HTML,
      hashtags: hashtags.split(','),
    };
  }

  async uploadTistoryPost(page: Page, postContent: PostContent) {
    const { title, HTML, hashtags } = postContent;

    page.on('dialog', async (dialog) => {
      await this.utilsService.delayRandomTime('quick');
      const message = dialog.message();
      if (message.includes('이어서 작성하시겠습니까?')) {
        await dialog.dismiss();
      } else if (message.includes('작성 모드를 변경하시겠습니까?')) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://oct94.tistory.com/manage/newpost'),
    ]);

    await this.utilsService.delayRandomTime('slow');
    await page.click('.txt_login');
    await this.utilsService.delayRandomTime('slow');
    await page.type('#loginId--1', this.kakaoAuthInfo.email, {
      delay: this.delay,
    });
    await page.type('#password--2', this.kakaoAuthInfo.pass, {
      delay: this.delay,
    });
    await this.utilsService.delayRandomTime('quick');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('.submit'),
    ]);

    await this.utilsService.delayRandomTime('slow');
    await page.click('#editor-mode-layer-btn-open');
    await this.utilsService.delayRandomTime('quick');
    await page.click('#editor-mode-html-text');
    await this.utilsService.delayRandomTime('quick');
    await page.type('.textarea_tit', title, { delay: this.delay });
    await this.utilsService.delayRandomTime('quick');
    await page.click('.CodeMirror-code .CodeMirror-line');
    await page.keyboard.type(HTML);
    await this.utilsService.delayRandomTime('quick');
    for (const hashTag of hashtags) {
      await page.type('.tf_g', hashTag, { delay: this.delay });
      await page.keyboard.press('Enter');
    }

    await this.utilsService.delayRandomTime('slow');
    await page.click('#category-btn');
    await this.utilsService.delayRandomTime('quick');
    await page.click('#category-list .mce-text');

    await this.utilsService.delayRandomTime('quick');
    await page.click('#publish-layer-btn');
    await this.utilsService.delayRandomTime('quick');
    await page.click('#open20');
    await this.utilsService.delayRandomTime('quick');
    await page.click('#home_subject button');
    await this.utilsService.delayRandomTime('quick');
    const subjectBtn = await page.waitForSelector(
      '::-p-xpath(//*[@id="home_subject"]/dd/div/div/div/div[4]/span)',
    );
    await subjectBtn.click();
    await this.utilsService.delayRandomTime('quick');
    await page.click('#publish-btn');

    // 포스트 url
    return '';
  }

  async createPost() {
    console.log(
      `Start: 호텔 추천 포스트 생성 작업을 실행합니다. ${this.utilsService.getDateTime()}`,
    );

    // 키워드 데이터 가져오기
    const { id, city, hotelType, relatedUrl } =
      await this.blogV2KeywordService.getRandomKeyword();
    const keywordInfoText = `${id},${city},${HOTEL_TYPE_DESCRIPTIONS[hotelType]},${relatedUrl}`;
    console.log(`키워드 데이터를 가져왔습니다. ${keywordInfoText}`);

    const { browser, page } = await this.puppeteerService.getBrowser();

    // 구글 호텔 검색하기
    const searchedCount = await this.searchGoogleHotels(page, city, hotelType);

    if (!searchedCount) {
      await this.blogV2KeywordService.updateInvalidKeyword(id);
      console.log(`키워드 데이터를 비유효화 처리합니다. ${keywordInfoText}`);
      console.log(`Restart: 호텔 검색을 실패하여 재실행합니다.`);

      return this.createPost();
    }

    console.log(`${searchedCount} 건의 호텔을 검색했습니다.`);

    // 구글 호텔 정보 가져오기
    const hotelInfos = await this.getGoogleHotelInfos(page, searchedCount);

    if (!hotelInfos) {
      await this.blogV2KeywordService.updateInvalidKeyword(id);
      console.log(`키워드 데이터를 비유효화 처리합니다. ${keywordInfoText}`);
      console.log(`Restart: 호텔 정보 수집을 실패하여 재실행합니다.`);

      return this.createPost();
    }

    console.log(`${hotelInfos.length} 건의 호텔 정보를 수집하였습니다.`);

    // 컨텐츠 생성하기
    const postContent = await this.generatePostContents(
      hotelInfos,
      city,
      hotelType,
    );

    console.log(`호텔 추천 컨텐츠를 생성했습니다.`);

    // 티스토리에 포스팅
    const postUrl = await this.uploadTistoryPost(page, postContent);
    console.log(`티스토리 포스팅을 업로드했습니다. ${postUrl}`);

    await browser.close();

    // 키워드 데이터 업데이트
    await this.blogV2KeywordService.updateUsedKeyword(id, postUrl);
    console.log(`키워드 데이터를 사용 처리 하였습니다. ${id}`);

    console.log(
      `End: 호텔 추천 포스트 작업을 종료합니다. ${this.utilsService.getDateTime()}`,
    );
  }
}
