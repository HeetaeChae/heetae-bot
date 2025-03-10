import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { blogPrompts } from 'src/prompts/blog-prompts';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';

@Injectable()
export class WrtnService {
  constructor(
    private puppeteerService: PuppeteerService,
    private utilsService: UtilsService,
  ) {}

  async createContentsList(keyword: string): Promise<void> {
    const prompt = blogPrompts.wrtn('숙면의 중요성').replace(/\n/g, ' ');

    try {
      const { browser, page } = await this.puppeteerService.getBrowser();

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto('https://wrtn.ai'),
      ]);

      // 모달 닫기
      await this.utilsService.delayRandomTime('slow');
      await page.click('.css-12wvnvt', { delay: 1000 });

      // 프롬프트 타이핑
      await this.utilsService.delayRandomTime('quick');
      await page.type('.css-156cis4', prompt, { delay: 30 });
      await page.keyboard.press('Enter');

      // html 긁기
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 0.5)); // 1분 대기

      const domTree = await page.evaluate((selector) => {
        function serializeElement(element: Element) {
          console.log(element);
          if (!element) return null; // 요소가 없을 경우 예외 처리

          // 텍스트 노드만 있는 경우 처리
          if (element.nodeType === Node.TEXT_NODE) {
            const trimmedText = element.nodeValue.trim();
            return trimmedText ? { type: 'text', content: trimmedText } : null;
          }

          // 요소의 태그명 가져오기
          const tagName = element.tagName.toLowerCase();

          // 자식 요소들 객체화 (재귀 호출)
          const children = Array.from(element.childNodes)
            .map(serializeElement)
            .filter((child) => child !== null); // 빈 값 제거

          // 최종 구조 반환
          return {
            type: tagName,
            content:
              children.length > 0 ? children : element.textContent.trim(),
          };
        }

        // 🔥 특정 요소 내부만 분석
        const targetElement = document.querySelector(selector);
        return serializeElement(targetElement);
      }, '#chat-room-message-1 > .css-1j17jy3'); // 🔥 여기에 특정 요소의 선택자 입력

      console.log(domTree);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `wrtn,puppeteer: puppeteer로 뤼튼 ai 작동중 오류. ${error.message}`,
      });
    }
  }
}
