export const blogPrompts = {
  longTailKeywords: (keyword: string) => `
{
  "keyword": "키워드",
  "long_tail_keywords": [
    "롱테일 키워드 1",
    "롱테일 키워드 2",
    "롱테일 키워드 3",
    "롱테일 키워드 4",
    "롱테일 키워드 5",
  ]
}
과제: 입력된 키워드에 대한 롱테일 키워드 5가지를 아래에 주어진 json 형식에 맞게 출력하는데, json 코드로 감싸지말고 json 데이터를 그대로 출력해야 한다.
조건: 롱테일 키워드는 사람들이 가장 관심을 가질 내용이여야 한다. 롱테일 키워드는 입력 키워드 한 단어와 세부 키워드 한 단어 총 두단어의 조합으로 이루어져야한다.
예시: "금연"이 입력키워드 일때, ["금연 효과", "금연 방법", "금연 보조제", "금연시 금단증상", "금연 동기부여"]
입력 키워드: ${keyword}
`,
  tistoryContent: (keyword: string) => `
something...
`,
};
