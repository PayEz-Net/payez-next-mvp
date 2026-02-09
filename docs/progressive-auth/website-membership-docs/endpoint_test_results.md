# IDP Endpoint Testing Results - User Activation

## Task: Test `/api/Admin/users/{id}` PUT endpoint for toggling user active status

## Findings from Swagger API Documentation

### Available Admin User Management Endpoints:

1. **Resume/Activate User**: 
   - `POST /api/Admin/users/{userId}/resume`
   - Summary: "Resume a paused/blacklisted user"
   - No request body required
   - Parameters: userId (integer, int32, path, required)

2. **Pause/Deactivate User**:
   - `POST /api/Admin/users/{userId}/pause`
   - Summary: "Pause (blacklist) a user (temporarily disable access)"
   - Request Body: PauseUserModel schema
   - Parameters: userId (integer, int32, path, required)

3. **Unlock User**:
   - `POST /api/Admin/users/{userId}/unlock`
   - Summary: "Unlock a user (clear lockout/enable login)"
   - No request body required
   - Parameters: userId (integer, int32, path, required)

## Key Observations:

1. **No PUT endpoint found**: The `/api/Admin/users/{userId}` endpoint only has a GET method, not PUT
2. **Status management uses POST endpoints**: User activation/deactivation uses specific POST endpoints
3. **Authentication required**: All endpoints require valid Bearer token authentication
4. **Rate limiting implemented**: API has rate limiting that blocks requests after failed auth attempts

## Authentication Requirements:

- Bearer token required in Authorization header
- Format: `Authorization: Bearer <valid_token>`
- Rate limiting applies when using invalid tokens

## Recommended Testing Approach:

1. Get valid Bearer token through login endpoint
2. Test user activation: `POST /api/Admin/users/{userId}/resume`
3. Test user deactivation: `POST /api/Admin/users/{userId}/pause`
4. Use Swagger UI interface for interactive testing

## Status: BLOCKED

Unable to complete full endpoint testing due to:
- Need for valid authentication credentials
- Rate limiting preventing further API testing
- No direct PUT endpoint for user status updates
