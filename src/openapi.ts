const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Grandma's Card Box API",
    version: "1.0.0",
    description: "API for discovering, creating, and favoriting recipes.",
  },
  // Overridden per-request in app.ts with the host the request actually
  // arrived on, so "Try it out" works wherever this is deployed.
  servers: [{ url: "http://localhost:4000" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Recipes" },
    { name: "Favorites" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RecipeInput: {
        type: "object",
        required: ["title", "ingredients", "instructions", "servings"],
        properties: {
          title: { type: "string", example: "Fluffy Pancakes" },
          ingredients: {
            type: "array",
            maxItems: 10,
            items: { type: "string" },
          },
          instructions: {
            type: "array",
            maxItems: 10,
            items: { type: "string" },
            example: ["Whisk the ingredients.", "Cook until golden."],
          },
          prepTimeMin: { type: "integer", minimum: 0, example: 10 },
          cookTimeMin: { type: "integer", minimum: 0, example: 15 },
          totalTimeMin: { type: "integer", minimum: 0, example: 25, readOnly: true },
          tag: { type: "string", example: "Dinner" },
          imageUrl: { type: "string", format: "uri", example: "https://example.com/pancakes.jpg" },
          warningNote: { type: "string" },
          servings: { type: "integer", minimum: 1 },
          difficulty: { type: "string", enum: ["trivial", "medium", "high"] },
        },
      },
      Recipe: {
        allOf: [
          { $ref: "#/components/schemas/RecipeInput" },
          {
            type: "object",
            properties: {
              id: { type: "string", example: "665f1a2b3c4d5e6f78901234" },
              createdAt: { type: "string", format: "date-time" },
              isUserUpload: { type: "boolean" },
              inMyBox: { type: "boolean" },
            },
          },
        ],
      },
      Error: {
        type: "object",
        properties: { error: { type: "string", example: "Recipe not found" } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: { "200": { description: "API is healthy" } },
      },
    },
    "/admin/seed": {
      post: {
        tags: ["Recipes"],
        summary: "Seed the built-in recipe collection",
        parameters: [
          {
            name: "x-seed-secret",
            in: "header",
            required: true,
            schema: { type: "string", format: "password" },
            description: "The SEED_SECRET configured on the API server.",
          },
        ],
        responses: {
          "200": { description: "Seed recipes inserted or updated" },
          "401": { description: "Invalid seed secret" },
          "503": { description: "Seed endpoint is not configured" },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "displayName"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  displayName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Account created" },
          "400": { description: "Invalid request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { "200": { description: "Reset request accepted" } },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Set a new password using a reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", format: "password", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password updated" },
          "400": { description: "Invalid or expired reset token" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Confirm an email address using a verification token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: { token: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Email verified" },
          "400": { description: "Invalid or expired verification token" },
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend the email verification link to the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Verification email sent" },
          "400": { description: "Email is already verified" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user" },
          "401": { description: "Authentication required" },
        },
      },
      delete: {
        tags: ["Auth"],
        summary: "Delete the current account and owned data",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Account deleted" },
          "401": { description: "Authentication required" },
        },
      },
      patch: {
        tags: ["Auth"],
        summary: "Update the current user's display name or password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string", minLength: 2, maxLength: 50 },
                  currentPassword: { type: "string", format: "password" },
                  newPassword: { type: "string", format: "password", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Account updated" },
          "400": { description: "Invalid account update" },
          "401": { description: "Authentication required or current password incorrect" },
        },
      },
    },
    "/recipes": {
      get: {
        tags: ["Recipes"],
        summary: "List recipes",
        parameters: [
          { name: "name", in: "query", schema: { type: "string" } },
          { name: "maxIngredients", in: "query", schema: { type: "integer", minimum: 0 } },
          { name: "maxTime", in: "query", schema: { type: "integer", minimum: 0 } },
        ],
        responses: { "200": { description: "Recipe list" } },
      },
      post: {
        tags: ["Recipes"],
        summary: "Create a recipe",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RecipeInput" } } },
        },
        responses: {
          "201": { description: "Recipe created" },
          "400": { description: "Invalid recipe" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/recipes/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: {
        tags: ["Recipes"],
        summary: "Get a recipe",
        responses: { "200": { description: "Recipe details" }, "404": { description: "Recipe not found" } },
      },
      put: {
        tags: ["Recipes"],
        summary: "Update your recipe",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RecipeInput" } } },
        },
        responses: { "200": { description: "Recipe updated" }, "401": { description: "Authentication required" }, "403": { description: "Not the recipe owner" } },
      },
      delete: {
        tags: ["Recipes"],
        summary: "Delete your recipe",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Recipe deleted" }, "401": { description: "Authentication required" }, "403": { description: "Not the recipe owner" } },
      },
    },
    "/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "List your favorite recipes",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Favorite recipes" }, "401": { description: "Authentication required" } },
      },
    },
    "/favorites/{recipeId}": {
      parameters: [{ name: "recipeId", in: "path", required: true, schema: { type: "string" } }],
      post: {
        tags: ["Favorites"],
        summary: "Favorite a recipe",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Recipe favorited" }, "401": { description: "Authentication required" }, "409": { description: "Already favorited" } },
      },
      delete: {
        tags: ["Favorites"],
        summary: "Remove a favorite",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Favorite removed" }, "401": { description: "Authentication required" }, "404": { description: "Favorite not found" } },
      },
    },
  },
};

export default openapiDocument;
