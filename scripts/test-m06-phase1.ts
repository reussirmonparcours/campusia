import test from "node:test";
import assert from "node:assert";

// Mocking dependencies is complex here due to createClient.
// Instead, we validate the logic structure of Server Actions using stubbing.
// In a real staging environment, we would run E2E against Supabase API.

// We will test the pure security validation rules conceptually.
import { createRevisionSessionLogic, createRevisionAttemptLogic } from "../src/lib/revision/actions";

test("M06 Phase 1 Security Tests", async (t) => {
  // Mock data setup
  const mockUserA = { id: "user-A" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbState: Record<string, Record<string, any>> = {
    subjects: {
      "subj-official": { created_by: null },
      "subj-private-A": { created_by: "user-A" },
      "subj-private-B": { created_by: "user-B" },
    },
    learning_exercises: {
      "ex-official": { subject_id: "subj-official", created_by: null },
      "ex-private-A": { subject_id: "subj-private-A", created_by: "user-A" },
      "ex-private-B": { subject_id: "subj-private-B", created_by: "user-B" },
      "ex-wrong-subject": { subject_id: "subj-private-B", created_by: "user-A" },
    },
    revision_sessions: {
      "session-A": { user_id: "user-A", subject_id: "subj-official", learning_exercise_id: "ex-official" },
      "session-B": { user_id: "user-B", subject_id: "subj-private-B", learning_exercise_id: "ex-private-B" },
    },
    learning_attempts: {
      "attempt-A": { user_id: "user-A", exercise_id: "ex-official" },
      "attempt-B": { user_id: "user-B", exercise_id: "ex-private-B" },
      "attempt-wrong-ex": { user_id: "user-A", exercise_id: "ex-private-A" },
    }
  };

  const mockSupabaseClient = {
    auth: {
      getUser: async () => ({ data: { user: mockUserA }, error: null })
    },
    from: (table: string) => ({
      select: () => ({
        eq: (key: string, value: string) => ({
          single: async () => {
            const record = dbState[table]?.[value];
            if (record) return { data: record, error: null };
            return { data: null, error: new Error("Not found") };
          }
        })
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      insert: (data: any) => ({
        select: () => ({
          single: async () => ({ data, error: null })
        })
      })
    })
  } as unknown as import("@supabase/supabase-js").SupabaseClient;

  // We mock User for TypeScript 
  const user = mockUserA as unknown as import("@supabase/supabase-js").User;

  await t.test("A. revision_sessions: User A can create session on official subject", async () => {
    const session = await createRevisionSessionLogic(mockSupabaseClient, user, "subj-official", "ex-official");
    assert.strictEqual(session.user_id, "user-A");
  });

  await t.test("A. revision_sessions: User A can create session on their private subject", async () => {
    const session = await createRevisionSessionLogic(mockSupabaseClient, user, "subj-private-A", "ex-private-A");
    assert.strictEqual(session.user_id, "user-A");
  });

  await t.test("A. revision_sessions: User A CANNOT create session on User B's private subject", async () => {
    await assert.rejects(
      () => createRevisionSessionLogic(mockSupabaseClient, user, "subj-private-B", "ex-private-B"),
      /Access denied/
    );
  });

  await t.test("A. revision_sessions: User A CANNOT create session with mismatching exercise/subject", async () => {
    await assert.rejects(
      () => createRevisionSessionLogic(mockSupabaseClient, user, "subj-private-A", "ex-wrong-subject"),
      /Exercise does not belong to the specified subject/
    );
  });

  await t.test("B. revision_attempts: User A can attach their attempt to their session", async () => {
    const attempt = await createRevisionAttemptLogic(mockSupabaseClient, user, "session-A", "attempt-A");
    assert.strictEqual(attempt.revision_session_id, "session-A");
  });

  await t.test("B. revision_attempts: User A CANNOT attach User B's attempt", async () => {
    await assert.rejects(
      () => createRevisionAttemptLogic(mockSupabaseClient, user, "session-A", "attempt-B"),
      /Learning attempt not found or access denied/
    );
  });

  await t.test("B. revision_attempts: User A CANNOT attach their attempt to User B's session", async () => {
    await assert.rejects(
      () => createRevisionAttemptLogic(mockSupabaseClient, user, "session-B", "attempt-A"),
      /Revision session not found or access denied/
    );
  });

  await t.test("B. revision_attempts: User A CANNOT attach attempt from wrong exercise", async () => {
    await assert.rejects(
      () => createRevisionAttemptLogic(mockSupabaseClient, user, "session-A", "attempt-wrong-ex"),
      /Learning attempt exercise does not match revision session exercise/
    );
  });
});
