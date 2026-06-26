// @ts-check
import { test, expect } from '@playwright/test';
import { PortfolioPage } from '../pages/PortfolioPage';

test.describe('Personal Profile Website Tests', () => {
  /** @type {PortfolioPage} */
  let portfolioPage;

  test.beforeEach(async ({ page }) => {
    portfolioPage = new PortfolioPage(page);
    await portfolioPage.goto('/');
  });

  test('should load the home page and show the landing heading', async () => {
    await expect(portfolioPage.heroSection).toBeVisible();
    await expect(portfolioPage.heroHeading).toBeVisible();
  });

  test('should navigate to the Career Canopy (Experience) section via navbar', async () => {
    await portfolioPage.navigateToSection(portfolioPage.navExperienceLink);
    await expect(portfolioPage.experienceSection).toBeVisible();
  });

  test('should display Ithena Technologies internship details under Career Canopy', async () => {
    const ithenaCard = portfolioPage.getExperienceCard('Ithena Technologies');
    await expect(ithenaCard).toBeVisible();
    await expect(ithenaCard).toContainText(/QA|Testing/i);
    await expect(ithenaCard).toContainText(/Playwright/i);
    await expect(ithenaCard).toContainText(/Appium/i);
  });

  test('should toggle theme mode', async () => {
    if (await portfolioPage.themeToggle.isVisible()) {
      const htmlElement = portfolioPage.page.locator('html');
      const initialTheme = await htmlElement.getAttribute('data-theme') || '';

      await portfolioPage.toggleTheme();

      const currentTheme = await htmlElement.getAttribute('data-theme') || '';
      expect(initialTheme).not.toBe(currentTheme);
    }
  });

  test('should submit the contact form successfully', async () => {
    if (await portfolioPage.contactForm.isVisible()) {
      await portfolioPage.submitContactForm(
        'QA Tester',
        'qa.tester@example.com',
        'Hello, this is an automated message testing the POM contact form.'
      );
      await expect(portfolioPage.successAlert).toBeVisible();
    }
  });
});
