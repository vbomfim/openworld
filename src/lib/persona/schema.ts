export interface PersonaIdentity {
  name: string;
  age: number;
  gender: string;
  pronouns: string;
}

export interface PersonaBackground {
  birthplace: string;
  currentLocation: string;
  socialClass: string;
  educationLevel: string;
  profession: string;
  workplace: string;
}

export interface PersonaFamily {
  maritalStatus: string;
  children: string[];
  grandchildren: string[];
  livesWith: string[];
}

export interface PersonaPet {
  type: string;
  name: string;
  breed?: string;
}

export interface PersonaInterests {
  areasOfInterest: string[];
  hobbies: string[];
}

export interface PersonaDailyLife {
  routine: string;
  skipsBreakfast: boolean;
  exerciseHabits: string;
}

export interface PersonaPreferences {
  favoriteColor: string;
  favoriteFood: string;
  clothingStyle: string;
  musicTaste: string;
}

export interface PersonaHealth {
  medicalConditions: string[];
  allergies: string[];
  dietRestrictions: string[];
}

export interface PersonaPersonality {
  traits: string[];
  communicationStyle: string;
  temperament: string;
}

export interface PersonaHistory {
  keyLifeEvents: string[];
  memorableExperiences: string[];
}

export interface PersonaContext {
  era: string;
  setting: string;
  culturalBackground: string;
}

export interface Persona {
  id: string;
  identity: PersonaIdentity;
  background: PersonaBackground;
  family: PersonaFamily;
  pets: PersonaPet[];
  interests: PersonaInterests;
  dailyLife: PersonaDailyLife;
  preferences: PersonaPreferences;
  health: PersonaHealth;
  personality: PersonaPersonality;
  history: PersonaHistory;
  context: PersonaContext;
  createdAt: string;
}
