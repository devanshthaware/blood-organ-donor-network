# VeinLink — Canonical Domain Event Registry

This registry defines all official domain events across VeinLink's multi-domain architecture.

---

## 1. Blood Network Events

| Event Type | Aggregate Type | Trigger Condition | Priority | Primary Payload Keys |
| :--- | :--- | :--- | :---: | :--- |
| `blood.request.created` | `donationRequest` | New hospital blood requisition created | `ROUTINE` | `requestId`, `hospitalId`, `bloodType`, `units` |
| `blood.request.updated` | `donationRequest` | Units fulfilled or status changed | `ROUTINE` | `requestId`, `status`, `fulfilledUnits` |
| `blood.inventory.low` | `bloodInventory` | Available stock dips below warning threshold | `URGENT` | `bloodType`, `currentUnits`, `threshold`, `facilityId` |
| `blood.inventory.critical`| `bloodInventory` | Stock dips $\le 2$ units | `CRITICAL` | `bloodType`, `currentUnits`, `threshold`, `facilityId` |
| `blood.donor.matched` | `donationRequest` | Verified compatible donors identified | `URGENT` | `requestId`, `matchedDonorIds`, `bloodType` |
| `blood.reservation.created`| `donationRequest` | Donor confirms appointment slot | `ROUTINE` | `reservationId`, `donorId`, `scheduledAt` |
| `blood.reservation.expired`| `donationRequest` | Scheduled donation appointment missed | `ROUTINE` | `reservationId`, `donorId`, `expiredAt` |
| `blood.donation.completed` | `donationRequest` | Unit collected and registered in inventory | `ROUTINE` | `donorId`, `unitId`, `bloodType`, `completedAt` |

---

## 2. Organ Network Events

| Event Type | Aggregate Type | Trigger Condition | Priority | Primary Payload Keys |
| :--- | :--- | :--- | :---: | :--- |
| `organ.registered` | `organ` | Donor organ registered & logged | `URGENT` | `organId`, `organType`, `bloodType`, `donorCenter` |
| `organ.verified` | `organ` | Clinical labs verified viability | `URGENT` | `organId`, `preservationDeadline`, `hlaTyping` |
| `organ.available` | `organ` | Organ enters active matching pool | `CRITICAL` | `organId`, `organType`, `bloodType`, `preservationDeadline` |
| `organ.match.generated` | `organ` | Matching engine ranks waitlist candidates | `CRITICAL` | `organId`, `matchesCount`, `topCandidateId` |
| `organ.allocation.recommended`| `allocation` | Multi-objective recommendations ready | `CRITICAL` | `recommendationId`, `organId`, `recipientId`, `rank` |
| `organ.allocation.approved` | `allocation` | Human coordinator authorizes allocation | `CRITICAL` | `allocationId`, `organId`, `recipientId`, `justification` |
| `organ.allocation.rejected` | `allocation` | Coordinator rejects recommendation | `URGENT` | `recommendationId`, `rejectionReason`, `category` |
| `organ.preservation.warning` | `organ` | Remaining window compresses below 4 hours | `HIGH` | `organId`, `remainingHours`, `riskTier` |
| `organ.preservation.critical`| `organ` | Remaining window compresses below 2 hours | `CRITICAL` | `organId`, `remainingHours`, `riskTier` |
| `organ.preservation.expired` | `organ` | Cold ischemia limit reached | `CRITICAL` | `organId`, `expiredAt` |

---

## 3. Logistics & Transport Events

| Event Type | Aggregate Type | Trigger Condition | Priority | Primary Payload Keys |
| :--- | :--- | :--- | :---: | :--- |
| `transport.request.created`| `transport` | Transport plan initiated from approved allocation | `CRITICAL` | `transportId`, `organId`, `originFacility`, `destFacility` |
| `transport.assigned` | `transport` | Carrier assigned (Road/Air) | `URGENT` | `transportId`, `carrier`, `mode`, `estimatedMinutes` |
| `transport.pickup.pending` | `transport` | Carrier en route to source hospital | `URGENT` | `transportId`, `carrierLocation` |
| `transport.in_transit` | `transport` | Package picked up and in active transit | `CRITICAL` | `transportId`, `departedAt`, `currentLocation` |
| `transport.delay.detected` | `transport` | Milestone delay recorded | `CRITICAL` | `transportId`, `delayMinutes`, `reason`, `isCritical` |
| `transport.eta.risk` | `transport` | Projected ETA threatens preservation margin | `CRITICAL` | `transportId`, `projectedDelay`, `safetyBuffer` |
| `transport.delivered` | `transport` | Arrived at destination surgical center | `CRITICAL` | `transportId`, `deliveredAt` |
| `transport.receipt.confirmed`| `transport` | Recipient surgical handover completed | `CRITICAL` | `transportId`, `confirmedBy` |

---

## 4. Computer Vision & Physical Verification Events

| Event Type | Aggregate Type | Trigger Condition | Priority | Primary Payload Keys |
| :--- | :--- | :--- | :---: | :--- |
| `verification.created` | `verification` | Physical scan request uploaded | `ROUTINE` | `requestId`, `entityType`, `verificationType` |
| `verification.completed` | `verification` | Physical label matches digital record | `ROUTINE` | `requestId`, `confidence`, `status: "MATCH"` |
| `verification.mismatch.detected` | `verification` | Discrepancy observed between label & DB | `CRITICAL` | `requestId`, `mismatches`, `status: "MISMATCH"` |
| `verification.review.required` | `verification` | Image blur or low confidence detected | `URGENT` | `requestId`, `blurScore`, `status: "REVIEW_REQUIRED"` |

---

## 5. Network & Emergency Events

| Event Type | Aggregate Type | Trigger Condition | Priority | Primary Payload Keys |
| :--- | :--- | :--- | :---: | :--- |
| `emergency.request.created` | `donationRequest` | Mass casualty or immediate trauma alert | `CRITICAL` | `requestId`, `hospitalId`, `bloodType`, `units` |
| `network.shortage.detected` | `bloodInventory` | Multi-facility regional blood deficit | `CRITICAL` | `regionId`, `deficitUnits`, `affectedTypes` |
| `network.escalation.triggered`| `donationRequest`| Emergency request unfulfilled after timeout | `CRITICAL` | `requestId`, `elapsedMinutes`, `severity` |
