# {{PROJECT_NAME}}

# {{API_NAME}}

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | {{PROJECT_NAME}} |
| Codename | {{CODENAME}} |
| Document ID | {{DOCUMENT_ID}} |
| Version | {{VERSION}} |
| Status | {{STATUS}} |
| Classification | {{CLASSIFICATION}} |

---

# Table of Contents

1. Purpose
2. Scope
3. API Overview
4. Authentication
5. Endpoints
6. Request Format
7. Response Format
8. Error Handling
9. Validation Requirements
10. Related Documents
11. References
12. Revision History
13. Approval Block

---

# 1. Purpose

Describe the purpose of this API.

Explain which services, systems or users consume the interface.

---

# 2. Scope

Describe:

- supported services
- supported clients
- supported versions
- integration boundaries

---

# 3. API Overview

Document:

- Base URL
- API Version
- Protocol
- Content Type
- Transport Security

Example

Base URL

/api/v1/

Content Type

application/json

---

# 4. Authentication

Document:

- Authentication Method
- Authorization Method
- Required Permissions
- Token Format
- Session Requirements

Authentication shall comply with the Authentication Specification.

---

# 5. Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | {{ENDPOINT}} | {{DESCRIPTION}} |
| POST | {{ENDPOINT}} | {{DESCRIPTION}} |
| PUT | {{ENDPOINT}} | {{DESCRIPTION}} |
| DELETE | {{ENDPOINT}} | {{DESCRIPTION}} |

Every endpoint shall have a documented purpose.

---

# 6. Request Format

Document:

Headers

Query Parameters

Path Parameters

Request Body

Example JSON

Validation Rules

---

# 7. Response Format

Document:

Success Response

Error Response

Pagination

Metadata

Example JSON

Response Codes

---

# 8. Error Handling

Document:

- HTTP Status Codes
- Error Identifiers
- Validation Errors
- Authorization Errors
- Internal Errors

Every error shall provide actionable information.

---

# 9. Validation Requirements

Validation shall verify:

- endpoint availability
- authentication
- authorization
- schema compliance
- documentation accuracy
- backward compatibility

Validation evidence shall be retained.

---

# 10. Related Documents

- {{RELATED_DOCUMENT_1}}
- {{RELATED_DOCUMENT_2}}
- {{RELATED_DOCUMENT_3}}

---

# 11. References

Internal

- API_SPECIFICATION.md
- API_STANDARD.md
- SECURITY_STANDARD.md

---

# 12. Revision History

| Version | Date | Description |
|----------|------|-------------|
| {{VERSION}} | {{DATE}} | Initial Release |

---

# 13. Approval Block

| Role | Status |
|------|--------|
| Author | {{STATUS}} |
| API Review | {{STATUS}} |
| Governance Review | {{STATUS}} |
| Final Approval | {{STATUS}} |

---

End of Document

Document ID

{{DOCUMENT_ID}}