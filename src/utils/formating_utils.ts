export const calcRecentDate = (date: Date) => {
  var thisTime = new Date();
  var diff = thisTime.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  const seconds = Math.floor(diff / (1000 * 60));
  return `${seconds} second${seconds > 1 ? "s" : ""}`;
};

export const humanFileSize = (size: number) => {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
};
