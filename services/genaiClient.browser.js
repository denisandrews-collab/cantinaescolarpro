/**
 * Browser-safe stub for GenAI functionality.
 * 
 * This file provides a browser-compatible placeholder for AI-powered features
 * that would normally require server-side API calls.
 * 
 * IMPORTANT: This stub does NOT import @google/genai, which is a Node.js-only package.
 * 
 * For production use, you should move GenAI functionality to a server-side API endpoint.
 * See the PR description for implementation examples.
 */

/**
 * Generates a placeholder receipt message.
 * In production, this should call a server-side API endpoint.
 * 
 * @param {string} studentName - Name of the student
 * @param {Array} items - Cart items purchased
 * @returns {Promise<string>} A friendly message
 */
export const generateReceiptMessage = async (studentName, items) => {
  console.warn(
    '⚠️ GenAI stub is being used. For AI-generated messages, implement a server-side API endpoint. See PR description for details.'
  );
  
  // Provide a simple fallback message
  const itemCount = items?.length || 0;
  
  if (itemCount === 0) {
    return 'Obrigado pela preferência! Volte sempre.';
  }
  
  // Simple logic for friendly messages based on item count
  const messages = [
    'Obrigado pela preferência! Bom apetite.',
    'Tenha um excelente dia de estudos!',
    'Aproveite sua refeição! Bons estudos.',
    'Que delícia! Bom apetite e até logo.',
    'Ótima escolha! Volte sempre.'
  ];
  
  // Use item count to pick a message (pseudo-random but deterministic)
  const index = itemCount % messages.length;
  return messages[index];
};
