import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 720})
        await page.goto("http://localhost:5173")
        await asyncio.sleep(2)

        await page.click('.menu-toggle-btn')
        await asyncio.sleep(1)

        await page.select_option('select[id="algorithm"]', "tsp-nearest-neighbour")
        await asyncio.sleep(1)

        await page.click('button.collapse-btn')
        await asyncio.sleep(1)

        for _ in range(9):
            await page.click('button.next-btn')
            await asyncio.sleep(0.2)

        await page.screenshot(path="/home/jules/verification/tsp_nearest_neighbour_fixed.png")
        await browser.close()

asyncio.run(main())
