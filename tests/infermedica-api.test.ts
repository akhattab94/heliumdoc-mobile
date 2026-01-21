import { describe, it, expect } from "vitest";

describe("Infermedica API Credentials", () => {
  const APP_ID = process.env.INFERMEDICA_APP_ID;
  const APP_KEY = process.env.INFERMEDICA_APP_KEY;

  it("should have INFERMEDICA_APP_ID configured", () => {
    expect(APP_ID).toBeDefined();
    expect(APP_ID).not.toBe("");
  });

  it("should have INFERMEDICA_APP_KEY configured", () => {
    expect(APP_KEY).toBeDefined();
    expect(APP_KEY).not.toBe("");
  });

  it("should successfully authenticate with Infermedica API", async () => {
    const response = await fetch("https://api.infermedica.com/v3/info", {
      method: "GET",
      headers: {
        "App-Id": APP_ID!,
        "App-Key": APP_KEY!,
        "Content-Type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("updated_at");
    expect(data).toHaveProperty("conditions_count");
    expect(data).toHaveProperty("symptoms_count");
  });

  it("should fetch symptoms list from Infermedica API", async () => {
    const response = await fetch("https://api.infermedica.com/v3/symptoms?age.value=30", {
      method: "GET",
      headers: {
        "App-Id": APP_ID!,
        "App-Key": APP_KEY!,
        "Content-Type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
  });
});
