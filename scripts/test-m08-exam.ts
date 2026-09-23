// test-m08-exam.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const supabaseUserA = createClient(supabaseUrl, supabaseKey);
const supabaseUserB = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=== Starting M08 Security Tests ===");

  // Setup users
  const userAEmail = "exam-test-a@example.com";
  const userBEmail = "exam-test-b@example.com";
  const password = "password123";

  // Create or get users
  let { data: authA } = await supabaseUserA.auth.signInWithPassword({ email: userAEmail, password });
  if (!authA.user) {
    await supabaseAdmin.auth.admin.createUser({ email: userAEmail, password, email_confirm: true });
    const res = await supabaseUserA.auth.signInWithPassword({ email: userAEmail, password });
    authA = res.data;
  }

  let { data: authB } = await supabaseUserB.auth.signInWithPassword({ email: userBEmail, password });
  if (!authB.user) {
    await supabaseAdmin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true });
    const res = await supabaseUserB.auth.signInWithPassword({ email: userBEmail, password });
    authB = res.data;
  }

  const userA = authA.user!;

  console.log("1. Creating Mock Exercise with Admin...");
  const { data: subject } = await supabaseAdmin.from("subjects").insert({ title: "Exam Test Subject" }).select().single();
  const { data: exercise } = await supabaseAdmin.from("learning_exercises").insert({
    title: "Mock Exam",
    subject_id: subject.id,
    exercise_type: "exam",
    difficulty: "medium"
  }).select().single();

  const { data: question } = await supabaseAdmin.from("learning_questions").insert({
    exercise_id: exercise.id,
    question_type: "single_choice",
    content: "What is 2+2?",
    difficulty: "easy",
    order_index: 1
  }).select().single();

  const { data: choiceRight } = await supabaseAdmin.from("learning_choices").insert({
    question_id: question.id,
    content: "4",
  }).select().single();

  const { data: choiceWrong } = await supabaseAdmin.from("learning_choices").insert({
    question_id: question.id,
    content: "5",
  }).select().single();

  // Insert corrections via Admin
  await supabaseAdmin.from("learning_choice_corrections").insert([
    { choice_id: choiceRight.id, is_correct: true },
    { choice_id: choiceWrong.id, is_correct: false }
  ]);

  console.log("2. Testing is_correct vulnerability...");
  const { data: fetchChoices } = await supabaseUserA.from("learning_choices").select("*");
  // verify is_correct is NOT in the response
  if (fetchChoices && fetchChoices.length > 0 && "is_correct" in fetchChoices[0]) {
    console.error("❌ FAILED: is_correct is still exposed to the client.");
  } else {
    console.log("✅ SUCCESS: is_correct is hidden from public learning_choices.");
  }

  const { error: correctionError } = await supabaseUserA.from("learning_choice_corrections").select("*");
  if (!correctionError) {
    console.error("❌ FAILED: Student can read learning_choice_corrections.");
  } else {
    console.log("✅ SUCCESS: learning_choice_corrections RLS works (blocked for student).");
  }

  console.log("3. Creating Exam Session for User A...");
  const { data: session } = await supabaseUserA.from("exam_sessions").insert({
    user_id: userA.id,
    learning_exercise_id: exercise.id,
    duration_minutes: 60,
    status: 'planned'
  }).select().single();

  if (!session) throw new Error("Could not create session");

  console.log("4. Testing User B cannot read User A's session...");
  const { data: bSession } = await supabaseUserB.from("exam_sessions").select("*").eq("id", session.id);
  if (bSession && bSession.length > 0) {
    console.error("❌ FAILED: User B can read User A's session.");
  } else {
    console.log("✅ SUCCESS: User B cannot read User A's session.");
  }

  console.log("=== Tests Completed ===");
}

runTests().catch(console.error);
