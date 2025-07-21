import type { User } from "@shared/schema";

// Assessment levels
export type AssessmentLevel = 'PROJECT_MANAGER' | 'DELIVERY_MANAGER' | 'ORG_HEAD';

// User data with assessment levels
export interface UserWithAssessment {
  id: number;
  username: string;
  email: string;
  role: string;
  name: string;
  assessmentLevel: AssessmentLevel;
}

// Available users with their assessment levels
export const AVAILABLE_USERS: UserWithAssessment[] = [
  {
    id: 1,
    username: "ani",
    email: "ani@company.com",
    role: "delivery_manager",
    name: "Ani",
    assessmentLevel: "DELIVERY_MANAGER"
  },
  {
    id: 2,
    username: "raja",
    email: "raja@company.com",
    role: "delivery_manager",
    name: "Raja",
    assessmentLevel: "DELIVERY_MANAGER"
  },
  {
    id: 3,
    username: "deepa",
    email: "deepa@company.com",
    role: "org_head",
    name: "Deepa",
    assessmentLevel: "ORG_HEAD"
  },
  {
    id: 4,
    username: "vijo_jacob",
    email: "vijo.jacob@company.com",
    role: "project_manager",
    name: "Vijo Jacob",
    assessmentLevel: "PROJECT_MANAGER"
  },
  {
    id: 5,
    username: "ashwathy_nair",
    email: "ashwathy.nair@company.com",
    role: "project_manager",
    name: "Ashwathy Nair",
    assessmentLevel: "PROJECT_MANAGER"
  },
  {
    id: 6,
    username: "srinivasan_kr",
    email: "srinivasan.kr@company.com",
    role: "project_manager",
    name: "Srinivasan K R",
    assessmentLevel: "PROJECT_MANAGER"
  }
];

// Default current user (first user in list)
const DEFAULT_USER = AVAILABLE_USERS[0];

export function useAuth() {
  return {
    user: DEFAULT_USER,
    isLoading: false,
    isAuthenticated: true,
    error: null
  };
}
