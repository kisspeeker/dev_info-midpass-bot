export function declOfNum(number: number, titles: string[]) {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

export function calculateTimeDifference(
  startDate: Date | string,
  endDate = new Date(),
) {
  const diffInMilliseconds = +endDate - +new Date(startDate);

  const hours = Math.floor(diffInMilliseconds / 3600000);
  const minutes = Math.floor((diffInMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((diffInMilliseconds % 60000) / 1000);

  return `${hours}:${minutes}:${seconds}`;
}

export function calculateDaysDifference(
  startDate: Date | string,
  endDate = new Date(),
) {
  const diffInMilliseconds = +endDate - +new Date(startDate);
  const diffInDays = Math.floor(diffInMilliseconds / (24 * 60 * 60 * 1000));

  return diffInDays;
}
