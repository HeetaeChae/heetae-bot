import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { blogPrompts } from 'src/prompts/blog-prompts';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';

export interface ElementTree {
  tag: string;
  text: string | null;
  elementTree: ElementTree[] | null;
}

@Injectable()
export class WrtnService {
  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
  ) {}

  async getElementTree(keyword: string): Promise<ElementTree> {
    const prompt = blogPrompts.wrtn(keyword).replace(/\n/g, ' ');

    try {
      const { browser, page } = await this.puppeteerService.getBrowser();

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto('https://wrtn.ai'),
      ]);

      // 모달 닫기
      await this.utilsService.delayRandomTime('quick');
      await page.click('.css-12wvnvt');

      // 프롬프트 타이핑
      await this.utilsService.delayRandomTime('quick');
      await page.type('.css-156cis4', prompt);
      await page.keyboard.press('Enter');

      // 기다리기
      await page.waitForSelector('.css-1rt91ct');

      // 답변 내용 부분 크롤링해서 콘텐츠 리스트로 만들기
      const elementTree = await page.evaluate((selector: string) => {
        function serializeElement(element: Element) {
          let tag = element.tagName.toLowerCase();
          const text = Array.from(element.childNodes)
            .find((childNode) => childNode.nodeType === 3)
            ?.textContent.trim();

          const children = element.children;

          const childrenTree = [];

          for (const child of children) {
            const serialized = serializeElement(child);
            childrenTree.push(serialized);
          }

          return {
            tag,
            text,
            elementTree: childrenTree.length > 0 ? childrenTree : null,
          };
        }

        const element = document.querySelector(selector);
        return serializeElement(element);
      }, '#chat-room-message-1 > .css-1j17jy3');
      await browser.close();
      return elementTree;
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `wrtn,puppeteer: puppeteer로 뤼튼 ai 작동중 오류. ${error.message}`,
      });
    }
  }
}
