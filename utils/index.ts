export const formatDate = (
  dateValue: { seconds: number } | string | number | Date | null | undefined
): string => {
  let dateObj: Date;
  if (!dateValue) return "";
  // Firestore Timestamp object
  if (typeof dateValue === "object" && dateValue instanceof Date) {
    dateObj = dateValue;
  } else if (typeof dateValue === "object" && "seconds" in dateValue) {
    dateObj = new Date(dateValue.seconds * 1000);
  } else if (typeof dateValue === "string") {
    // Try parsing string
    const parsed = Date.parse(dateValue);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    } else {
      return "Invalid date";
    }
  } else if (typeof dateValue === "number") {
    dateObj = new Date(dateValue);
  } else {
    return "Invalid date";
  }
  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
