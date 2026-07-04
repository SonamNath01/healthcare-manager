const { GoogleGenAI } = require("@google/genai");
const prisma = require("../config/prisma");
const buildPreVisitSummaryPrompt = require("../prompts/preVisitSummaryPrompt");
const buildPatientSummaryPrompt = require("../prompts/patientSummaryPrompt");


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const VALID_URGENCIES = ["LOW", "MEDIUM", "HIGH"];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING", description: "2-3 sentence neutral clinical pre-visit summary" },
    urgency: { type: "STRING", enum: VALID_URGENCIES },
    suggestedQuestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3-5 follow-up questions the doctor could ask",
    },
  },
  required: ["summary", "urgency", "suggestedQuestions"],
};

async function generateAndStorePreVisitSummary(appointment) {
  if (!appointment.reasonForVisit) {
    return;
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPreVisitSummaryPrompt({
        reasonForVisit: appointment.reasonForVisit,
        specialization: doctor?.specialization,
      }),
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text);

    if (!VALID_URGENCIES.includes(parsed.urgency) || !Array.isArray(parsed.suggestedQuestions)) {
      throw new Error("Model response did not match the expected shape");
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        aiSummary: parsed.summary,
        aiUrgency: parsed.urgency,
        aiSuggestedQuestions: parsed.suggestedQuestions,
        aiGeneratedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`AI pre-visit summary failed for appointment ${appointment.id}:`, err.message);
  }
}

async function generateAndStorePatientSummary(appointment) {
  if (!appointment.doctorNotes) {
    return;
  }

  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { appointmentId: appointment.id },
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPatientSummaryPrompt({
        doctorNotes: appointment.doctorNotes,
        prescriptions,
      }),
    });

    const summary = response.text?.trim();
    if (!summary) {
      throw new Error("Model returned an empty summary");
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { patientSummary: summary, patientSummaryGeneratedAt: new Date() },
    });
  } catch (err) {
    console.error(`Patient-friendly summary failed for appointment ${appointment.id}:`, err.message);
  }
}

module.exports = { generateAndStorePreVisitSummary, generateAndStorePatientSummary };
