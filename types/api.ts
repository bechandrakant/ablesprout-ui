// Shared types mirroring the AbleSprout REST API (/api/v1). Ids are strings; dates are ISO strings.

export type Role = "ADMIN" | "EDUCATOR" | "PARENT";
export type Language = "en" | "hi";

export const DOMAINS = ["READING", "WRITING", "MATH", "COMMUNICATION", "SOCIAL", "MOTOR", "BEHAVIOUR", "DAILY_LIVING"] as const;
export type Domain = (typeof DOMAINS)[number];

export const ASSESSMENT_TYPES = ["SCREENING", "OBSERVATION", "SKILL"] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const DISABILITY_CATEGORIES = [
  "SPECIFIC_LEARNING_DISABILITIES",
  "ADHD",
  "AUTISM_SPECTRUM_DISORDER",
  "INTELLECTUAL_DISABILITY",
  "LOW_VISION",
  "BLINDNESS",
  "HEARING_IMPAIRMENT",
  "SPEECH_AND_LANGUAGE_DISABILITY",
  "LOCOMOTOR_DISABILITY",
  "CEREBRAL_PALSY",
  "MULTIPLE_DISABILITIES",
  "MENTAL_ILLNESS",
  "CHRONIC_NEUROLOGICAL_CONDITIONS",
  "MUSCULAR_DYSTROPHY",
  "DWARFISM",
  "LEPROSY_CURED",
  "MULTIPLE_SCLEROSIS",
  "THALASSEMIA",
  "HAEMOPHILIA",
  "SICKLE_CELL_DISEASE",
  "ACID_ATTACK_VICTIM",
  "PARKINSONS_DISEASE",
] as const;
export type DisabilityCategory = (typeof DISABILITY_CATEGORIES)[number];

export const IEP_STATUSES = ["DRAFT", "APPROVED", "ARCHIVED"] as const;
export type IepStatus = (typeof IEP_STATUSES)[number];
export const GOAL_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "ACHIEVED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const ADAPTATIONS = [
  "dyslexia_font",
  "large_print",
  "chunked_steps",
  "visual_supports",
  "simplified_language",
  "extra_spacing",
  "high_contrast",
] as const;
export type Adaptation = (typeof ADAPTATIONS)[number];
export type AnswerType = "short_text" | "long_text" | "multiple_choice" | "true_false" | "number" | "draw" | "match";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}
export interface PageParams {
  page?: number;
  limit?: number;
}

export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  board?: string;
}

export interface User {
  id: string;
  schoolId: string | School;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  preferredLanguage: Language;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  dateOfBirth?: string;
  grade: string;
  section?: string;
  disabilityCategories: DisabilityCategory[];
  notes?: string;
  educatorIds: string[];
  parentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  email?: string;
  preferredLanguage?: Language;
}
export interface StudentDetail {
  student: Student;
  team: { educators: TeamMember[]; parents: TeamMember[] };
}

export interface StudentInput {
  name: string;
  grade: string;
  section?: string;
  dateOfBirth?: string;
  disabilityCategories: DisabilityCategory[];
  notes?: string;
  educatorIds?: string[];
  parentIds?: string[];
}

export interface Assessment {
  id: string;
  studentId: string;
  educatorId: string;
  type: AssessmentType;
  domain: Domain;
  scores: Record<string, number>;
  observations?: string;
  date: string;
  createdAt: string;
}
export interface AssessmentInput {
  type: AssessmentType;
  domain: Domain;
  scores: Record<string, number>;
  observations?: string;
  date?: string;
}

export interface Goal {
  id: string;
  domain: Domain;
  goalText: string;
  baseline?: string;
  target?: string;
  measurement?: string;
  accommodations: string[];
  interventions: string[];
  status: GoalStatus;
}
export type GoalInput = Omit<Goal, "id" | "status"> & { id?: string; status?: GoalStatus };

export interface Iep {
  id: string;
  schoolId: string;
  /** A string id, or `{ id, name, grade }` when the list endpoint populates it. */
  studentId: string | { id: string; name: string; grade?: string; section?: string };
  createdById: string;
  status: IepStatus;
  language: Language;
  presentLevels?: string;
  startDate: string;
  reviewDate: string;
  aiGenerated: boolean;
  approvedAt?: string;
  approvedById?: string;
  goals: Goal[];
  createdAt: string;
  updatedAt: string;
}
export interface IepUpdate {
  presentLevels?: string;
  startDate?: string;
  reviewDate?: string;
  language?: Language;
  goals?: GoalInput[];
}

export interface ProgressEntry {
  id: string;
  studentId: string | { id: string; name: string };
  iepId: string;
  goalId: string;
  educatorId: string;
  value: number;
  note?: string;
  date: string;
  goal?: { goalText: string; domain: Domain } | null;
}

export interface WorksheetQuestion {
  text: string;
  answerType: AnswerType;
  options?: string[];
}
export interface WorksheetSection {
  heading?: string;
  instructions?: string;
  questions: WorksheetQuestion[];
}
export interface Worksheet {
  id: string;
  studentId: string | null;
  goalId: string | null;
  createdById: string;
  title: string;
  subject?: string;
  level?: string;
  language: Language;
  adaptations: Adaptation[];
  content: { sections: WorksheetSection[] };
  sourceText?: string;
  aiGenerated: boolean;
  createdAt: string;
}
export interface GenerateWorksheetInput {
  subject: string;
  topic: string;
  goalId?: string;
  adaptations: Adaptation[];
  language: Language;
}
export interface AdaptWorksheetInput {
  sourceText: string;
  adaptations: Adaptation[];
  language: Language;
  studentId?: string;
  subject?: string;
}

export interface Message {
  id: string;
  studentId: string;
  senderId: { id: string; name: string; role: Role } | string;
  body: string;
  attachmentWorksheetId: string | null;
  readBy: { userId: string; readAt: string }[];
  createdAt: string;
  /** Client-only flag for optimistic messages. */
  pending?: boolean;
}

export interface SchoolAnalytics {
  generatedAt: string;
  totalStudents: number;
  studentsByDisabilityCategory: { category: DisabilityCategory; count: number }[];
  approvedIep: { students: number; percentage: number };
  iepsDueForReview: { within30Days: number; items: { iepId: string; studentId: string; studentName: string; reviewDate: string }[] };
  goalStatusBreakdown: { status: GoalStatus; count: number }[];
  averageProgressByDomain: { domain: Domain; averageProgress: number; goals: number }[];
  educatorActivityLast30Days: {
    educatorId: string;
    name: string;
    role: Role;
    progressEntries: number;
    assessments: number;
    ieps: number;
    worksheets: number;
    total: number;
  }[];
}

export interface StudentAnalytics {
  studentId: string;
  goals: {
    goalId: string;
    iepId: string;
    iepStatus?: IepStatus;
    domain?: Domain;
    goalText?: string;
    goalStatus?: GoalStatus;
    entries: number;
    firstValue: number;
    latestValue: number;
    change: number;
    points: { date: string; value: number; note?: string }[];
  }[];
  assessmentTrend: { domain: Domain; points: { date: string; averageScore: number }[] }[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { path: string; message: string }[] };
}
