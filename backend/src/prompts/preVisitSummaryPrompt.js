
function buildPreVisitSummaryPrompt({ reasonForVisit, specialization }) {
  return `You are assisting a ${specialization || "medical"} doctor preparing for an upcoming patient visit.

A patient described their reason for the visit as follows:
"""
${reasonForVisit}
"""

Based only on what the patient wrote, produce:
1. A short, neutral clinical pre-visit summary (2-3 sentences) the doctor can skim before the appointment.
2. An urgency level -- LOW, MEDIUM, or HIGH -- based on how time-sensitive the described symptoms sound.
3. 3-5 suggested follow-up questions the doctor could ask the patient during the visit.

Do not diagnose. Do not suggest treatment. Only summarize what the patient
said and flag urgency for the doctor's own judgment.`;
}

module.exports = buildPreVisitSummaryPrompt;
