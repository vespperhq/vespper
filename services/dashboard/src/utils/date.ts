export const utcToLocal = (utcDate: string | Date) => {
  const date = new Date(utcDate);
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return localDate;
};

export const formatDate = (inputDate: string | Date) => {
  const localDate = utcToLocal(new Date(inputDate));

  const formattedDate = localDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // Use 24-hour format
  });

  return formattedDate;
};
