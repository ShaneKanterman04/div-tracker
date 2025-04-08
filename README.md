# Stock Portfolio App

A React-based stock portfolio app that integrates with the Robinhood API to provide users with an easy way to manage and track their investments.

---

## 🚀 Features

- 📈 **See Portfolio Value**  
  View your entire portfolio's current value at a glance.

- 💰 **Upcoming Dividend Payouts**  
  Get a list of expected dividend payouts for your holdings.

- 🔄 **Buy/Sell Stocks**  
  Trade stocks directly from your portfolio.

- 🧮 **Show Estimated Dividend Before Purchase**  
  Preview potential dividend earnings before buying a stock.

- 🧺 **Basket Investing**  
  Group multiple stocks into a single basket to trade them as one investment.

---

## 🔁 User Flow

1. User enters their **API key** on the homepage.
2. On the **Portfolio Page**, users can:
   - View individual holdings and baskets.
   - Buy/sell stocks.
   - Create and manage baskets.

---

## 🛠️ Tech Stack & Resources

- **Frontend**: [React](https://reactjs.org/)
- **Trading API**: [Robinhood NPM Package](https://www.npmjs.com/package/robinhood) (For executing trades)
- **Stock Data API**: [Alpha Vantage](https://www.alphavantage.co/documentation/) (For stock data)
- **Charts**: [Victory](https://commerce.nearform.com/open-source/victory/docs/charts/candlestick) (For candlestick charts)

---

## 📌 Notes

- This app uses the [Robinhood unofficial API](https://www.npmjs.com/package/robinhood) — use with caution and ensure your API key is secured.
