// Explicit local entrypoint. npm start continues to fail closed unless configured.
process.env.NODE_ENV ??= 'development';
await import('./index.js');
