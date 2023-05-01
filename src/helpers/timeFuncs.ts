export function getDateInFuture(days: number) {
  // Create a new Date object
  const date = new Date();

  // Add the specified number of days to the date
  date.setDate(date.getDate() + days);

  // Get the Unix timestamp of the date (in milliseconds)
  return date.getTime();
}
