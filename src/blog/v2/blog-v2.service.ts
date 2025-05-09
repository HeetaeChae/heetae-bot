import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'puppeteer';
import * as dayjs from 'dayjs';

import { GoogleHotelType as HotelType } from 'src/common/enums/hotel-type.enum';
import { GptService } from 'src/common/services/gpt.service';
import { PuppeteerService } from 'src/common/services/puppeteer.service';
import { UtilsService } from 'src/common/services/utils.service';

@Injectable()
export class BlogV2Service {
  private hotelCount = { min: 3, max: 7 };
  private imgCount = 9;
  private reviewListCount = 3;

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

    await page.click('.Ryi7tc.hh3Grb', { delay: 500 });

    const dayNextBtn = await page.$$('.wdHXy.NMm5M.hhikbc');
    await dayNextBtn[1].click({ count: 90 });

    const prevCountEl = await page.$('.GDEAO');

    // 검색결과가 없음.
    if (!prevCountEl) {
      return null;
    }

    const prevCountText = await prevCountEl.evaluate((el) => el.textContent);
    const prevHotelCount = Number(prevCountText.replace(/[^\d]/g, ''));

    await this.puppeteerService.clickElementByText(
      page,
      '.VfPpkd-vQzf8d',
      '모든 필터',
    );

    await this.utilsService.delayRandomTime('quick');

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

    await this.utilsService.delayRandomTime('slow');

    const curHotelCountHandle = await page
      .waitForFunction(
        (prevCount) => {
          const countEl = document.querySelector('.GDEAO');
          const curCount = Number(countEl.textContent.replace(/[^\d]/g, ''));

          if (!countEl) return null;

          if (curCount < prevCount) {
            return curCount;
          }

          return null;
        },
        { timeout: 10000 },
        prevHotelCount,
      )
      .catch(() => null);

    if (!curHotelCountHandle) {
      return null;
    }

    const curHotelCount = await curHotelCountHandle.jsonValue();

    return curHotelCount;
  }

  async getGoogleHotelInfos(page: Page) {
    const hotelUrls = await page.$$eval('.PVOOXe', (els) =>
      els.map((el) => {
        const href = el.getAttribute('href');
        return `https://www.google.com${href}`;
      }),
    );

    const hotelInfos = [];

    for (const url of hotelUrls) {
      if (hotelInfos.length >= this.hotelCount.max) {
        break;
      }

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(url),
      ]);

      const name = await page.$eval('.FNkAEc.o4k8l', (el) =>
        el.textContent?.trim(),
      );

      console.log('name', name);

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

      console.log(name, star);

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

      console.log(name, reviewScore, reviewCount);

      if (!reviewScore || !reviewCount) {
        continue;
      }

      const reviewEls = await page.$$('.Svr5cf.bKhjM');

      console.log('reviewEls', reviewEls, reviewEls.length, '개');

      if (reviewEls.length < this.reviewListCount) {
        continue;
      }

      const reviewList = [];

      for (const reviewEl of reviewEls) {
        if (reviewList.length >= this.reviewListCount) break;

        const authorText = await reviewEl
          .$eval('.DHIhE.QB2Jof', (el) => {
            const text = el.textContent?.trim();
            return text?.length ? text : null;
          })
          .catch(() => null);

        console.log('authorText', authorText, typeof authorText);

        const author = authorText
          ? `${authorText[0]}${'*'.repeat(authorText.length - 1)}`
          : null;

        console.log('author', author, typeof author);

        if (!author) {
          continue;
        }

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

          if (!content) {
            continue;
          }
        }

        console.log('content');

        reviewList.push({ author, content });
      }

      console.log(reviewList);

      if (reviewList.length < this.reviewListCount) {
        continue;
      }

      await this.puppeteerService.clickElementByText(
        page,
        '.SxZPid.VZhFab',
        '정보',
      );

      // 정보에 "더보기" 버튼이 있을 경우
      const descMoreBtn = await page.$('.d6eqsd button');
      if (descMoreBtn) {
        await descMoreBtn.click();
      }

      // 이미지 urls
      await this.puppeteerService.clickElementByText(
        page,
        '.SxZPid.VZhFab',
        '사진',
      );

      const imgSection = await page
        .waitForSelector('.aXvbdb > .NgCL1e')
        .catch(() => null);

      console.log('imgSection', imgSection);

      if (!imgSection) {
        continue;
      }

      const imgCount = await imgSection
        .$eval('.qUbkDc.BgYkof', (el: HTMLElement) => {
          const text = el.textContent?.trim();
          return text?.length ? Number(text.replace(/[^\d]/g, '')) : null;
        })
        .catch(() => null);

      console.log(
        'imgCount',
        imgCount,
        typeof imgCount,
        imgCount < this.imgCount,
      );

      const isValidImgCount =
        typeof imgCount === 'number' && imgCount >= this.imgCount;

      if (!isValidImgCount) {
        continue;
      }

      while (true) {
        const curImgEls = await imgSection.$$('img');
        if (curImgEls.length >= this.imgCount) break;

        const moreBtn = await imgSection.$('.Zorfwe');
        console.log('moreBtn', moreBtn);
        if (!moreBtn) break;

        await moreBtn.click();
      }

      const imgUrls = await imgSection.$$eval('img', (els) =>
        els.map((el) => (el as HTMLImageElement).src),
      );

      hotelInfos.push({
        name,
        star,
        review: { score: reviewScore, count: reviewCount, list: reviewList },
        imgUrls: imgUrls.slice(0, 9),
      });
    }

    if (hotelInfos.length < this.hotelCount.min) {
      return null;
    }

    return hotelInfos;
  }

  async getAffiliateLinks() {}

  async devBlogPosting() {
    const city = '도쿄';
    const hotelType = HotelType.RATING_HIGH;

    const { browser, page } = await this.puppeteerService.getBrowser();

    // 1. google 호텔 검색하기
    const searchedCount = await this.searchGoogleHotels(page, city, hotelType);
    console.log(`${city}, total ${searchedCount} 건의 호텔이 검색되었습니다.`);

    // if (!searchedCount) return;

    // 2. 호텔 정보 가져오기
    const hotelInfos = await this.getGoogleHotelInfos(page);
    console.log(`total ${hotelInfos.length} 건의 호텔 정보를 수집하였습니다.`);

    // 3. 제휴 링크 가져오기
    /*
    // 3. 호텔 정보 가져오기
    console.log(hotelInfos);

    // 4. 제휴 링크 가져오기
    */
  }
}
