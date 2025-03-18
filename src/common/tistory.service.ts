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

  async uploadPosting(title: string, HTMLContent: string, hashtags: string[]) {
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
        page.goto('https://oct94.tistory.com/manage/newpost'),
      ]);

      // 로그인 클릭
      await this.utilsService.delayRandomTime('slow');
      await page.click('.txt_login');

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

      // ------------------------------------------------------

      // html 글쓰기 모드로 변환
      await this.utilsService.delayRandomTime('slow');
      await page.click('#editor-mode-layer-btn-open');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#editor-mode-html-text');

      // 제목 입력
      await this.utilsService.delayRandomTime('quick');
      await page.type('.textarea_tit', title, { delay: this.delay });

      // HTML 내용 입력
      await this.utilsService.delayRandomTime('quick');
      await page.click('.CodeMirror-code .CodeMirror-line');
      await page.keyboard.type(HTMLContent, { delay: this.delay });

      // 해시태그 입력
      await this.utilsService.delayRandomTime('quick');
      for (const hashTag of hashtags) {
        await page.type('.tf_g', hashTag, { delay: this.delay });
        await page.keyboard.press('Enter');
      }

      /*
      // 카테고리 변경
      await this.utilsService.delayRandomTime('slow');
      await page.click('#category-btn');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#category-list .mce-text');
      */

      // 발행
      await this.utilsService.delayRandomTime('quick');
      await page.click('#publish-layer-btn');
      await this.utilsService.delayRandomTime('quick');
      await page.click('#open20');
      await this.utilsService.delayRandomTime('quick');

      // ****************** 여기서 부터
      await page.click('#home_subject button');
      await this.utilsService.delayRandomTime('quick');
      await page.locator('::-p-text(건강)').click();
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
