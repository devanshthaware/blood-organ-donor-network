# VeinLink — Role-Based & Resource-Level Authorization Model

## 1. Role Matrix & Functional Permissions

| Role | Read Permissions | Write Permissions | Restricted Operations |
| :--- | :--- | :--- | :--- |
| **DONOR** | Own profile, own donation history, own consent records. | Update availability, grant/revoke own consent, accept/decline reservation. | Blocked from peer donor data, hospital requisitions, organ matching pools. |
| **HOSPITAL_STAFF** | Facility inventory, own hospital blood requisitions. | Register inventory, create blood donation requisitions. | Blocked from other hospitals' data and organ allocation approvals. |
| **TRANSPLANT_COORDINATOR** | Authorized organ candidates, compatibility rankings, transport status. | Submit allocation reviews, approve/reject recommendations, record overrides. | Blocked from modifying donor identity or unassigned facility cases. |
| **AUDITOR** | Immutable audit logs, blockchain proofs, AI provenance records. | None (Read-only). | Blocked from altering system records or modifying clinical allocations. |
| **ADMIN** | System-wide configuration, security event streams, user statuses. | Account suspension/restoration, policy configuration. | Cannot bypass human approval for organ allocation. |

---

## 2. Resource-Level Ownership Rules

- **Donor Self-Access**: A donor can only read or modify domain resources where `resource.donorId === caller.clerkId`. Cross-donor queries throw `403 Forbidden` and log a `PRIVILEGE_ESCALATION_ATTEMPT` security event.
- **Facility Isolation**: Hospital staff and coordinators can only view and mutate clinical records where `resource.facilityId === caller.facilityId`. Cross-facility access triggers an immediate `ACCESS_DENIED` violation.

---

## 3. Security Violation Auditing

Whenever authorization fails:
1. A structured record is inserted into `securityEvents` (`ACCESS_DENIED` or `PRIVILEGE_ESCALATION_ATTEMPT`).
2. An audit log is transactionally committed to `auditLogs` with status `FAILURE`.
3. The security monitor at `/admin/security` updates real-time counters.
