import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { LearnerMemory, LearnerMemoryCategory, LearnerMemorySourceType } from "@/types/ai";

export class MemoryRepository {
  /**
   * Retrieves all active memories for a given user.
   * This is used to build the AI context and for deduplication during extraction.
   */
  static async getActiveLearnerMemories(userId: string): Promise<LearnerMemory[]> {
    if (!userId) throw new Error("userId is required");
    
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from("learner_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(50); // Reasonable limit to avoid massive context size

    if (error) {
      console.error("[MemoryRepository] Error fetching active memories:", error);
      throw new Error("Failed to fetch learner memories");
    }

    return (data || []) as LearnerMemory[];
  }

  /**
   * Creates a new learner memory.
   */
  static async createMemory(
    userId: string,
    params: {
      category: LearnerMemoryCategory;
      content: string;
      source_type: LearnerMemorySourceType;
      source_id?: string;
    }
  ): Promise<LearnerMemory> {
    if (!userId) throw new Error("userId is required");

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("learner_memory")
      .insert({
        user_id: userId,
        category: params.category,
        content: params.content,
        source_type: params.source_type,
        source_id: params.source_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[MemoryRepository] Error creating memory:", error);
      throw new Error("Failed to create learner memory");
    }

    return data as LearnerMemory;
  }

  /**
   * Updates an existing memory.
   * To prevent abuse or errors, we verify it belongs to the user first.
   */
  static async updateMemory(
    userId: string,
    memoryId: string,
    params: { content: string }
  ): Promise<LearnerMemory> {
    if (!userId || !memoryId) throw new Error("userId and memoryId are required");

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("learner_memory")
      .update({ content: params.content })
      .eq("id", memoryId)
      .eq("user_id", userId) // Extra safety check (Ownership)
      .eq("is_active", true) // Safety check (Active only)
      .select()
      .single();

    if (error) {
      console.error("[MemoryRepository] Error updating memory:", error);
      throw new Error("Failed to update learner memory or memory not active/owned");
    }

    return data as LearnerMemory;
  }

  /**
   * Deactivates a memory (soft delete).
   */
  static async deactivateMemory(userId: string, memoryId: string): Promise<void> {
    if (!userId || !memoryId) throw new Error("userId and memoryId are required");

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("learner_memory")
      .update({ is_active: false })
      .eq("id", memoryId)
      .eq("user_id", userId);

    if (error) {
      console.error("[MemoryRepository] Error deactivating memory:", error);
      throw new Error("Failed to deactivate learner memory");
    }
  }

  /**
   * Hard deletes a memory.
   */
  static async deleteMemory(userId: string, memoryId: string): Promise<void> {
    if (!userId || !memoryId) throw new Error("userId and memoryId are required");

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("learner_memory")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", userId);

    if (error) {
      console.error("[MemoryRepository] Error deleting memory:", error);
      throw new Error("Failed to delete learner memory");
    }
  }
}
