import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
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
}
