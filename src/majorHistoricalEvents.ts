/**
 * Starter set of major historical, scientific, tribal, and forward/space events.
 * These can be overlaid on the EventTimeline and used for story matching.
 *
 * Users can extend this via research proposals or future import.
 */

export type MajorEvent = {
  year: number;
  label: string;
  category: "history" | "science" | "space" | "tribal" | "migration";
  description?: string;
};

export const MAJOR_EVENTS: MajorEvent[] = [
  // Classic historical
  { year: -753, label: "Founding of Rome", category: "history" },
  { year: 476, label: "Fall of Western Roman Empire", category: "history" },
  { year: 1066, label: "Norman Conquest of England", category: "history" },
  { year: 1492, label: "Columbus reaches Americas", category: "history" },
  { year: 1776, label: "American Declaration of Independence", category: "history" },
  { year: 1789, label: "French Revolution", category: "history" },
  { year: 1865, label: "End of American Civil War", category: "history" },
  { year: 1914, label: "World War I begins", category: "history" },
  { year: 1945, label: "End of World War II", category: "history" },

  // Science & tech
  { year: 1543, label: "Copernicus — heliocentric model", category: "science" },
  { year: 1859, label: "Darwin — On the Origin of Species", category: "science" },
  { year: 1953, label: "Watson & Crick — DNA double helix", category: "science" },
  { year: 2003, label: "Human Genome Project completed", category: "science" },

  // Space & forward
  { year: 1957, label: "Sputnik 1 — first artificial satellite", category: "space" },
  { year: 1969, label: "Apollo 11 — first humans on the Moon", category: "space" },
  { year: 2021, label: "Perseverance lands on Mars", category: "space" },
  { year: 2030, label: "Projected first crewed Mars mission window", category: "space" },
  { year: 2050, label: "Projected permanent human presence beyond Earth (speculative)", category: "space" },

  // Tribal / deep human stories (examples — extend with real data)
  { year: -15000, label: "Peopling of the Americas (current best estimate)", category: "tribal" },
  { year: -4000, label: "Early agriculture & settled societies", category: "tribal" },
  { year: 1492, label: "Great Dying — massive Indigenous population collapse in Americas", category: "tribal" },
];
