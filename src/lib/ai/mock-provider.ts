import { AIProvider, AIRequest, AIResponse } from "@/types/ai";

/**
 * Mock AI Provider for Phase M05.
 * Returns deterministic responses based on the selected mode without hitting any external API.
 */
export class MockAIProvider implements AIProvider {
  async generate(request: AIRequest): Promise<AIResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return this.createMockResponse(request);
  }

  async *stream(request: AIRequest): AsyncIterable<Partial<AIResponse>> {
    const fullResponse = this.createMockResponse(request);
    
    // Stream metadata first
    yield {
      mode: fullResponse.mode,
      generatedBy: fullResponse.generatedBy,
      sourceProvenance: fullResponse.sourceProvenance,
      suggestedActions: fullResponse.suggestedActions,
      warnings: fullResponse.warnings,
      message: "",
    };

    // Simulate word-by-word streaming
    const words = fullResponse.message.split(" ");
    let currentMessage = "";

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      currentMessage += (i === 0 ? "" : " ") + words[i];
      yield { message: currentMessage };
    }
  }

  private createMockResponse(request: AIRequest): AIResponse {
    let message = "";
    
    switch (request.mode) {
      case "explain":
        message = `Ceci est une explication mockée pour la question : "${request.userMessage}". `;
        if (request.academicContext?.subjectName) {
          message += `Basée sur votre matière ${request.academicContext.subjectName}. `;
        }
        break;
      case "summarize":
        message = `Voici un résumé mocké des notions abordées, en réponse à : "${request.userMessage}".`;
        break;
      case "quiz":
        message = `Prêt pour un mini-quiz ? Question mockée : Qu'est-ce qui correspond à "${request.userMessage}" ?`;
        break;
      case "coach":
        message = `Je vois que vous avez posé la question : "${request.userMessage}". Travaillons ensemble pour comprendre ce point !`;
        if (request.learningContext?.recentErrors && request.learningContext.recentErrors.length > 0) {
          message += ` J'ai remarqué que vous avez eu des difficultés récemment. Pas d'inquiétude, c'est normal !`;
        }
        break;
    }

    return {
      message,
      mode: request.mode,
      generatedBy: "AI",
      sourceProvenance: [], // Mock doesn't actually parse documents, so no provenance right now
      suggestedActions: [
        {
          label: "Compris",
          actionType: "OTHER",
        }
      ]
    };
  }
}
