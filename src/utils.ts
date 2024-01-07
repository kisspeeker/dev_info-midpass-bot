export function declOfNum(number: number, titles: string[]) {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

export function getLocaleDateString(date: string | Date) {
  return new Date(date).toLocaleString('ru-RU', {
    timeStyle: 'medium',
    dateStyle: 'short',
    timeZone: 'Europe/Moscow',
  });
}

export function calculateTimeDifference(startDate, endDate = new Date()) {
  const diffInMilliseconds = +endDate - +startDate;
  const diffDate = new Date(diffInMilliseconds);

  return diffDate.toLocaleString('ru-RU', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: 'UTC',
  });
}

export function calculateDaysDifference(
  startDate: Date | string,
  endDate = new Date(),
) {
  const diffInMilliseconds = +endDate - +new Date(startDate);
  const diffInDays = Math.floor(diffInMilliseconds / (24 * 60 * 60 * 1000));

  return diffInDays;
}

export function isValidDate(checkingDate: string | Date) {
  const date = new Date(checkingDate);
  return (
    !isNaN(+date) &&
    date instanceof Date &&
    Math.abs(new Date().getFullYear() - date.getFullYear()) < 5
  );
}

export async function sleep(delay: number = 100) {
  await new Promise((resolve) => setTimeout(resolve, delay));
}
