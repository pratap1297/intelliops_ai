# SAST & DAST Remediation Plan for IntelliOps Project

## Backend (Python/FastAPI)

### 1. Remove Default Secrets (P1)
- **File:** backend/utils.py
- **Change:** Remove hardcoded default SECRET_KEY. Require SECRET_KEY from environment variables in all environments.

### 2. Harden SQL Usage (P1)
- **Files:** backend/routers/debug.py, backend/init_db.py, backend/migrations/add_is_active_to_users.py
- **Change:** Ensure all SQL queries use parameterized inputs. Review all .execute() calls for user input.

### 3. File Handling Security (P1)
- **File:** backend/routers/documents.py
- **Change:** Validate file paths and sanitize user input to prevent path traversal in file uploads.

### 4. Logging (P2)
- **Files:** backend/utils.py, backend/services/aws_bedrock_service.py, backend/gcp_services/gcp_client.py
- **Change:** Review log statements to ensure no sensitive data (tokens, passwords, secrets) is logged.

### 5. Remove Unused Files (P3)
- **Files:** backend/models_updated.py, backend/test_logging.py, backend/init_navigation.py, backend/init_db.py, backend/create_tables.py, backend/create_admin.py, backend/aws_bedrock_integration.py
- **Change:** Delete these files if not used manually.

## Frontend (React/TypeScript)

### 6. XSS Protection (P1)
- **File:** frontend/src/components/ChatThread.tsx
- **Change:** Sanitize any HTML passed to dangerouslySetInnerHTML.

### 7. Token Storage (P2)
- **Files:** frontend/src/services/promptService.ts, frontend/src/pages/FixedOriginalChat.tsx, etc.
- **Change:** Consider using HttpOnly cookies for tokens if possible. Review localStorage usage for sensitive data.

### 8. Remove Unused Files (P3)
- **Files:** frontend/src/test-auth-rbac.ts, frontend/src/vite-env.d.ts, frontend/aws_bedrock_test.html
- **Change:** Delete if not used for manual testing.

## DAST Recommendations (P1)
- Run OWASP ZAP or Burp Suite against the running app.
- Test all endpoints for authentication, authorization, and input validation.
- Review error messages for information leakage.
- Check CORS and cookie security settings.

---
This plan covers the main SAST/DAST issues identified. Each item should be tracked and verified after remediation.
