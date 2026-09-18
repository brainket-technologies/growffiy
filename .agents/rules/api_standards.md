---
name: API Standard Guidelines
description: Rules for creating any new API endpoints for the Growffi web/mobile app.
---

# API Standard Guidelines

Whenever you are instructed to create a new API endpoint in this project, you MUST strictly follow these rules:

## 1. Authentication (Bearer Token)
All protected APIs, especially for the mobile app, MUST implement Bearer Token Validation checking the `Authorization` header.

```typescript
// Example snippet to include in every protected route:
const authHeader = request.headers.get('authorization');

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Missing or invalid token format' },
    { status: 401 }
  );
}

const token = authHeader.split(' ')[1];
// Add actual token verification logic (e.g., jwt.verify, or DB lookup)
```

## 2. Standardized Response Structure
You MUST return responses in the following JSON structure to ensure consistency across the mobile app.

### Success Response:
```json
{
  "success": true,
  "message": "A human-readable success message",
  "data": {
    // Response payload goes here
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": "A human-readable error description",
  "code": "OPTIONAL_ERROR_CODE"
}
```

## 3. Postman Collection Documentation
After creating or modifying an API endpoint, you MUST add or update the endpoint details in the Postman collection located at `docs/Growffi_Mobile_API.postman_collection.json`.

Ensure the JSON object you add includes:
- Request URL, Method (GET/POST/etc.)
- Required Headers (including `Authorization: Bearer <token>`)
- Sample Body (if POST/PUT/PATCH)
- Sample Responses (Success and Error)
