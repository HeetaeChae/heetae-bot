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

    await page.click('.Ryi7tc.hh3Grb', { delay: 500 });
    const dayNextBtn = await page.$$('.wdHXy.NMm5M.hhikbc');
    await dayNextBtn[1].click({ count: 90 });

    const countEl = await page.$('.GDEAO');

    if (!countEl) {
      return null;
    }

    const text = await countEl.evaluate((el) => el.textContent);
    const prevHotelCount = Number(text.replace(/[^\d]/g, ''));

    await Promise.all([
      this.puppeteerService.clickElementByText(
        page,
        '.VfPpkd-vQzf8d',
        '모든 필터',
      ),
      this.utilsService.delayRandomTime('quick'),
    ]);

    await this.puppeteerService.clickElementByText(
      page,
      '.VfPpkd-V67aGc',
      '리뷰가 가장 많음',
    );

    switch (hotelType) {
      case HotelType.PRICE_UNDER_5:
        const targetPrice1 = { min: 0, max: 50000 };
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          targetPrice1,
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;
      case HotelType.PRICE_UNDER_10:
        const targetPrice2 = { min: 0, max: 50000 };
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          targetPrice2,
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;
      case HotelType.PRICE_ABOUT_10:
        const targetPrice3 = { min: 100000, max: 200000 };
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          targetPrice3,
          '.VfPpkd-MIfjnf-uDEFge-haAclf',
        );
        break;
      case HotelType.PRICE_ABOUT_20:
        const targetPrice4 = { min: 200000, max: 300000 };
        await this.puppeteerService.handleRangeSlider(
          page,
          '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
          targetPrice4,
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

    const currentCount = await page
      .waitForFunction(
        (prevCount) => {
          const el = document.querySelector('.GDEAO');
          if (!el) return null;

          const currentCount = Number(el.textContent.replace(/[^\d]/g, ''));
          if (currentCount < prevCount && currentCount > 0) {
            return currentCount;
          }

          return null;
        },
        { timeout: 15000 },
        prevHotelCount,
      )
      .then((res) => res.jsonValue())
      .catch(() => null);

    return currentCount;
  }

  async getHotelUrls(page: Page, searchedCount: number) {
    if (searchedCount < 3) {
      return null;
    }

    const urlsCount = searchedCount >= 7 ? 7 : searchedCount;

    const hotelUrls = await page.$$eval(
      '.PVOOXe',
      (els, urlsCount) =>
        els.slice(0, urlsCount).map((el) => {
          const href = el.getAttribute('href');
          return `https://www.google.com${href}`;
        }),
      urlsCount,
    );

    if (hotelUrls.length < 3) {
      return null;
    }

    return hotelUrls;
  }

  async getHotelInfos(page: Page, hotelUrls: string[]) {
    const hotelInfos = [];

    for (const url of hotelUrls) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(url),
      ]);

      const name = await page.$eval('.FNkAEc.o4k8l', (el) =>
        el.textContent.trim(),
      );

      const starEl = await this.puppeteerService.getElementByText(
        page,
        '.CFH2De',
        '성급',
      );
      let star = null;
      if (starEl) {
        star = await starEl.evaluate((el) => el.textContent?.trim());
      }

      const reviewBtn = await this.puppeteerService.getElementByText(
        page,
        '.SxZPid.VZhFab',
        '리뷰',
      );
      await reviewBtn.click();

      const reviewScore =
        (await page.$eval('.FBsWCd', (el) => el.textContent)) || null;
      const reviewCount =
        (await page.$eval('.P2NYOe.GFm7je.sSHqwe', (el) => el.textContent)) ||
        null;

      const reviewList =
        (await page.$$eval('.Svr5cf.bKhjM', (els) =>
          els.slice(0, 3).map((el) => {
            const authorEl = el.querySelector('.DHIhE.QB2Jof');
            const author = authorEl?.textContent?.trim() ?? '';
            const maskedAuthor = author
              ? `${author[0]}${'*'.repeat(author.length - 1)}`
              : '';

            const reviewEl = el.querySelector('.K7oBsc') as HTMLElement;
            const review = reviewEl?.innerText?.trim() ?? '';

            const formattedReview = review.endsWith('더보기')
              ? review.slice(0, -3)
              : review;

            const trimmedReview =
              formattedReview.length <= 100
                ? formattedReview
                : `${formattedReview.slice(0, 100)}...`;

            return { author: maskedAuthor, review: trimmedReview };
          }),
        )) || null;

      const infoBtn = await this.puppeteerService.getElementByText(
        page,
        '.SxZPid.VZhFab',
        '정보',
      );
      await infoBtn.click();

      const d35Els = await page.$$('.D35lie');
      const xgaEls = await page.$$('.XGa8fd');

      const [description, checkInfo] = await Promise.all([
        d35Els[0]
          ?.evaluate((el) => (el as HTMLElement).innerText)
          .catch(() => null),
        d35Els[1]
          ?.evaluate((el) => (el as HTMLElement).innerText)
          .catch(() => null),
      ]);

      /*
      const currentCount = await page
      .waitForFunction(
        (prevCount) => {
          const el = document.querySelector('.GDEAO');
          if (!el) return null;

          const currentCount = Number(el.textContent.replace(/[^\d]/g, ''));
          if (currentCount < prevCount && currentCount > 0) {
            return currentCount;
          }

          return null;
        },
        { timeout: 15000 },
        prevHotelCount,
      )
      .then((res) => res.jsonValue())
      .catch(() => null);
      */

      const descEl = (await page.$$('.D35lie')[0]) || null;

      let desc = null;

      if (descEl) {
      }

      const [address, contact] = await Promise.all([
        xgaEls[0]
          ?.evaluate((el) => (el as HTMLElement).innerText)
          .catch(() => null),
        xgaEls[1]
          ?.evaluate((el) => (el as HTMLElement).innerText)
          .catch(() => null),
      ]);

      const imgBtn = await this.puppeteerService.getElementByText(
        page,
        '.SxZPid.VZhFab',
        '사진',
      );
      await imgBtn.click();

      await page.waitForSelector('.aXvbdb > .NgCL1e');

      const imgSections = await page.$$('.aXvbdb > .NgCL1e');

      const imgUrls = await page.evaluate(async (sectionEl) => {
        const getImageCount = () => sectionEl.querySelectorAll('img').length;

        const title =
          sectionEl.querySelector('.qUbkDc.BgYkof')?.textContent ?? '';
        const totalImgCount = Number(title.replace(/[^\d]/g, '')) || 0;

        if (totalImgCount >= 9) {
          while (getImageCount() < 9) {
            const moreBtn = sectionEl.querySelector('.Zorfwe') as HTMLElement;
            if (!moreBtn) break;

            moreBtn.click();
          }
        }

        const imgs = sectionEl.querySelectorAll('img');
        return Array.from(imgs).map((img) => img.src);
      }, imgSections[0]);

      hotelInfos.push({
        name,
        star,
        description,
        checkInfo,
        address,
        contact,
        review: { score: reviewScore, count: reviewCount, list: reviewList },
        imgUrls,
      });
    }

    return hotelInfos;
  }

  async getAffiliateLinks() {}

  async devBlogPosting() {
    const city = '후쿠오카';
    const hotelType = HotelType.AMENITY_OCEAN_VIEW;

    const { browser, page } = await this.puppeteerService.getBrowser();

    // 1. google 호텔 검색하기
    const searchedCount = await this.searchGoogleHotels(page, city, hotelType);

    // 2. 검색된 호텔 url 가져오기
    const hotelUrls = await this.getHotelUrls(page, searchedCount);

    if (!hotelUrls) {
      return;
    }

    // 3. 호텔 정보 가져오기
    const hotelInfos = await this.getHotelInfos(page, hotelUrls);
    console.log(hotelInfos);

    // 4. 제휴 링크 가져오기
  }
}
