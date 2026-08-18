// DOM Utilities for AMEVA Promo
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export function addClass(el, className) {
  if (el) el.classList.add(className);
}

export function removeClass(el, className) {
  if (el) el.classList.remove(className);
}

export function toggleClass(el, className) {
  if (el) el.classList.toggle(className);
}

export function setStyle(el, styles) {
  if (el) {
    Object.assign(el.style, styles);
  }
}
