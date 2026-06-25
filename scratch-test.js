const { app, BrowserView, WebContentsView } = require('electron');
app.whenReady().then(() => {
  console.log('BrowserView:', typeof BrowserView);
  console.log('WebContentsView:', typeof WebContentsView);
  app.quit();
});
