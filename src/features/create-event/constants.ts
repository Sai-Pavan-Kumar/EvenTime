export const CATEGORY_TEMPLATES: Record<string, string> = {
  "AI Event": `About the Event:\n\nWho Should Attend:`,

  "Auto & EV Expo": `About the Expo:\n\nWho Should Attend:`,

  "Awards Night": `About the Event:\n\nWho Should Attend:`,

  "Career Event": `About the Event:\n\nWho Should Attend:`,

  "Charity Event": `About the Initiative:\n\nWho Should Attend:`,

  "College Event": `About the Event:\n\nWho Should Attend:`,

  "College Fest": `About the Fest:\n\nWho Should Attend:`,

  "Comedy Show": `About the Show:\n\nWho Should Attend:`,

  "Community Event": `About the Gathering:\n\nWho Should Attend:`,

  "Concert": `About the Concert:\n\nWho Should Attend:`,

  "Conference": `About the Conference:\n\nWho Should Attend:`,

  "Creator Meetup": `About the Meetup:\n\nWho Should Attend:`,

  "Default Event": `About the Event:\n\nWho Should Attend:`,

  "Developer Event": `About the Event:\n\nWho Should Attend:`,

  "Exhibition": `About the Exhibition:\n\nWho Should Attend:`,

  "Film Festival": `About the Festival:\n\nWho Should Attend:`,

  "Fitness Event": `About the Event:\n\nWho Should Attend:`,

  "Food Festival": `About the Festival:\n\nWho Should Attend:`,

  "Founder Meetup": `About the Meetup:\n\nWho Should Attend:`,

  "Gaming & Esports": `About the Tournament:\n\nWho Should Attend:`,

  "Hackathon": `About the Hackathon:\n\nWho Should Attend:`,

  "Investor Event": `About the Event:\n\nWho Should Attend:`,

  "Music Festival": `About the Festival:\n\nWho Should Attend:`,

  "Open Mic": `About the Event:\n\nWho Should Attend:`,

  "Pet Event": `About the Event:\n\nWho Should Attend:`,

  "Running Event": `About the Event:\n\nWho Should Attend:`,

  "Sports Tournament": `About the Tournament:\n\nWho Should Attend:`,

  "Startup Event": `About the Event:\n\nWho Should Attend:`,

  "Summit": `About the Summit:\n\nWho Should Attend:`,

  "Tech Event": `About the Event:\n\nWho Should Attend:`,

  "Wellness Event": `About the Event:\n\nWho Should Attend:`,

  "Women Event": `About the Event:\n\nWho Should Attend:`,

  "Workshop": `About the Workshop:\n\nWho Should Attend:`
};

export const audienceOptions = ["Everyone", "Students Only", "Professionals Only","Selected Audience Only","16+ Only", "18+ Only"];

export const categoriesList = [
  "AI Event", "Auto & EV Expo", "Awards Night", "Career Event","Charity Event", "College Event","College Fest", "Comedy Show", "Community Event", "Concert", "Conference","Creator Meetup", "Developer Event", "Exhibition", "Film Festival","Fitness Event", "Food Festival", "Founder Meetup", "Gaming & Esports", "Hackathon","Investor Event", "Music Festival", "Open Mic", "Pet Event", "Running Event","Sports Tournament", "Startup Event", "Summit", "Tech Event", "Wellness Event","Women Event", "Workshop"
];

export const teamOptions = ["Solo", "Teams of 2-4", "Teams of 4+", "Both Solo & Team"];
export const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
export const mins = ["00", "15", "30", "45"];
export const ampms = ["AM", "PM"];