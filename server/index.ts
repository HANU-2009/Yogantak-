import dotenv from 'dotenv';
dotenv.config();
import app from '../api/index.js';

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[YOGANTAK API SERVER] listening on http://localhost:${PORT}`);
  });
}

export default app;
