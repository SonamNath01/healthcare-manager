
function buildPatientSummaryPrompt({ doctorNotes, prescriptions }) {
  const prescriptionLines =
    prescriptions
      .map(
        (p) =>
          `- ${p.medicineName} ${p.dosage}, ${p.frequency}, for ${p.durationDays} day(s)` +
          (p.instructions ? ` (${p.instructions})` : "")
      )
      .join("\n") || "None";

  return `You are helping translate a doctor's clinical visit notes into a short,
warm, plain-language summary for the patient to read after their appointment.

Doctor's clinical notes:
"""
${doctorNotes}
"""

Prescriptions given:
${prescriptionLines}

Write a friendly, easy-to-understand summary (3-5 sentences) covering what
was discussed and what the prescribed medications are for, in plain language
a non-medical person would understand. Do not introduce any medical
information beyond what's in the notes and prescriptions above. Speak
directly to the patient ("you"), in a warm, reassuring tone.`;
}

module.exports = buildPatientSummaryPrompt;
