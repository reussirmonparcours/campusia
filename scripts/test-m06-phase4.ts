import { 
  buildRevisionCoachContext, 
  mapRevisionContextToProviderSources,
  InternalLearningAttemptData
} from "../src/lib/revision/coach-context";
import test from "node:test";
import assert from "node:assert";

test("M06 Phase 4 Trust Boundary and Purification Tests", async (t) => {

  const rawData: InternalLearningAttemptData = {
    status: 'completed',
    score: 0,
    max_score: 1,
    learning_exercise: {
      title: "Test de Mathématiques",
      subject: {
        name: "Mathématiques"
      }
    },
    answers: [
      {
        is_correct: false,
        free_text_answer: null,
        choice: {
          content: "Paris",
          is_correct: false
        },
        question: {
          question_type: 'single_choice',
          content: "Quelle est la capitale de la France ?",
          explanation: null,
          choices: [
            { content: "Paris", is_correct: false }, // User's wrong answer mapping
            { content: "Lyon", is_correct: true }    // The expected answer
          ]
        }
      }
    ]
  };

  const rawFreeTextData: InternalLearningAttemptData = {
    status: 'completed',
    score: null,
    max_score: null,
    learning_exercise: {
      title: "Dissertation",
      subject: {
        name: "Philosophie"
      }
    },
    answers: [
      {
        is_correct: null,
        free_text_answer: "Je pense que...",
        choice: null,
        question: {
          question_type: 'free_text',
          content: "Que pensez-vous de la liberté ?",
          explanation: "La liberté est...",
          choices: []
        }
      }
    ]
  };

  const rawUnansweredData: InternalLearningAttemptData = {
    status: 'completed',
    score: 0,
    max_score: 1,
    learning_exercise: {
      title: "Test",
      subject: {
        name: "Science"
      }
    },
    answers: [
      {
        is_correct: false,
        free_text_answer: null,
        choice: null, // Did not choose anything
        question: {
          question_type: 'single_choice',
          content: "Quelle est la vitesse de la lumière ?",
          explanation: null,
          choices: [
            { content: "300,000 km/s", is_correct: true }
          ]
        }
      }
    ]
  };

  const rawFakeUUIDData: InternalLearningAttemptData = {
    status: 'completed',
    score: 0,
    max_score: 1,
    learning_exercise: {
      title: "Test UUID",
      subject: { name: "IT" }
    },
    answers: [
      {
        is_correct: false,
        free_text_answer: "Voici un UUID: 123e4567-e89b-12d3-a456-426614174000",
        choice: null,
        question: {
          question_type: 'free_text',
          content: "Testez l'UUID",
          explanation: null,
          choices: []
        }
      }
    ]
  };

  await t.test("1. buildRevisionCoachContext maps single_choice with reliable correction", () => {
    const context = buildRevisionCoachContext(rawData);
    
    assert.strictEqual(context.subjectName, "Mathématiques");
    assert.strictEqual(context.exerciseTitle, "Test de Mathématiques");
    assert.strictEqual(context.questionContent, "Quelle est la capitale de la France ?");
    assert.strictEqual(context.studentAnswer, "Paris");
    assert.strictEqual(context.expectedAnswer, "Lyon");
    assert.strictEqual(context.evaluationStatus, "incorrect");
  });

  await t.test("2. buildRevisionCoachContext maps free_text (explanation NOT used as expectedAnswer)", () => {
    const context = buildRevisionCoachContext(rawFreeTextData);
    
    assert.strictEqual(context.studentAnswer, "Je pense que...");
    assert.strictEqual(context.expectedAnswer, null);
    assert.strictEqual(context.evaluationStatus, "incorrect"); // Because it has content, it's not unanswered
  });

  await t.test("3. buildRevisionCoachContext handles unanswered choice questions", () => {
    const context = buildRevisionCoachContext(rawUnansweredData);
    
    assert.strictEqual(context.studentAnswer, "");
    assert.strictEqual(context.expectedAnswer, "300,000 km/s");
    assert.strictEqual(context.evaluationStatus, "unanswered");
  });

  await t.test("4. DTO STRICT: Only exactly authorized keys", () => {
    const context = buildRevisionCoachContext(rawData);
    
    const allowedKeys = [
      "subjectName",
      "exerciseTitle",
      "questionContent",
      "studentAnswer",
      "expectedAnswer",
      "evaluationStatus"
    ];

    const actualKeys = Object.keys(context);
    assert.strictEqual(actualKeys.length, allowedKeys.length);
    assert.ok(actualKeys.every(k => allowedKeys.includes(k)));
  });

  await t.test("5. Trust Boundary: No UUIDs or PII exist in RevisionCoachContext metadata", () => {
    const context = buildRevisionCoachContext(rawFakeUUIDData);
    
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    
    // Test that the DTO keys don't leak anything
    const contextString = JSON.stringify(context);
    assert.ok(!contextString.includes("user_id"));
    assert.ok(!contextString.includes("email"));
    assert.ok(!contextString.includes("session_id"));
    
    // Check values individually for UUID leaks, EXCEPT studentAnswer where the student might have typed one
    Object.keys(context).forEach(key => {
      if (key === "studentAnswer") return; // We allow UUIDs typed by the student
      const val = context[key as keyof typeof context];
      if (typeof val === "string") {
        assert.ok(!uuidRegex.test(val), `UUID leak found in key: ${key}`);
      }
    });

    // Verify studentAnswer STILL contains the student's text
    assert.ok(context.studentAnswer.includes("123e4567-e89b-12d3-a456-426614174000"));
  });

  await t.test("6. M05 Integration: Maps to ProviderSourceDocument correctly (Provenance OFFICIAL/STUDENT)", () => {
    const context = buildRevisionCoachContext(rawData);
    const sources = mapRevisionContextToProviderSources(context);

    assert.strictEqual(sources.length, 3);
    
    // Official Exercise/Question
    assert.strictEqual(sources[0].provenance, "OFFICIAL");
    assert.ok(sources[0].sourceLabel.includes("Exercice"));
    assert.ok(sources[0].content.includes("Quelle est la capitale de la France ?"));

    // Student Answer
    assert.strictEqual(sources[1].provenance, "STUDENT");
    assert.ok(sources[1].sourceLabel.includes("Réponse de l'étudiant"));
    assert.ok(sources[1].content.includes("Paris"));

    // Official Correction
    assert.strictEqual(sources[2].provenance, "OFFICIAL");
    assert.ok(sources[2].sourceLabel.includes("Correction officielle"));
    assert.ok(sources[2].content.includes("Lyon"));
  });

  await t.test("7. M05 Integration: Unanswered DOES NOT map to a SYSTEM document", () => {
    const context = buildRevisionCoachContext(rawUnansweredData);
    const sources = mapRevisionContextToProviderSources(context);

    // Official Question, Official Correction = 2 (NO STUDENT OR SYSTEM SOURCE for answer)
    assert.strictEqual(sources.length, 2);
    
    // There shouldn't be any source containing "student_answer" or SYSTEM provenance for the answer
    const studentSource = sources.find(s => s.provenance === "STUDENT" || s.provenance === "SYSTEM");
    assert.ok(!studentSource);
  });

  await t.test("8. Provenance Rules: 'ACADEMIC' is NEVER used", () => {
    const context = buildRevisionCoachContext(rawData);
    const sources = mapRevisionContextToProviderSources(context);
    
    const provenanceValues = sources.map(s => s.provenance);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.ok(!provenanceValues.includes("ACADEMIC" as any));
  });

  await t.test("9. Prompt Injection isolation: XML wrappers are used merely for structure", () => {
    const context = buildRevisionCoachContext(rawFreeTextData);
    const sources = mapRevisionContextToProviderSources(context);
    
    const studentSource = sources.find(s => s.provenance === "STUDENT")!;
    assert.ok(studentSource.content.startsWith("<student_answer>"));
    assert.ok(studentSource.content.endsWith("</student_answer>"));
  });
});
