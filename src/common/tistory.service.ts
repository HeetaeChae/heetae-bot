import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';

@Injectable()
export class TistoryService {
  private readonly tistoryEmail: string;
  private readonly tistoryPass: string;
  private readonly delay: number = Math.floor(Math.random() * 100) + 50;

  constructor(
    private configService: ConfigService,
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
  ) {
    const tistoryEmail = this.configService.get<string>('TISTORY_EMAIL');
    const tistoryPass = this.configService.get<string>('TISTORY_PASS');

    if (!tistoryEmail || !tistoryPass) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'tistory: 계정 정보를 가져오지 못했습니다.',
      });
    }

    this.tistoryEmail = tistoryEmail;
    this.tistoryPass = tistoryPass;
  }

  async uploadPosting() {
    try {
      const { browser, page } = await this.puppeteerService.getBrowser();

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
        page.goto('https://www.tistory.com'),
      ]);

      // 로그인 클릭
      await this.utilsService.delayRandomTime('slow');
      await page.click('.my_tistory.box_mylogin .txt_login');

      // 모달 로그인 클릭
      await this.utilsService.delayRandomTime('slow');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click('.login_tistory .txt_login'),
      ]);

      // 계정 입력
      await this.utilsService.delayRandomTime('slow');
      await page.type('#loginId--1', this.tistoryEmail, {
        delay: this.delay,
      });
      await page.type('#password--2', this.tistoryPass, {
        delay: this.delay,
      });

      // 접속 클릭
      await this.utilsService.delayRandomTime('quick');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click('.submit'),
      ]);

      // 글쓰기 페이지로 이동
      await this.utilsService.delayRandomTime('slow');
      const hrefs = await page.$$eval('.link_tab', (els) =>
        els.map((el) => el.getAttribute('href')).filter((href) => href !== '#'),
      );
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(hrefs[0]),
      ]);

      // html 글쓰기 모드로 변환
      await this.utilsService.delayRandomTime('slow');
      await page.click('#editor-mode-layer-btn-open');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#editor-mode-html-text');

      /*
      // 카테고리 변경
      await this.utilsService.delayRandomTime('slow');
      await page.click('#category-btn');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#category-list .mce-text');
      */

      // 발행
      await this.utilsService.delayRandomTime('slow');
      await page.click('#publish-layer-btn');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#open20');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#publish-btn');

      browser.close();
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `tistory: 포스팅중 오류 발생.\n${error.message}`,
      });
    }
  }
}
