import { Injectable } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

@Injectable()
export class PuppeteerService {
  async getBrowser(
    ip?: string,
    port?: string,
  ): Promise<{ browser: Browser; page: Page }> {
    puppeteer.use(StealthPlugin());

    const browser =
      ip && port
        ? await puppeteer.launch({
            headless: false,
            args: [
              '--ignore-certificate-errors',
              `--proxy-server=${ip}:${port}`,
            ],
          })
        : await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const requestHeaders = {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      Referer: 'https://www.google.com/',
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
  }
}
