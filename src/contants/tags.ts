export const getIndexTag = (indexList: string): string => `
<div style="margin: auto; margin-bottom: 3em; width: 250px; background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 5px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1); font-size: 14px;">
  <h3 style="margin-top: 0; font-size: 16px; color: #333; text-align: center;">목차</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">
   ${indexList}
  </ul>
</div>`;

export const getIndexListTag = (idx: number, text: string) =>
  `<li style="margin-bottom: 8px;"><a href="#section${idx}" style="text-decoration: none; color: #007bff; font-weight: bold; transition: color 0.3s;">${text}</a></li>`;

export const getImgTag = (src: string, alt: string) =>
  `<img style="max-width: 33%; height: auto; object-fit: cover; gap: 5px;" src="${src}" alt="${alt}" />`;

export const getImgContainerTag = (imgTag: string) =>
  `<div style="display: flex; justify-content: center; width: 100%; margin: 1em 0; gap: 5px">${imgTag}</div>`;

export const getYoutubeLinkTag = (
  url: string,
  title: string,
  desc: string,
  creator: string,
  thumbnail: string,
) => `<a href="${url}" target="_blank" style="text-decoration: none; color: inherit;">
<div style="margin-top: 8em; display: flex; align-items: center; width: 100%; max-width: 600px; border: 1px solid #ddd; border-radius: 10px; padding: 10px; gap: 15px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1); position: relative; cursor: pointer;">
  <div style="width: 40%; max-width: 200px;">
    <img src="${thumbnail}" alt="${title}" style="width: 100%; border-radius: 5px;">
  </div>
  <div style="flex: 1; display: flex; flex-direction: column; position: relative;">
    <p style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${title}</p>
    <p style="font-size: 14px; color: #555; margin: 0 0 8px;">${desc}</p>
    <p style="font-size: 12px; color: #777; margin: 0;">creator: <strong>${creator}</strong></p>
    <div style="display: flex; align-items: center; position: absolute; bottom: 0; right: 0;">
      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube 로고" style="width: 60px; height: auto; margin-right: 5px;">
    </div>
  </div>
</div>
</a>`;
