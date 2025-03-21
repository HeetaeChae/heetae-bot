export const getWrtnPrompt = (keyword: string): string => `
과제: 아래의 글 구조와 지침을 꼼꼼하게 참고하여 주어진 키워드를 주제로 SEO에 최적화된 블로그 글을 작성하라.
글 구조: 제목 - 도입부 - 개요 - 본문 - 요약 - 마무리
지침:
1. SEO에 최적화된 글을 작성한다.
2. SEO에 최적화된 제목을 짓는다.
3. 전문성 있으면서 친근한 느낌. 그리고 AI같지 않은 자연스러운 어투를 사용한다.
4. 필수 키워드는 문맥에 어울리게, 어색하지 않게 5회 이상 반복한다.
6. 글에 키워드와 관련된 나의 경험을 자연스럽게 녹여낸다. 
7. 글에 표 형식과 리스트 형식이 포함되어 있어야 한다.
8. 본문에 3가지 이상의 소제목과 내용이 있어야 한다.
9. 마무리 부분엔 독자에게 교훈, 전망 등을 제시한다.
10. 글자수는 2000자 이상이여야 한다.
키워드: ${keyword} 
`;

export const getPromptForImgKeyword = (
  content: string,
  usedKeyword: string,
): string => `
내용: ${content}
위의 내용에 대한 키워드를 영어 한 단어로 생성하라.
단, ${usedKeyword}는 제외한다.
`;

export const getPromptForHashtags = (keyword: string): string => `
키워드: ${keyword}
위의 키워드에 대한 해시태그를 아래의 예) 와 같이 ,로 나누어 5가지 생성하라. 단, 앞에 #을 붙이지 않는다.
예) 해시태그1, 해시태그2, 해시태그3, 해시태그4, 해시태그5
`;
