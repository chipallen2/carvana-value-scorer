# Carvana Value Scorer

A browser script that scores Carvana listings for easy comparison. Just paste it into your browser’s console while browsing Carvana, and you’re off and running.

Each scored listing gets a color-coded badge showing its cost per **10,000 estimated remaining miles** and how that compares with your target. Lower is better. Shipping is included in both the score and the displayed price; taxes and other fees are excluded.

## Get started

1. Go to [Carvana](https://www.carvana.com/cars) and search for cars. Wait for the listings to load.
2. Open [`carvana-score.js`](./carvana-score.js), select **Raw** if viewing it on GitHub, and copy the entire file.
3. Back on the Carvana results page, right-click an empty area and choose **Inspect**.
4. Select the **Console** tab in the developer tools panel.
5. Paste the script into the console and press **Enter**. Value badges will appear on eligible listings.

You can close the developer tools panel once the script is running.

## Keep your search page open

Keep searching in the original tab and open individual cars separately:

- **Windows or Linux:** hold **Ctrl** while clicking a car to open it in a new tab.
- **Mac:** hold **Command (⌘)** while clicking a car to open it in a new tab.
- For a separate window, right-click a car’s link and choose **Open Link in New Window**.

The script watches for changes and applies scores as listings load in the original page. It stays active as long as that page remains loaded. **If you refresh, navigate away, or open a fresh search page, paste the script again.** It does not automatically run in other tabs or windows.

## Set your mileage estimate and price target

Before running the script, adjust these two settings near the top of the file:

```js
const TARGET = 1400;
const MAX_MILES = 200000;
```

**`MAX_MILES` is the total odometer reading you expect the car to reach.** The default is 200,000 miles. A car currently at 80,000 miles therefore has 120,000 estimated miles remaining. Change this to match your expectations for the vehicles you are considering; it is an assumption, not a prediction of their lifespan.

**`TARGET` is your baseline price per 10,000 remaining miles.** Start with the default of **$1,400** as a comparison target, then adjust it to your budget and the kinds of cars you are shopping for. It is not a market appraisal or a universal definition of a good deal. At that target, a car with 100,000 estimated miles remaining would cost $14,000 including shipping.

To choose your own baseline, divide your desired vehicle-plus-shipping budget by the estimated remaining miles and multiply by 10,000. For example, a $15,000 budget for 100,000 remaining miles gives a $1,500 target.

After changing either setting, copy and run the entire script again. Rerunning it replaces the existing badges.

## Read the badges

The score is calculated as:

```text
remaining miles = expected lifetime mileage − current mileage
cost per 10,000 miles = (vehicle price + shipping) ÷ remaining miles × 10,000
```

For a $15,000 car with $1,000 shipping and 100,000 miles on the odometer, the default 200,000-mile lifetime estimate gives a score of **$1,600 per 10,000 remaining miles**. Compared with the $1,400 target, the badge shows **+14%**.

- **Negative percentage:** below your target; dark green.
- **Zero percent:** approximately at your target, after rounding.
- **Positive percentage:** above your target; colors move from green through yellow and orange to red as the cost rises.

The smaller dollar amount in the badge is the cost per 10,000 remaining miles. Percentages are rounded to whole numbers.

## A few details

- A `*` beside the displayed price means paid shipping has been added. Hover over the price for the breakdown.
- Listings without readable price, mileage, or shipping information do not receive a score. Cars at or above your lifetime mileage estimate are also skipped.
- The script hides some promotional, financing, and shipping rows on listing cards to simplify the comparison.
- This compares purchase cost and estimated remaining mileage. It does not account for condition, maintenance, repairs, fuel, insurance, taxes, or other fees.
- Carvana page changes may require updates to the script. Refreshing the page removes its changes.

## License

[MIT](./LICENSE) — use, modify, and share it, including commercially, while retaining the license and copyright notice.

This is an independent project and is not affiliated with Carvana.
