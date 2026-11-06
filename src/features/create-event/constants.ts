import { DEFAULT_CURRENCY } from "@/lib/eventPrice";
export const CATEGORY_TEMPLATES: Record<string, string> = {
  "AI Event": `About the Event:\n\nWho Should Attend:`,

  "Alumni Event": `About the Event:\n\nWho Should Attend:`,

  "Auto & EV Expo": `About the Expo:\n\nWho Should Attend:`,

  "Awards Night": `About the Event:\n\nWho Should Attend:`,

  "Career Event": `About the Event:\n\nWho Should Attend:`,

  "Charity Event": `About the Initiative:\n\nWho Should Attend:`,

  "Comedy Show": `About the Show:\n\nWho Should Attend:`,

  "Community Event": `About the Gathering:\n\nWho Should Attend:`,

  "Concert": `About the Concert:\n\nWho Should Attend:`,

  "Conference": `About the Conference:\n\nWho Should Attend:`,

  "Creator Meetup": `About the Meetup:\n\nWho Should Attend:`,

  "Default Event": `About the Event:\n\nWho Should Attend:`,

  "Developer Event": `About the Event:\n\nWho Should Attend:`,

  "Educational Fair": `About the Fair:\n\nWho Should Attend:`,

  "Exhibition": `About the Exhibition:\n\nWho Should Attend:`,

  "Expo": `About the Expo:\n\nWho Should Attend:`,

  "Film Festival": `About the Festival:\n\nWho Should Attend:`,

  "Fitness Event": `About the Event:\n\nWho Should Attend:`,

  "Food Festival": `About the Festival:\n\nWho Should Attend:`,

  "Founder Meetup": `About the Meetup:\n\nWho Should Attend:`,

  "Gaming & Esports": `About the Tournament:\n\nWho Should Attend:`,

  "Hackathon": `About the Hackathon:\n\nWho Should Attend:`,

  "Investor Event": `About the Event:\n\nWho Should Attend:`,

  "Meetup": `About the Meetup:\n\nWho Should Attend:`,

  "Music Festival": `About the Festival:\n\nWho Should Attend:`,

  "Networking Event": `About the Event:\n\nWho Should Attend:`,

  "Open Mic": `About the Event:\n\nWho Should Attend:`,

  "Pet Event": `About the Event:\n\nWho Should Attend:`,

  "Running Event": `About the Event:\n\nWho Should Attend:`,

  "Sports Tournament": `About the Tournament:\n\nWho Should Attend:`,

  "Startup Event": `About the Event:\n\nWho Should Attend:`,

  "Summit": `About the Summit:\n\nWho Should Attend:`,

  "Tech Event": `About the Event:\n\nWho Should Attend:`,

  "Wellness Event": `About the Event:\n\nWho Should Attend:`,

  "Women Event": `About the Event:\n\nWho Should Attend:`,

  "Workshop": `About the Workshop:\n\nWho Should Attend:`,

  "Art Event": `About the Event:\n\nWho Should Attend:`,

  "Blood Donation Drive": `About the Drive:\n\nWho Can Donate:`,

  "Book Fair": `About the Fair:\n\nWho Should Attend:`,

  "Cultural Event": `About the Event:\n\nWho Should Attend:`,

  "Job Fair": `About the Fair:\n\nWho Should Attend:`,

  "Medical Conference": `About the Conference:\n\nWho Should Attend:`,

  "Product Launch": `About the Launch:\n\nWho Should Attend:`,

  "Science Fair": `About the Fair:\n\nWho Should Attend:`,

  "Volunteer Event": `About the Initiative:\n\nWho Should Attend:`,

  "Adventure Event": `About the Adventure:\n\nWho Should Attend:`,

  "Fashion Show": `About the Show:\n\nWho Should Attend:`,

  "Group Tour": `About the Tour:\n\nWho Should Attend:`,

  "Health Camp": `About the Camp:\n\nWho Should Attend:`,

  "Real Estate Expo": `About the Expo:\n\nWho Should Attend:`,

  "Travel Meetup": `About the Meetup:\n\nWho Should Attend:`,

  "Space and Astronomy": `About the Event:\n\nWho Should Attend:`,

  "Star Gazing": `About the Event:\n\nWho Should Attend:`
};

export const audienceOptions = ["Everyone", "Students Only", "Professionals Only","Selected Audience Only","16+ Only", "18+ Only"];

export const categoriesList = [
  "Adventure Event", "AI Event", "Alumni Event", "Art Event", "Auto & EV Expo", "Awards Night", "Blood Donation Drive", "Book Fair", "Career Event","Charity Event", "Comedy Show", "Community Event", "Concert", "Conference","Creator Meetup", "Cultural Event", "Developer Event", "Educational Fair", "Exhibition", "Expo", "Fashion Show", "Film Festival","Fitness Event", "Food Festival", "Founder Meetup", "Gaming & Esports", "Group Tour", "Hackathon", "Health Camp","Investor Event", "Job Fair", "Medical Conference", "Meetup", "Music Festival", "Networking Event", "Open Mic", "Pet Event", "Product Launch", "Real Estate Expo", "Running Event","Science Fair", "Space and Astronomy", "Sports Tournament", "Star Gazing", "Startup Event", "Summit", "Tech Event", "Travel Meetup", "Volunteer Event", "Wellness Event","Women Event", "Workshop"
];

export const teamOptions = ["Solo", "Teams of 2-4", "Teams of 4+", "Both Solo & Team"];
export const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
export const mins = ["00", "15", "30", "45"];
export const ampms = ["AM", "PM"];
export const COLLEGE_YEAR_OPTIONS = [
  "All Years",
  "2024",
  "2025",
  "2026",
  "2027",
  "2028",
  "2029",
  "2030",
  "2031",
  "2032",
] as const;

export const EMPTY_EVENT_FORM = {
  regLink: "",
  isTrustedDomain: true,
  title: "",
  category: "",
  isCreatingNewCategory: false,
  selectedAudience: [],
  description: "",
  location: "",
  city: "",
  selectedDate: undefined,
  collegeBranch: "",
  collegeYear: "",
  collegeOnly: false,
  collegeId: null,
  collegeName: "",
  isCollegeEvent: false,
  selectedHour: "",
  selectedMin: "",
  selectedAmPm: "AM",
  hasEndTime: false,
  hasEndDate: false,
  endDate: undefined,
  endHour: "08",
  endMin: "00",
  endAmPm: "PM",
  isOnline: false,
  isFree: true,
  price: "",
  priceCurrency: DEFAULT_CURRENCY,
  priceIsStarting: false,
  isFeatured: false,
  organizer: "",
  prizes: "",
  teamSize: "",
  registrationDeadline: undefined,
  website: "",
};
