export * from "./academic";
export * from "./ai";

/**
 * Common application response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
