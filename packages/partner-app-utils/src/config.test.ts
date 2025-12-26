/**
 * Unit tests for config utilities
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAppConfig, validateConfig } from "../config";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("getAppConfig", () => {
    it("should return development URLs when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      
      const config = getAppConfig();
      
      expect(config.adminApp.baseUrl).toBe("http://localhost:3001");
      expect(config.adminApp.port).toBe(3001);
      expect(config.marketApp.baseUrl).toBe("http://localhost:3002");
      expect(config.marketApp.port).toBe(3002);
      expect(config.buyerApp.baseUrl).toBe("http://localhost:3003");
      expect(config.buyerApp.port).toBe(3003);
    });

    it("should return environment URLs when NODE_ENV is not development", () => {
      process.env.NODE_ENV = "production";
      process.env.ADMIN_APP_URL = "https://admin.example.com";
      process.env.MARKET_APP_URL = "https://market.example.com";
      process.env.BUYER_APP_URL = "https://buyer.example.com";
      
      const config = getAppConfig();
      
      expect(config.adminApp.baseUrl).toBe("https://admin.example.com");
      expect(config.marketApp.baseUrl).toBe("https://market.example.com");
      expect(config.buyerApp.baseUrl).toBe("https://buyer.example.com");
    });

    it("should return empty strings for missing production URLs", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_APP_URL;
      delete process.env.MARKET_APP_URL;
      delete process.env.BUYER_APP_URL;
      
      const config = getAppConfig();
      
      expect(config.adminApp.baseUrl).toBe("");
      expect(config.marketApp.baseUrl).toBe("");
      expect(config.buyerApp.baseUrl).toBe("");
    });
  });

  describe("validateConfig", () => {
    it("should pass validation in development mode", () => {
      process.env.NODE_ENV = "development";
      
      const result = validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass validation when all production URLs are set", () => {
      process.env.NODE_ENV = "production";
      process.env.ADMIN_APP_URL = "https://admin.example.com";
      process.env.MARKET_APP_URL = "https://market.example.com";
      process.env.BUYER_APP_URL = "https://buyer.example.com";
      
      const result = validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail validation when ADMIN_APP_URL is missing in production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_APP_URL;
      process.env.MARKET_APP_URL = "https://market.example.com";
      process.env.BUYER_APP_URL = "https://buyer.example.com";
      
      const result = validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("ADMIN_APP_URL is required in production");
    });

    it("should fail validation when all URLs are missing in production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_APP_URL;
      delete process.env.MARKET_APP_URL;
      delete process.env.BUYER_APP_URL;
      
      const result = validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain("ADMIN_APP_URL is required in production");
      expect(result.errors).toContain("MARKET_APP_URL is required in production");
      expect(result.errors).toContain("BUYER_APP_URL is required in production");
    });
  });
});
