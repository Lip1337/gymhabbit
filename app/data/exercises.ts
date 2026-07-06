// Kuratierte Übungsliste, gruppiert nach Muskelgruppe. Fest im Code – kein Setup, keine DB.

export type MuscleGroup =
  | "Brust"
  | "Rücken"
  | "Schultern"
  | "Bizeps"
  | "Trizeps"
  | "Beine"
  | "Bauch"
  | "Cardio";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Brust",
  "Rücken",
  "Schultern",
  "Bizeps",
  "Trizeps",
  "Beine",
  "Bauch",
  "Cardio",
];

export type ExerciseEntry = {
  name: string;
  group: MuscleGroup;
};

export const CURATED_EXERCISES: ExerciseEntry[] = [
  // Brust
  { name: "Bankdrücken", group: "Brust" },
  { name: "Schrägbankdrücken", group: "Brust" },
  { name: "Negativbankdrücken", group: "Brust" },
  { name: "Kurzhantel Bankdrücken", group: "Brust" },
  { name: "Butterfly / Pec Deck", group: "Brust" },
  { name: "Kabelzug Fliegende", group: "Brust" },
  { name: "Liegestütze", group: "Brust" },

  // Rücken
  { name: "Klimmzüge", group: "Rücken" },
  { name: "Latzug", group: "Rücken" },
  { name: "Rudern am Kabel", group: "Rücken" },
  { name: "Langhantelrudern", group: "Rücken" },
  { name: "Kurzhantelrudern", group: "Rücken" },
  { name: "T-Bar-Rudern", group: "Rücken" },
  { name: "Kreuzheben", group: "Rücken" },
  { name: "Hyperextensions", group: "Rücken" },

  // Schultern
  { name: "Schulterdrücken (Langhantel)", group: "Schultern" },
  { name: "Schulterdrücken (Kurzhantel)", group: "Schultern" },
  { name: "Seitheben", group: "Schultern" },
  { name: "Frontheben", group: "Schultern" },
  { name: "Reverse Butterfly", group: "Schultern" },
  { name: "Face Pulls", group: "Schultern" },
  { name: "Shrugs", group: "Schultern" },

  // Bizeps
  { name: "Bizeps-Curls (Langhantel)", group: "Bizeps" },
  { name: "Bizeps-Curls (Kurzhantel)", group: "Bizeps" },
  { name: "Hammercurls", group: "Bizeps" },
  { name: "Scott-Curls (Preacher)", group: "Bizeps" },
  { name: "Konzentrationscurls", group: "Bizeps" },
  { name: "Kabelcurls", group: "Bizeps" },

  // Trizeps
  { name: "Trizepsdrücken am Kabel", group: "Trizeps" },
  { name: "Dips", group: "Trizeps" },
  { name: "Enges Bankdrücken", group: "Trizeps" },
  { name: "SZ-Stirndrücken (French Press)", group: "Trizeps" },
  { name: "Overhead-Trizeps", group: "Trizeps" },
  { name: "Kickbacks", group: "Trizeps" },

  // Beine
  { name: "Kniebeugen", group: "Beine" },
  { name: "Beinpresse", group: "Beine" },
  { name: "Beinstrecker", group: "Beine" },
  { name: "Beinbeuger", group: "Beine" },
  { name: "Ausfallschritte", group: "Beine" },
  { name: "Wadenheben", group: "Beine" },
  { name: "Rumänisches Kreuzheben", group: "Beine" },
  { name: "Hip Thrust", group: "Beine" },

  // Bauch
  { name: "Crunches", group: "Bauch" },
  { name: "Beinheben", group: "Bauch" },
  { name: "Plank", group: "Bauch" },
  { name: "Russian Twists", group: "Bauch" },
  { name: "Cable Crunch", group: "Bauch" },
  { name: "Beinheben hängend", group: "Bauch" },

  // Cardio
  { name: "Laufband", group: "Cardio" },
  { name: "Rudergerät", group: "Cardio" },
  { name: "Crosstrainer", group: "Cardio" },
  { name: "Fahrrad / Ergometer", group: "Cardio" },
];
