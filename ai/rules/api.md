# API-Konventionen

Base-URL: environment.apiUrl (lokal: http://localhost:8080, prod: https://api.kommuvo.de)

Auth-Header: Authorization: Bearer <token>
Token aus: localStorage.getItem('token')
TenantId aus: localStorage.getItem('tenantId')

Wichtige Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- PUT  /api/tenants/:id        → Tenant-Settings speichern (partial save)
- GET  /api/appointments       → Termine laden
- POST /api/chat/simulate      → Test-Chat
