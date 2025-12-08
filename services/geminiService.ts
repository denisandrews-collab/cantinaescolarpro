// Browser-safe stub for GenAI usage.
// IMPORTANT: This file MUST NOT import @google/genai or any Node-only package.
// Replace client calls to GenAI with an HTTP call to a server endpoint that performs the GenAI request.
export async function callGenAI(prompt, options = {}) {
  console.warn(
    'callGenAI: running browser stub. Move GenAI calls to a server endpoint and call it from the client.'
  );
  return {
    success: false,
    message:
      'GenAI is not available in the browser. Implement a server-side endpoint that uses @google/genai and call it from the client.',
    prompt,
    suggestion: 'Create an API route that calls @google/genai with server credentials, then fetch it from the client.'
  };
}

    return response.text || "Tenha um excelente dia de estudos!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bom apetite e bons estudos!";
  }
};
