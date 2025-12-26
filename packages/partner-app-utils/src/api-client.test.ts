/**
 * Unit tests for API client utilities
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeAppRequest, postAppRequest, putAppRequest, deleteAppRequest, checkHealth } from "../api-client";

// Mock fetch globally
global.fetch = vi.fn();

describe("api-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("makeAppRequest", () => {
    it("should make a successful GET request", async () => {
      const mockData = { id: 1, name: "Test" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await makeAppRequest("http://localhost:3001/api/test");

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const mockData = { id: 1, name: "Test" };
      
      // First call fails, second succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const result = await makeAppRequest("http://localhost:3001/api/test", {
        retries: 2,
        retryDelay: 10,
      });

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should return null after all retries fail", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const result = await makeAppRequest("http://localhost:3001/api/test", {
        retries: 1,
        retryDelay: 10,
      });

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it("should handle non-ok HTTP responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await makeAppRequest("http://localhost:3001/api/test", {
        retries: 0,
      });

      expect(result).toBeNull();
    });

    it("should include custom headers", async () => {
      const mockData = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await makeAppRequest("http://localhost:3001/api/test", {
        headers: {
          "X-Custom-Header": "test-value",
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Custom-Header": "test-value",
          }),
        })
      );
    });
  });

  describe("postAppRequest", () => {
    it("should make a POST request with data", async () => {
      const mockData = { id: 1 };
      const postData = { name: "New Item" };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await postAppRequest("http://localhost:3001/api/test", postData);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(postData),
        })
      );
    });
  });

  describe("putAppRequest", () => {
    it("should make a PUT request with data", async () => {
      const mockData = { id: 1, updated: true };
      const putData = { name: "Updated Item" };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await putAppRequest("http://localhost:3001/api/test/1", putData);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/test/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(putData),
        })
      );
    });
  });

  describe("deleteAppRequest", () => {
    it("should make a DELETE request", async () => {
      const mockData = { deleted: true };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await deleteAppRequest("http://localhost:3001/api/test/1");

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/test/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("checkHealth", () => {
    it("should return true when health check succeeds", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "healthy" }),
      });

      const result = await checkHealth("http://localhost:3001");

      expect(result).toBe(true);
    });

    it("should return false when health check fails", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Connection refused"));

      const result = await checkHealth("http://localhost:3001");

      expect(result).toBe(false);
    });

    it("should return false when health endpoint returns null", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await checkHealth("http://localhost:3001");

      expect(result).toBe(false);
    });
  });
});
