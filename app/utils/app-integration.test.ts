/**
 * Unit tests for app-integration utilities
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleApiError } from "../utils/app-integration";

describe("app-integration utils", () => {
  describe("handleApiError", () => {
    beforeEach(() => {
      // Clear console mock before each test
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should return a 503 JSON response with error details", async () => {
      const error = new Error("Test error");
      const response = handleApiError(error);

      // Extract the response body
      const body = await response.json();
      
      expect(response.status).toBe(503);
      expect(body).toEqual({
        error: "Service temporarily unavailable",
        message: "Using cached data",
      });
      expect(console.error).toHaveBeenCalledWith("API Error:", error);
    });

    it("should handle non-Error objects", async () => {
      const error = "String error";
      const response = handleApiError(error);

      const body = await response.json();
      
      expect(response.status).toBe(503);
      expect(body.error).toBe("Service temporarily unavailable");
      expect(console.error).toHaveBeenCalledWith("API Error:", error);
    });

    it("should handle null or undefined errors", async () => {
      const response = handleApiError(null);
      const body = await response.json();
      
      expect(response.status).toBe(503);
      expect(body.error).toBe("Service temporarily unavailable");
    });
  });
});
