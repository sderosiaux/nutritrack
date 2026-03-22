// @vitest-environment node
/**
 * CHK-059: OpenAPI spec generation
 * Tests: GET /api/v1/openapi.json returns valid OpenAPI 3.0 spec
 * with required paths covered.
 */
import { app } from "@/server/api/index";

// Helper to call the Hono app
async function getJson(path: string) {
  const req = new Request(`http://localhost${path}`);
  const res = await app.request(req);
  return { status: res.status, body: await res.json() };
}

describe("CHK-059: OpenAPI spec endpoint", () => {
  let spec: Record<string, unknown>;

  beforeAll(async () => {
    const { status, body } = await getJson("/api/v1/openapi.json");
    expect(status).toBe(200);
    spec = body as Record<string, unknown>;
  });

  it("returns 200 status", async () => {
    const { status } = await getJson("/api/v1/openapi.json");
    expect(status).toBe(200);
  });

  it("spec has openapi field set to 3.0.x", () => {
    expect(spec.openapi).toMatch(/^3\.0\./);
  });

  it("spec has info object with title and version", () => {
    const info = spec.info as Record<string, unknown>;
    expect(info).toBeDefined();
    expect(info.title).toBeTruthy();
    expect(info.version).toBeTruthy();
  });

  it("spec has paths object", () => {
    expect(spec.paths).toBeDefined();
    expect(typeof spec.paths).toBe("object");
  });

  describe("Required paths", () => {
    let paths: Record<string, unknown>;

    beforeAll(() => {
      paths = spec.paths as Record<string, unknown>;
    });

    it("documents /auth/* endpoints", () => {
      const authPaths = Object.keys(paths).filter((p) => p.includes("/auth"));
      expect(authPaths.length).toBeGreaterThan(0);
    });

    it("documents /foods/* endpoints", () => {
      const foodPaths = Object.keys(paths).filter((p) =>
        p.includes("/foods")
      );
      expect(foodPaths.length).toBeGreaterThan(0);
    });

    it("documents /logs/* endpoints", () => {
      const logPaths = Object.keys(paths).filter((p) => p.includes("/logs"));
      expect(logPaths.length).toBeGreaterThan(0);
    });

    it("documents /analytics/* endpoints", () => {
      const analyticsPaths = Object.keys(paths).filter((p) =>
        p.includes("/analytics")
      );
      expect(analyticsPaths.length).toBeGreaterThan(0);
    });

    it("documents /profile endpoint", () => {
      const profilePaths = Object.keys(paths).filter((p) =>
        p.includes("/profile")
      );
      expect(profilePaths.length).toBeGreaterThan(0);
    });

    it("has at least 10 paths documented", () => {
      expect(Object.keys(paths).length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Security scheme", () => {
    it("has components.securitySchemes with Bearer auth", () => {
      const components = spec.components as Record<string, unknown> | undefined;
      expect(components).toBeDefined();
      const schemes = (components as Record<string, unknown>)
        .securitySchemes as Record<string, unknown> | undefined;
      expect(schemes).toBeDefined();
      // Should have a bearer token scheme
      const hasBearerScheme = Object.values(schemes!).some(
        (s) =>
          (s as Record<string, unknown>).type === "http" &&
          (s as Record<string, unknown>).scheme === "bearer"
      );
      expect(hasBearerScheme).toBe(true);
    });
  });

  describe("Path structure", () => {
    it("each path entry has at least one HTTP method", () => {
      const paths = spec.paths as Record<string, Record<string, unknown>>;
      const httpMethods = ["get", "post", "put", "patch", "delete"];
      for (const [path, methods] of Object.entries(paths)) {
        const hasMethod = Object.keys(methods).some((k) =>
          httpMethods.includes(k.toLowerCase())
        );
        expect(hasMethod, `Path ${path} has no HTTP method`).toBe(true);
      }
    });

    it("path operations have summary or description", () => {
      const paths = spec.paths as Record<
        string,
        Record<string, Record<string, unknown>>
      >;
      const httpMethods = ["get", "post", "put", "patch", "delete"];
      let checkedCount = 0;
      for (const methods of Object.values(paths)) {
        for (const [method, op] of Object.entries(methods)) {
          if (httpMethods.includes(method.toLowerCase())) {
            const hasSummary = op.summary || op.description;
            expect(
              hasSummary,
              `Operation ${method} has no summary/description`
            ).toBeTruthy();
            checkedCount++;
            if (checkedCount >= 5) break; // sample first 5
          }
        }
        if (checkedCount >= 5) break;
      }
    });
  });
});
