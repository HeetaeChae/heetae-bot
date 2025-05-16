import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

import { htmlStyleMap } from 'src/common/contants/styles';
import { getIndexLiTag, getIndexTag } from 'src/common/contants/tags';

type Delay = 'quick' | 'slow';

interface Elements {
  type: string;
  text: string | null;
  elements: Elements[] | null;
}

@Injectable()
export class UtilsService {
  async delayRandomTime(delay: Delay) {
    const time = { min: 0, max: 0 };
    if (delay === 'quick') {
      Object.assign(time, { min: 500, max: 2000 });
    }
    if (delay === 'slow') {
      Object.assign(time, { min: 2000, max: 3000 });
    }

    const randomTime =
      Math.floor(Math.random() * (time.max - time.min + 1)) + time.min;
    await new Promise((resolve) => setTimeout(resolve, randomTime));
  }

  async delayTypingTime(delay: Delay) {}

  getRandomIdx(num: number) {
    return Math.floor(Math.random() * num);
  }

  renderElementsToTagList(elements: any[]): string[] {
    const tagList = [];
    let h2Count = 0;

    for (const element of elements) {
      const { tag, text } = element;

      if (tag === 'h1') {
        continue;
      }
      if (tag === 'h2') {
        h2Count += 1;
      }

      const style = htmlStyleMap[tag] ? `style="${htmlStyleMap[tag]}"` : '';
      const id = tag === 'h2' ? `id="section${h2Count}"` : '';

      tagList.push(
        `<${tag} ${style} ${id}>${text || ''}${element.elements ? this.renderElementsToTagList(element.elements) : ''}</${tag}>`,
      );
    }

    return tagList;
  }

  renderElementsToIndexTag(elements: any[]): string {
    const indexLiTagList = [];

    for (const element of elements) {
      const { tag, text } = element;
      const idx = indexLiTagList.length + 1;

      if (tag === 'h2') {
        indexLiTagList.push(getIndexLiTag(idx, text));
      }
    }

    return getIndexTag(indexLiTagList.join(''));
  }

  renderElementsToTitle(elements: any[]): string {
    const h1Element = elements.filter((el) => el.tag === 'h1');
    const title = h1Element[0].text;

    return title;
  }

  getDateTime() {
    return dayjs().format('YYYYMMDD HH:mm:ss');
  }
}
