import { createApp } from './app.js';
const port=Number(process.env.PORT||4320);
createApp().listen(port,'127.0.0.1',()=>console.log(`Agentic Treasury API http://127.0.0.1:${port}`));
