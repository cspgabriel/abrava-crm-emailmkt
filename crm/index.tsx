import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const clearLegacyCaches = async () => {
	if ('serviceWorker' in navigator) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(registrations.map((registration) => registration.unregister()));
	}

	if ('caches' in window) {
		const cacheKeys = await caches.keys();
		await Promise.all(cacheKeys.map((key) => caches.delete(key)));
	}
};

void clearLegacyCaches().catch((error) => {
	console.warn('Could not clear legacy browser caches.', error);
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);