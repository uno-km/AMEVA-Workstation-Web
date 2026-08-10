/**
 * @file smartDocsUtils.ts
 * @system AMEVA OS Desktop Workstation
 * @role SmartDocs V2 (Advanced Office Automation) Utility Functions
 */

export const smartDocsUtils = {
  /**
   * 숫자를 한글 금액(예: 1500000 -> 일백오십만 원)으로 변환합니다.
   * [고도화] 정규식을 통해 다양한 포맷(1,500,000 등) 안정적 파싱
   */
  convertNumberToKoreanCurrency: (numStr: string): string => {
    const num = parseInt(numStr.replace(/,/g, ''), 10);
    if (isNaN(num)) return numStr;

    const hanA = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"];
    const danA = ["", "십", "백", "천"];
    const danG = ["", "만", "억", "조", "경"];
    let result = "";

    const strNum = num.toString();
    for (let i = 0; i < strNum.length; i++) {
      const n = parseInt(strNum.charAt(i), 10);
      const str = hanA[n];
      if (str !== "") {
        result += str + danA[(strNum.length - i - 1) % 4];
      }
      if ((strNum.length - i - 1) % 4 === 0 && result.length > 0) {
        const unit = danG[(strNum.length - i - 1) / 4];
        if (!result.endsWith(unit)) {
            result += unit;
        }
      }
    }
    return result ? result + " 원" : "영 원";
  },

  /**
   * 생년월일 문자열(YYYY-MM-DD 또는 YYYYMMDD)을 받아 현재 기준 만 나이를 계산합니다.
   */
  calculateKoreanAge: (birthStr: string): number => {
    const cleanStr = birthStr.replace(/[^0-9]/g, '');
    if (cleanStr.length !== 8) return -1;

    const year = parseInt(cleanStr.substring(0, 4), 10);
    const month = parseInt(cleanStr.substring(4, 6), 10);
    const day = parseInt(cleanStr.substring(6, 8), 10);

    const today = new Date();
    let age = today.getFullYear() - year;
    
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
      age--;
    }
    
    return age;
  },

  /**
   * [NEW] 행정 순화어 자동 교정기
   * 딱딱하거나 잘못된 일본어투 행정 용어를 올바른 우리말로 교정합니다.
   */
  correctOfficialTerms: (text: string): string => {
    let corrected = text;
    const dictionary: Record<string, string> = {
      '금일': '오늘',
      '익일': '다음날',
      '명일': '내일',
      '작일': '어제',
      '기일': '날짜',
      '시말서': '경위서',
      '결재를 득하다': '결재를 받다',
      '구두로': '말(씀)로',
      '통상': '보통',
      '하달': '전달',
      '지양하다': '피하다',
    };

    for (const [wrong, right] of Object.entries(dictionary)) {
      const regex = new RegExp(wrong, 'g');
      corrected = corrected.replace(regex, right);
    }
    
    return corrected;
  }
};
