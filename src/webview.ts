function getAnalysisWebview(analysis: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AIMastery v4.0</title>
      <style>
        body { font-family: 'Segoe UI'; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
        .score { font-size: 2em; color: #d4af37; text-align: center; }
      </style>
    </head>
    <body>
      <h1>🎨 AIMastery v4.0 - Vincian Analysis</h1>
      <div class="score">${analysis?.vincianScore || '8.5/10'}</div>
      <p>🎉 Major update with NFT generation & social media automation!</p>
      <button onclick="vscode.postMessage({command: 'upgrade', productType: 'social_pack'})">
        🚀 Get Social Pack - 5€
      </button>
      <script>const vscode = acquireVsCodeApi();</script>
    </body>
    </html>
  `;
}

function getStripeCheckoutWebview(
  clientSecret: string,
  amount: number,
  productType: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://js.stripe.com/v3/"></script>
      <style>
        body { font-family: 'Segoe UI'; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        .checkout-container { max-width: 400px; margin: 0 auto; }
        #payment-element { margin: 20px 0; }
        #submit { 
          background: #28a745; 
          color: white; 
          padding: 12px 24px; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer; 
          width: 100%; 
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="checkout-container">
        <h2>🔓 Unlock ${productType}</h2>
        <p>Amount: ${amount / 100}€</p>
        
        <form id="payment-form">
          <div id="payment-element"></div>
          <button id="submit">Pay ${amount / 100}€</button>
        </form>
      </div>
      
      <script>
        // Stripe integration placeholder - requires backend
        document.getElementById('payment-form').addEventListener('submit', async (event) => {
          event.preventDefault();
          vscode.postMessage({ 
            command: 'payment_demo', 
            productType: '${productType}',
            amount: ${amount}
          });
        });
      </script>
    </body>
    </html>
  `;
}

export { getAnalysisWebview, getStripeCheckoutWebview };
