import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getWrtnPrompt } from 'src/common/contants/prompts';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';

export interface ElementData {
  tag: string;
  text: string;
  elements: ElementData[];
}

@Injectable()
export class WrtnService {
  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
  ) {}

  async getElementData(keyword: string): Promise<ElementData> {
    const prompt = getWrtnPrompt(keyword).replace(/\n/g, ' ');

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

      // 답변 내용 부분 크롤링해서 elementTree 만들기
      const result = await page.evaluate((selector: string) => {
        function serializeWrtnElement(wrtnElement: Element) {
          const tag = wrtnElement.tagName.toLowerCase();
          let text =
            Array.from(wrtnElement.childNodes)
              .find((childNode) => childNode.nodeType === 3)
              ?.textContent.trim() || null;
          const elements = [];

          const children = wrtnElement.children;

          for (const child of children) {
            const serialized = serializeWrtnElement(child);
            if (serialized.tag === 'strong') {
              text = serialized.text + text;
              continue;
            }
            elements.push(serialized);
          }

          return { tag, text, elements: elements.length > 0 ? elements : null };
        }

        const wrtnElement = document.querySelector(selector);
        return serializeWrtnElement(wrtnElement);
      }, '#chat-room-message-1 > .css-1j17jy3');

      await browser.close();
      return result;
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `[WRTN]: puppeteer로 뤼튼 ai 작동중 오류. ${error.message}`,
      });
    }
  }
}
