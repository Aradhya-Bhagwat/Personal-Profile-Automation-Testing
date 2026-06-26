// @ts-check

export class PortfolioPage {
  /*@param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Navigation
    this.navLogo = page.locator('.nav-logo');
    this.navHomeLink = page.getByRole('link', { name: 'Home', exact: true });
    this.navAboutLink = page.getByRole('link', { name: 'About', exact: true });
    this.navExperienceLink = page.getByRole('link', { name: /Experience|Career Canopy/i });
    this.navSkillsLink = page.getByRole('link', { name: 'Skills', exact: true });
    this.navProjectsLink = page.getByRole('link', { name: 'Projects', exact: true });
    this.navContactLink = page.getByRole('link', { name: 'Contact', exact: true });
    this.themeToggle = page.locator('#theme-toggle');

    // Hero Section
    this.heroSection = page.locator('#home');
    this.heroHeading = page.locator('#home h1');
    this.heroSubheading = page.locator('#home .subheading');
    this.downloadResumeBtn = page.getByRole('link', { name: /Resume|CV/i });
    this.heroContactBtn = page.getByRole('button', { name: /Contact/i });

    // About Section
    this.aboutSection = page.locator('#about');
    this.aboutHeading = page.getByRole('heading', { name: /About/i });
    this.aboutText = page.locator('#about .about-text');
    this.profileImage = page.locator('#about img.profile-img');

    // Career Canopy / Experience
    this.experienceSection = page.locator('#experience, #career-canopy');
    this.experienceCards = page.locator('.experience-card');

    // Skills Section
    this.skillsSection = page.locator('#skills');
    this.skillCategories = page.locator('.skill-category');
    this.skillItems = page.locator('.skill-item');

    // Projects Section
    this.projectsSection = page.locator('#projects');
    this.projectCards = page.locator('.project-card');
    this.projectFilterButtons = page.locator('.filter-btn');

    // Contact Section
    this.contactSection = page.locator('#contact');
    this.contactForm = page.locator('#contact-form');
    this.nameInput = page.getByPlaceholder(/Name/i);
    this.emailInput = page.getByPlaceholder(/Email/i);
    this.messageInput = page.getByPlaceholder(/Message/i);
    this.submitBtn = page.getByRole('button', { name: /Send|Submit/i });
    this.successAlert = page.locator('.contact-success-msg');
    this.errorAlert = page.locator('.contact-error-msg');
  }

  /** @param {string} [url] */
  async goto(url = '/') {
    await this.page.goto(url);
  }

  /** @param {import('@playwright/test').Locator} linkLocator */
  async navigateToSection(linkLocator) {
    await linkLocator.click();
  }

  /**
   * @param {string} companyName
   * @returns {import('@playwright/test').Locator}
   */
  getExperienceCard(companyName) {
    return this.experienceCards.filter({ hasText: companyName });
  }

  /**
   * @param {string} name
   * @param {string} email
   * @param {string} message
   */
  async submitContactForm(name, email, message) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.messageInput.fill(message);
    await this.submitBtn.click();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }
}
