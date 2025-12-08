# GenAI Migration Guide

## Problem

The `@google/genai` package is a **Node.js-only** package that cannot run in browsers. When imported directly in client-side code, it causes runtime errors and white screen issues.

## Solution Applied

We've replaced the direct import of `@google/genai` with a browser-safe stub that provides fallback functionality. This allows the application to run without errors while you migrate to a proper server-side implementation.

## Current Implementation

The app now uses `services/genaiClient.browser.js` which provides:
- Simple, deterministic friendly messages as fallbacks
- No server-side dependencies
- Warning messages in the console to indicate when the stub is being used

## Recommended Migration: Server-Side API

For production use with real AI-generated messages, you should implement a server-side API endpoint that calls the GenAI service.

### Option 1: Express.js Backend

#### 1. Create a simple Express server

Create a new file `server/index.js`:

```javascript
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY || '';

app.post('/api/generate-receipt-message', async (req, res) => {
  const { studentName, items } = req.body;
  
  if (!API_KEY) {
    return res.json({ 
      message: 'Obrigado pela preferência! Bom apetite.' 
    });
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const itemNames = items.map(i => i.name).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short, friendly, and encouraging message (max 15 words) in Portuguese for a student named ${studentName} who just bought: ${itemNames}. If the food is healthy, compliment them. If it's a treat, tell them to enjoy it. Do not use quotes.`,
    });

    res.json({ message: response.text || 'Tenha um excelente dia de estudos!' });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.json({ message: 'Bom apetite e bons estudos!' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 2. Install server dependencies

```bash
npm install --save-dev express cors
```

#### 3. Update package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/index.js",
    "dev:full": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

#### 4. Update the client stub to call the API

Update `services/genaiClient.browser.js`:

```javascript
export const generateReceiptMessage = async (studentName, items) => {
  try {
    const response = await fetch('http://localhost:3001/api/generate-receipt-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, items })
    });
    
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to simple message
    return 'Obrigado pela preferência! Bom apetite.';
  }
};
```

### Option 2: Serverless Functions (Vercel, Netlify, etc.)

#### Vercel Example

Create `api/generate-receipt-message.js`:

```javascript
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { studentName, items } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY || '';
  
  if (!API_KEY) {
    return res.json({ message: 'Obrigado pela preferência! Bom apetite.' });
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const itemNames = items.map(i => i.name).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short, friendly, and encouraging message (max 15 words) in Portuguese for a student named ${studentName} who just bought: ${itemNames}. If the food is healthy, compliment them. If it's a treat, tell them to enjoy it. Do not use quotes.`,
    });

    res.json({ message: response.text || 'Tenha um excelente dia de estudos!' });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.json({ message: 'Bom apetite e bons estudos!' });
  }
}
```

Then deploy to Vercel and update the client to call your API endpoint.

### Option 3: Firebase Cloud Functions

Similar to serverless functions, but using Firebase's infrastructure.

## Environment Variables

Make sure to set your `GEMINI_API_KEY` in your server environment:

```bash
# .env (for local development)
GEMINI_API_KEY=your_api_key_here
```

For production deployments:
- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables  
- **Heroku**: Use `heroku config:set GEMINI_API_KEY=your_key`
- **Docker**: Pass via `-e` flag or docker-compose environment section

## Security Considerations

1. **Never expose API keys in client-side code** - Always keep them on the server
2. **Implement rate limiting** - Prevent abuse of your API endpoint
3. **Add authentication** - Consider requiring auth tokens for API access
4. **CORS configuration** - Only allow requests from your domain in production
5. **Input validation** - Sanitize and validate all inputs before processing

## Testing

After implementing the server-side solution:

1. Start your backend server
2. Update the API endpoint URL in `genaiClient.browser.js`
3. Test the POS system and verify AI messages appear in receipts
4. Check browser console for any errors
5. Monitor server logs for API errors

## Package.json Recommendations

Consider moving `@google/genai` to `devDependencies` if only used server-side:

```json
{
  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },
  "devDependencies": {
    "@google/genai": "^1.31.0",
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

Or create a separate `server/package.json` for backend-only dependencies.
