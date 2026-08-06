import type { Entities } from '../types';

export function extractEntities(fullText: string): Entities {
  const entities: Entities = { dates: [], money: [], organizations: [], emails: [], urls: [], percentages: [], phones: [] };

  const moneyRegex = /(?:₩|KRW|\\\$|USD|\d+(?:,\d{3})*\s*(?:원|달러|달라)|\d+(?:\.\d+)?\s*(?:억|만|천)\s*(?:원|달러))/g;
  const dateRegex = /\d{4}년\s*\d{1,2}월(?:\s*\d{1,2}일)?|\d{4}[./-]\d{1,2}[./-]\d{1,2}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const orgRegex = /[가-힣a-zA-Z]+(?:대학교|대학원|학과|학부|센터|연구소|기관|협회|주식회사|㈜|Inc\.|Corp\.|Co\.,\s*Ltd)|주식회사\s+[가-힣a-zA-Z]+/g;
  const phoneRegex = /(?:010|02|0[3-9]{1,2})[-.]?\d{3,4}[-.]?\d{4}/g;
  const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})+(?:\/[a-zA-Z0-9_.-]*)*\/?/g;

  entities.money = Array.from(new Set(fullText.match(moneyRegex) || []));
  entities.dates = Array.from(new Set(fullText.match(dateRegex) || []));
  entities.emails = Array.from(new Set(fullText.match(emailRegex) || []));
  entities.organizations = Array.from(new Set(fullText.match(orgRegex) || []));
  entities.phones = Array.from(new Set(fullText.match(phoneRegex) || []));
  entities.urls = Array.from(new Set(fullText.match(urlRegex) || []));

  return entities;
}
