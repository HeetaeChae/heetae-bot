import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Browser, ElementHandle, Page } from 'puppeteer';
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

@Injectable()
export class PuppeteerService {
  async getBrowser(): Promise<{ browser: Browser; page: Page }> {
    try {
      const stealth = StealthPlugin();
      stealth.enabledEvasions.delete('user-agent-override'); // 기본 User-Agent 설정 유지
      // Google이 민감하게 보는 두 개의 evasion 비활성화
      stealth.enabledEvasions.delete('iframe.contentWindow');
      stealth.enabledEvasions.delete('media.codecs');
      puppeteer.use(stealth);

      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = await browser.newPage();

      const requestHeaders = {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      };

      await page.setExtraHTTPHeaders({ ...requestHeaders });

      await page.setRequestInterception(true);

      await page.on('request', (request) => {
        const url = request.url();
        if (
          url.includes('analytics') ||
          url.includes('ads') ||
          url.includes('social')
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      return { browser, page };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `puppeteer: 브라우저, 페이지 로드 중 오류.\n${error.message}`,
      });
    }
  }

  async getElementByText(
    page: Page,
    elSelector: string,
    elText: string,
  ): Promise<ElementHandle | null> {
    const els = await page.$$(elSelector);
    for (const el of els) {
      const text = await el.evaluate((el) => el.textContent?.trim());
      if (text?.includes(elText)) {
        return el;
      }
    }
    return null;
  }

  async clickElementByText(
    page: Page,
    elSelector: string,
    elText: string,
  ): Promise<boolean> {
    const els = await page.$$(elSelector);
    for (const el of els) {
      const text = await el.evaluate((el) => el.textContent?.trim());
      if (text?.includes(elText)) {
        await el.click();
        return true;
      }
    }
    return false;
  }

  async handleRangeSlider(
    page: Page,
    sliderSelector: string,
    targetPrice: { min: number; max: number },
    priceTextSelector: string,
  ) {
    const sliderEl = await page.waitForSelector(sliderSelector);
    const sliderBox = await sliderEl.boundingBox();

    const x = {
      min: sliderBox.x,
      max: sliderBox.x + sliderBox.width,
    };
    const y = sliderBox.y + sliderBox.height / 2;

    // min값 조정
    await page.mouse.move(x.min, y);
    await page.mouse.down();

    let minPrice = 0;
    let curMinX = x.min;
    while (minPrice <= targetPrice.min) {
      curMinX += 3;
      await page.mouse.move(curMinX, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const priceText = await page.$$eval(priceTextSelector, (els) =>
        els[0]?.textContent?.replace(/[^\d]/g, ''),
      );
      const price = Number(priceText);
      minPrice = price;
    }

    await page.mouse.up();

    // max값 조정
    await page.mouse.move(x.max, y);
    await page.mouse.down();

    let maxPrice = 1000000;
    let curMaxX = x.max;
    while (maxPrice >= targetPrice.max) {
      curMaxX -= 3;
      await page.mouse.move(curMaxX, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const priceText = await page.$$eval(priceTextSelector, (els) =>
        els[1]?.textContent?.replace(/[^\d]/g, ''),
      );
      const price = Number(priceText);
      maxPrice = price;
    }

    await page.mouse.up();
  }
}
