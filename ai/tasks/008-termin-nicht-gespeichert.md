# Task 008 – Termin nach Chat-Buchung nicht im Dashboard

## Problem
Termin wird über Test-Chat gebucht (Bot antwortet mit Zusammenfassung),
erscheint aber nicht im Dashboard.

## Ursache
Der /api/chat/simulate Endpoint ruft Claude auf aber der Response
wird nicht auf TERMIN_BESTÄTIGT:{...} geparst – das macht nur
der WebhookController für echte WhatsApp-Nachrichten.

## Fix in ChatSimulateController.java

Nach dem Claude-API-Call: prüfe ob die Antwort TERMIN_BESTÄTIGT enthält.
Falls ja: rufe AppointmentService.save() auf – genau wie WebhookController.

Pattern:
Pattern.compile("TERMIN_BESTÄTIGT:(\\{.*?\\})", Pattern.DOTALL)

Wenn Match gefunden:
1. JSON parsen
2. Appointment-Entity erstellen und speichern
3. In der Response zusätzlich { "appointmentSaved": true } zurückgeben

Im Frontend (test-chat.ts):
Wenn response.appointmentSaved === true:
→ snackBar.open('✅ Termin wurde gespeichert!', 'OK', { duration: 4000 })