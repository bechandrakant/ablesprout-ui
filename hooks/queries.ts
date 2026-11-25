"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  analyticsApi,
  assessmentsApi,
  goalsApi,
  iepsApi,
  messagesApi,
  studentsApi,
  usersApi,
  worksheetsApi,
} from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { DisabilityCategory, IepStatus, Role } from "@/types/api";

export type StudentFilters = { search?: string; category?: DisabilityCategory; grade?: string; page?: number; limit?: number };

export const useStudents = (params: StudentFilters = {}) =>
  useQuery({ queryKey: qk.students(params), queryFn: () => studentsApi.list(params), placeholderData: keepPreviousData });

export const useStudent = (id: string) => useQuery({ queryKey: qk.student(id), queryFn: () => studentsApi.get(id), enabled: !!id });

export const useUsers = (role?: Role, enabled = true) =>
  useQuery({ queryKey: qk.users(role), queryFn: () => usersApi.list({ role, limit: 100 }), enabled });

export const useAssessments = (studentId: string) =>
  useQuery({ queryKey: qk.assessments(studentId), queryFn: () => assessmentsApi.list(studentId, { limit: 50 }) });

export const useStudentIeps = (studentId: string) =>
  useQuery({ queryKey: qk.ieps(studentId), queryFn: () => iepsApi.listForStudent(studentId, { limit: 20 }) });

export const useCaseloadIeps = (params: { status?: IepStatus; dueWithinDays?: number; limit?: number }) =>
  useQuery({ queryKey: qk.caseloadIeps(params), queryFn: () => iepsApi.listAll(params) });

export const useGoalProgress = (goalId: string, enabled = true) =>
  useQuery({ queryKey: qk.goalProgress(goalId), queryFn: () => goalsApi.listProgress(goalId, { limit: 100 }), enabled });

export const useRecentProgress = () => useQuery({ queryKey: qk.recentProgress, queryFn: () => goalsApi.recent(8) });

export const useWorksheets = (studentId: string) =>
  useQuery({ queryKey: qk.worksheets(studentId), queryFn: () => worksheetsApi.listForStudent(studentId, { limit: 50 }) });

export const useWorksheet = (id: string) => useQuery({ queryKey: qk.worksheet(id), queryFn: () => worksheetsApi.get(id) });

export const useMessages = (studentId: string, opts: { poll?: boolean } = {}) =>
  useQuery({
    queryKey: qk.messages(studentId),
    queryFn: () => messagesApi.latest(studentId, 50),
    // Light polling while the chat is open; paused when the tab is hidden.
    refetchInterval: opts.poll ? 20_000 : false,
    refetchIntervalInBackground: false,
  });

export const useSchoolAnalytics = () => useQuery({ queryKey: qk.schoolAnalytics, queryFn: analyticsApi.school });
export const useStudentAnalytics = (id: string) =>
  useQuery({ queryKey: qk.studentAnalytics(id), queryFn: () => analyticsApi.student(id) });
