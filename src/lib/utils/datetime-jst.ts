/**
 * JST (Japan Standard Time) 統一処理ユーティリティ
 * システム全体で一貫したJST基準の日時処理を提供
 */

/**
 * JST基準の現在日時を取得
 */
export function getJSTDate(): Date {
  const now = new Date();
  const jstOffset = 9 * 60; // JST = UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (jstOffset * 60000));
}

/**
 * JST基準の現在日時をタイムスタンプで取得
 */
export function getJSTNow(): number {
  return getJSTDate().getTime();
}

/**
 * JST基準でYYYY-MM-DD形式の日付文字列を取得
 */
export function getJSTDateString(date?: Date): string {
  const jstDate = date ? convertToJST(date) : getJSTDate();
  // toISOString()はUTC基準なので、JST変換後のDateから直接年月日を取得
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * JST基準でHH:mm形式の時刻文字列を取得
 */
export function getJSTTimeString(date?: Date): string {
  const jstDate = date ? convertToJST(date) : getJSTDate();
  return jstDate.toTimeString().slice(0, 5);
}

/**
 * JST基準でYYYY-MM-DDTHH:mm:ss形式のISO文字列を取得
 */
export function getJSTISOString(date?: Date): string {
  const jstDate = date ? convertToJST(date) : getJSTDate();
  return jstDate.toISOString().replace('Z', '+09:00');
}

/**
 * UTC日時をJST日時に変換
 */
export function convertToJST(utcDate: Date): Date {
  const jstOffset = 9 * 60; // JST = UTC+9
  const utc = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
  return new Date(utc + (jstOffset * 60000));
}

/**
 * JST日時をUTC日時に変換
 */
export function convertToUTC(jstDate: Date): Date {
  const jstOffset = 9 * 60; // JST = UTC+9
  const utc = jstDate.getTime() - (jstOffset * 60000);
  return new Date(utc - (jstDate.getTimezoneOffset() * 60000));
}

/**
 * 日付文字列(YYYY-MM-DD)と時刻文字列(HH:mm)からJST日時を作成
 */
export function createJSTDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  // JST基準で日時を作成
  const jstDate = new Date();
  jstDate.setFullYear(year, month - 1, day);
  jstDate.setHours(hour, minute, 0, 0);
  
  return jstDate;
}

/**
 * JST基準で今日の日付文字列を取得
 */
export function getTodayJST(): string {
  return getJSTDateString();
}

/**
 * JST基準で現在時刻文字列を取得
 */
export function getCurrentTimeJST(): string {
  return getJSTTimeString();
}

/**
 * JST基準でユニークなID生成用タイムスタンプを取得
 */
export function getJSTTimestampForID(): string {
  return getJSTNow().toString();
}

/**
 * 指定された日数後のJST日付文字列を取得
 */
export function getJSTDateAfterDays(days: number): string {
  const jstDate = getJSTDate();
  jstDate.setDate(jstDate.getDate() + days);
  return getJSTDateString(jstDate);
}

/**
 * 2つのJST日付文字列を比較
 */
export function compareDateStrings(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getTime() - d2.getTime();
}

/**
 * JST基準で今日かどうかを判定
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayJST();
}