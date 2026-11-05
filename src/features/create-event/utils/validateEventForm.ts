import { isValidWebLink } from "./validateEventPayload";

export interface FormProblem {
  fieldId?: string;
  message: string;
}

function minutesSinceMidnight(hour: string, minute: string, period: string) {
  return ((Number(hour) % 12) + (period === "PM" ? 12 : 0)) * 60 + Number(minute);
}

function checkSchedule(data: any, isEditing: boolean): FormProblem | null {
  const dateField = "event-date-section";
  if (!data.selectedDate) return { fieldId: dateField, message: "Please select an event date on the calendar" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxAllowedDate = new Date(today);
  maxAllowedDate.setFullYear(today.getFullYear() + 1);

  if (data.selectedDate < today && !isEditing) return { fieldId: dateField, message: "Event date cannot be in the past" };
  if (data.selectedDate > maxAllowedDate) return { fieldId: dateField, message: "Event date cannot be more than 1 year in advance" };
  if (data.hasEndDate && !data.endDate) return { fieldId: dateField, message: "Pick an end date, or remove it" };

  const isSameDay = !data.hasEndDate || data.endDate.getTime() === data.selectedDate.getTime();
  if (data.hasEndTime && data.selectedHour && isSameDay) {
    const start = minutesSinceMidnight(data.selectedHour, data.selectedMin, data.selectedAmPm);
    const end = minutesSinceMidnight(data.endHour, data.endMin, data.endAmPm);
    if (end <= start) return { fieldId: dateField, message: "End time must be after the start time. For overnight events, add an end date." };
  }
  return null;
}

export function validateEventForm(data: any, options: { isEditing: boolean; isCollegeEvent: boolean; duplicateError: string; isCheckingDuplicate: boolean }): FormProblem | null {
  if (!data.title?.trim()) return { fieldId: "event-title-input", message: "Please enter an event title" };
  if (!data.category) return { fieldId: "event-category-select", message: "Please select a category" };
  if (!data.description?.trim()) return { fieldId: "event-description-input", message: "Please enter a description" };
  if (options.isCollegeEvent && data.collegeOnly && !data.collegeId) {
    return { fieldId: "event-college-input", message: "Pick the college from the list, or open this event to all colleges." };
  }

  const scheduleProblem = checkSchedule(data, options.isEditing);
  if (scheduleProblem) return scheduleProblem;

  if (data.isOnline && !data.regLink?.trim()) return { fieldId: "event-reg-link-input", message: "Online events need a registration link" };
  if (data.regLink?.trim()) {
    const link = data.regLink.trim();
    const fullLink = /^https?:\/\//i.test(link) ? link : `https://${link}`;
    if (!isValidWebLink(fullLink)) return { fieldId: "event-reg-link-input", message: "Enter a valid link, like lu.ma/your-event" };
  }
  if (!data.isOnline && !data.city) return { fieldId: "event-city-select", message: "Please select a city" };
  if (!data.isFree && !(Number(data.price) > 0)) return { fieldId: "event-price-input", message: "Enter the ticket price, or mark the event as free" };
  if (options.duplicateError) return { fieldId: "event-reg-link-input", message: options.duplicateError };
  if (options.isCheckingDuplicate) return { message: "Still checking the link. Try again in a second." };
  return null;
}
