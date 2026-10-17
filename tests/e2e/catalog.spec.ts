import { expect, test } from '@playwright/test'

async function openSidebarOnMobile(page: import('@playwright/test').Page) {
  const menu = page.getByRole('button', { name: 'Open menu' })
  if (await menu.isVisible() && await menu.getAttribute('aria-expanded') === 'false') await menu.click()
}

async function closeSidebarOnMobile(page: import('@playwright/test').Page) {
  const close = page.locator('.sidebar-close')
  if (await close.isVisible()) await close.click()
}

test('searches the real catalog and opens details', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Find a service/ })).toBeVisible()
  await openSidebarOnMobile(page)
  const search = page.getByRole('textbox', { name: 'Search the catalog' })
  await search.fill('Immich')
  await closeSidebarOnMobile(page)
  await expect(page.getByRole('link', { name: 'Immich', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Immich', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Immich', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Docker Compose', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
})

test('shows English-only content before a language is selected', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('article').first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/[А-Яа-яЁёІіЇїЄє]/)
})

test('filters Compose entries and persists the filter in the URL', async ({ page }) => {
  await page.goto('/')
  await openSidebarOnMobile(page)
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByText('Only with Compose', { exact: true }).click()
  await expect(page).toHaveURL(/compose=1/)
  await expect(page.locator('.results-toolbar')).toContainText('746')
})

test('keeps catalog controls available on an app details page', async ({ page }) => {
  await page.goto('/apps/appflowy')
  await openSidebarOnMobile(page)
  await expect(page.getByRole('textbox', { name: 'Search the catalog' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /AI & LLMs/ }).click()
  await expect(page).toHaveURL(/category=AI/)
  await expect(page.getByRole('heading', { name: /Find a service/ })).toBeVisible()
})

test('supports keyboard search shortcut and uses the forced dark theme', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+K')
  await expect(page.getByRole('textbox', { name: 'Search the catalog' })).toBeFocused()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0)
})

test('opens and closes the responsive sidebar', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation behavior')
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Catalog' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#app-sidebar')).not.toHaveClass(/app-sidebar--open/)
  await expect(page.locator('#app-sidebar')).toHaveAttribute('inert', '')
})

test('persists favorites in the browser', async ({ page }) => {
  await page.goto('/?q=Immich')
  const card = page.locator('article').filter({ has: page.getByRole('link', { name: 'Immich', exact: true }) })
  await card.getByRole('button', { name: 'Add to favorites' }).click()
  await page.goto('/favorites?q=Immich')
  await expect(page.getByRole('link', { name: 'Immich', exact: true })).toBeVisible()
})

test('switches the interface language and persists it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitemradio', { name: 'Русский' }).click()
  await expect(page.getByRole('heading', { name: /Найдите сервис/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Поиск по каталогу' })).toBeVisible()
})
