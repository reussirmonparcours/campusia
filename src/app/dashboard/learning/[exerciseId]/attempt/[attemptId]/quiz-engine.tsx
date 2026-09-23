"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExerciseWithQuestions } from "@/types/learning";
import { submitAnswer, completeAttempt } from "@/lib/learning/actions";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface QuizEngineProps {
  exercise: ExerciseWithQuestions;
  attemptId: string;
  initialAnswers: Record<string, { choiceId?: string | null; freeTextAnswer?: string | null }>;
}

export default function QuizEngine({ exercise, attemptId, initialAnswers }: QuizEngineProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { choiceId?: string | null; freeTextAnswer?: string | null }>>(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = exercise.learning_questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion.id] || {};

  const handleSelectChoice = async (choiceId: string) => {
    // Optimistic update
    const newAnswer = { choiceId, freeTextAnswer: null };
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: newAnswer }));
    
    // Background submit (save progress)
    await submitAnswer({
      attemptId,
      questionId: currentQuestion.id,
      choiceId,
    });
  };

  const handleTextChange = (text: string) => {
    setAnswers(prev => ({ 
      ...prev, 
      [currentQuestion.id]: { ...prev[currentQuestion.id], freeTextAnswer: text } 
    }));
  };

  const saveTextAnswer = async () => {
    if (currentAnswer.freeTextAnswer) {
      await submitAnswer({
        attemptId,
        questionId: currentQuestion.id,
        freeTextAnswer: currentAnswer.freeTextAnswer,
      });
    }
  };

  const handleNext = async () => {
    if (currentQuestion.question_type === 'free_text') {
      await saveTextAnswer();
    }
    setError(null);
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = async () => {
    if (currentQuestion.question_type === 'free_text') {
      await saveTextAnswer();
    }
    setError(null);
    setCurrentIndex(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await completeAttempt({ attemptId });
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push(`/dashboard/learning/${exercise.id}/result/${attemptId}`);
    }
  };

  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      {/* Header / Progress */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentIndex + 1} sur {questions.length}</span>
          <span>{progress}% complété</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-6 flex justify-between items-start">
          <span className="text-xs px-2 py-1 bg-muted rounded-full uppercase tracking-wider font-semibold">
            {currentQuestion.question_type === 'single_choice' ? 'Choix Unique' : 
             currentQuestion.question_type === 'multiple_choice' ? 'Choix Multiples' : 
             'Réponse Libre'}
          </span>
        </div>
        
        <h2 className="text-xl font-medium mb-8">
          {currentQuestion.content}
        </h2>

        <div className="space-y-3 flex-1">
          {currentQuestion.question_type === 'single_choice' && (
            <div className="grid gap-3">
              {currentQuestion.learning_choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleSelectChoice(choice.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    currentAnswer.choiceId === choice.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      currentAnswer.choiceId === choice.id ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {currentAnswer.choiceId === choice.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span>{choice.content}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'free_text' && (
            <textarea
              className="w-full h-40 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
              placeholder="Saisissez votre réponse ici..."
              value={currentAnswer.freeTextAnswer || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={saveTextAnswer}
            />
          )}
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </button>

        {error && <span className="text-sm text-destructive font-medium">{error}</span>}

        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLastQuestion ? (
            <>Terminer <CheckCircle2 className="h-4 w-4" /></>
          ) : (
            <>Suivant <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
