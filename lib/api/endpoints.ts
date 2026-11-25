/**
 * Typed client: one function per AbleSprout API endpoint (see the API's /api/docs).
 * Auth endpoints live in ./auth.ts because they go through the same-origin cookie proxy.
 */
import type {
  AdaptWorksheetInput,
  Assessment,
  AssessmentInput,
  DisabilityCategory,
  Domain,
  GenerateWorksheetInput,
  Goal,
  GoalStatus,
  Iep,
  IepStatus,
  IepUpdate,
  Language,
  Message,
  PageParams,
  Paginated,
  ProgressEntry,
  Role,
  SchoolAnalytics,
  Student,
  StudentAnalytics,
  StudentDetail,
  StudentInput,
  User,
  Worksheet,
} from "@/types/api";
import { downloadFile, request } from "./client";

const enc = encodeURIComponent;

export const usersApi = {
  me: () => request<{ user: User }>("/auth/me"),
  list: (params: PageParams & { role?: Role } = {}) => request<Paginated<User>>("/users", { query: { ...params } }),
  invite: (body: { name: string; email: string; role: "EDUCATOR" | "PARENT"; phone?: string; preferredLanguage?: Language; password?: string }) =>
    request<{ user: User; temporaryPassword?: string }>("/users", { method: "POST", body }),
  update: (id: string, body: Partial<{ name: string; phone: string | null; preferredLanguage: Language; role: "EDUCATOR" | "PARENT"; password: string }>) =>
    request<{ user: User }>(`/users/${enc(id)}`, { method: "PATCH", body }),
};

export const studentsApi = {
  list: (params: PageParams & { search?: string; category?: DisabilityCategory; grade?: string } = {}) =>
    request<Paginated<Student>>("/students", { query: { ...params } }),
  get: (id: string) => request<StudentDetail>(`/students/${enc(id)}`),
  create: (body: StudentInput) => request<{ student: Student }>("/students", { method: "POST", body }),
  update: (id: string, body: Partial<Omit<StudentInput, "educatorIds" | "parentIds">>) =>
    request<{ student: Student }>(`/students/${enc(id)}`, { method: "PATCH", body }),
  remove: (id: string) => request<void>(`/students/${enc(id)}`, { method: "DELETE" }),
  addEducators: (id: string, educatorIds: string[]) =>
    request<{ student: Student }>(`/students/${enc(id)}/educators`, { method: "POST", body: { educatorIds } }),
  addParents: (id: string, parentIds: string[]) =>
    request<{ student: Student }>(`/students/${enc(id)}/parents`, { method: "POST", body: { parentIds } }),
};

export const assessmentsApi = {
  list: (studentId: string, params: PageParams & { domain?: Domain } = {}) =>
    request<Paginated<Assessment>>(`/students/${enc(studentId)}/assessments`, { query: { ...params } }),
  create: (studentId: string, body: AssessmentInput) =>
    request<{ assessment: Assessment }>(`/students/${enc(studentId)}/assessments`, { method: "POST", body }),
};

export const iepsApi = {
  generate: (studentId: string, body: { language?: Language; focusDomains?: Domain[]; startDate?: string } = {}) =>
    request<{ iep: Iep }>(`/students/${enc(studentId)}/ieps/generate`, { method: "POST", body }),
  listForStudent: (studentId: string, params: PageParams & { status?: IepStatus } = {}) =>
    request<Paginated<Iep>>(`/students/${enc(studentId)}/ieps`, { query: { ...params } }),
  listAll: (params: PageParams & { status?: IepStatus; dueWithinDays?: number } = {}) =>
    request<Paginated<Iep>>("/ieps", { query: { ...params } }),
  get: (id: string) => request<{ iep: Iep }>(`/ieps/${enc(id)}`),
  update: (id: string, body: IepUpdate) => request<{ iep: Iep }>(`/ieps/${enc(id)}`, { method: "PATCH", body }),
  approve: (id: string) => request<{ iep: Iep }>(`/ieps/${enc(id)}/approve`, { method: "POST" }),
  downloadPdf: (id: string) => downloadFile(`/ieps/${enc(id)}/pdf`, "IEP.pdf"),
};

export const goalsApi = {
  update: (goalId: string, body: Partial<Omit<Goal, "id">> & { status?: GoalStatus }) =>
    request<{ goal: Goal }>(`/goals/${enc(goalId)}`, { method: "PATCH", body }),
  addProgress: (goalId: string, body: { value: number; note?: string; date?: string }) =>
    request<{ progress: ProgressEntry }>(`/goals/${enc(goalId)}/progress`, { method: "POST", body }),
  listProgress: (goalId: string, params: PageParams = {}) =>
    request<Paginated<ProgressEntry>>(`/goals/${enc(goalId)}/progress`, { query: { ...params } }),
  recent: (limit = 10) => request<{ data: ProgressEntry[] }>("/progress/recent", { query: { limit } }),
};

export const worksheetsApi = {
  generate: (studentId: string, body: GenerateWorksheetInput) =>
    request<{ worksheet: Worksheet }>(`/students/${enc(studentId)}/worksheets/generate`, { method: "POST", body }),
  adapt: (body: AdaptWorksheetInput) => request<{ worksheet: Worksheet }>("/worksheets/adapt", { method: "POST", body }),
  listForStudent: (studentId: string, params: PageParams = {}) =>
    request<Paginated<Worksheet>>(`/students/${enc(studentId)}/worksheets`, { query: { ...params } }),
  get: (id: string) => request<{ worksheet: Worksheet }>(`/worksheets/${enc(id)}`),
  update: (id: string, body: Partial<Pick<Worksheet, "title" | "level" | "adaptations" | "content">>) =>
    request<{ worksheet: Worksheet }>(`/worksheets/${enc(id)}`, { method: "PATCH", body }),
  downloadPdf: (id: string) => downloadFile(`/worksheets/${enc(id)}/pdf`, "worksheet.pdf"),
};

export const messagesApi = {
  list: (studentId: string, params: PageParams = {}) =>
    request<Paginated<Message>>(`/students/${enc(studentId)}/messages`, { query: { ...params } }),
  /** Latest `limit` messages in chronological order (the API pages oldest-first). */
  async latest(studentId: string, limit = 50): Promise<Paginated<Message>> {
    const first = await messagesApi.list(studentId, { page: 1, limit });
    if (first.pagination.totalPages <= 1) return first;
    return messagesApi.list(studentId, { page: first.pagination.totalPages, limit });
  },
  send: (studentId: string, body: { body: string; attachmentWorksheetId?: string }) =>
    request<{ message: Message }>(`/students/${enc(studentId)}/messages`, { method: "POST", body }),
  markRead: (id: string) => request<{ message: Message }>(`/messages/${enc(id)}/read`, { method: "POST" }),
};

export const analyticsApi = {
  school: () => request<SchoolAnalytics>("/analytics/school"),
  student: (id: string) => request<StudentAnalytics>(`/analytics/students/${enc(id)}`),
};
