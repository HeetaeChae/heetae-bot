import { HotelInfoV1 } from '../interfaces/hotel-info.interface';
import { BlogV1Styles } from './styles';

export const BlogV1Templates = {
  createIntroHTML: () => {},
  createOutlineHTML: (
    hotelInfos: HotelInfoV1[],
    styles: typeof BlogV1Styles,
  ) => {
    const outlineTextsHTML = hotelInfos
      .map(
        (hotelInfo: HotelInfoV1, index) =>
          `<p>${index + 1}. <a href="#section${index + 1}" style="${styles.outlineText}">${hotelInfo.name}</a></p>`,
      )
      .join('\n');

    return `
      <div style="${styles.outlineContainer}">
        <p><strong>목차</strong></p>
        ${outlineTextsHTML}
      </div>
    `;
  },
  createSectionHTML: (
    hotelInfo: HotelInfoV1,
    index: number,
    styles: typeof BlogV1Styles,
  ) => {
    const count = index + 1;

    const {
      imgUrls,
      name,
      subName,
      address,
      description,
      trafficInfos,
      aiReview,
      lowestPrice,
    } = hotelInfo;

    const imgHTML = imgUrls
      .map(
        (url, index) =>
          `<img style="${styles.imgContent}" src="${url}" alt="${subName} ${index + 1}"/>`,
      )
      .join('\n');
    const trafficInfoHTML = trafficInfos
      .map((text) => `<li>${text}</li>`)
      .join('\n');

    return `
      <div style="${styles.sectionContainer}">
        <h3 id="#section${count}" style="${styles.sectionTitle}">${count}. ${name}</h3>
        <div style="${styles.quoteContainer}">
          <ul>
            <li><strong>호텔명: </strong>${name}(${subName})</li>
            <li><strong>주소: </strong>${address}</li>
            <li><strong>1박 가격: </strong>${lowestPrice}만원 ~</li>
          </ul>
        </div>
        <div style="${styles.imgContainer}">
          ${imgHTML}
        </div>
        <div style="${styles.textBoxContainer}">
          <p><strong>호텔 소개글</strong></p>
          <br />
          <p>${description}</p> 
        </div>
        <div style="${styles.textBoxContainer}">
          <p><strong>ai가 요약한 호텔 리뷰</strong></p>
          <br />
          <p>${aiReview}</p>  
        </div>
        <p>주변 교통</p>
        <ul>
          ${trafficInfoHTML}
        </ul>
      </div>
    `;
  },
};
