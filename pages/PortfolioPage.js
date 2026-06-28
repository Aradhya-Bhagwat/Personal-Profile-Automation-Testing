export class PortfolioPage {
  constructor(page) {
    this.page = page;

    this.navLogo = page.locator('.logo');
    this.navHomeLink = page.getByRole('link', { name: 'Home', exact: true });
    this.navAboutLink = page.getByRole('link', { name: 'About', exact: true });
    this.navExperienceLink = page.getByRole('link', { name: /Experience|Career Canopy/i });
    this.navSkillsLink = page.getByRole('link', { name: 'Skills', exact: true });
    this.navProjectsLink = page.getByRole('link', { name: 'Projects', exact: true });
    this.navContactLink = page.getByRole('link', { name: 'Contact', exact: true });
    this.themeToggle = page.locator('#theme-toggle');

    this.heroSection = page.locator('#hero');
    this.heroHeading = page.locator('#hero h1');
    this.heroSubheading = page.locator('#hero .hero-subtitle');
    this.downloadResumeBtn = page.getByRole('link', { name: /Resume|CV/i });
    this.heroContactBtn = page.getByRole('button', { name: /Contact/i });

    this.aboutSection = page.locator('#about');
    this.aboutHeading = page.getByRole('heading', { name: /About/i });
    this.aboutText = page.locator('#about .about-text');
    this.profileImage = page.locator('#about img.profile-img');

    this.experienceSection = page.locator('#experience, #career-canopy');
    this.experienceCards = page.locator('.experience-specimen');

    this.skillsSection = page.locator('#skills');
    this.skillCategories = page.locator('.skill-category');
    this.skillItems = page.locator('.skill-item');

    this.projectsSection = page.locator('#projects');
    this.projectCards = page.locator('.project-card');
    this.projectFilterButtons = page.locator('.filter-btn');

    this.contactSection = page.locator('#contact');
    this.contactForm = page.locator('#contact-form');
    this.nameInput = page.getByPlaceholder(/Name/i);
    this.emailInput = page.getByPlaceholder(/Email/i);
    this.messageInput = page.getByPlaceholder(/Message/i);
    this.submitBtn = page.getByRole('button', { name: /Send|Submit/i });
    this.successAlert = page.locator('.contact-success-msg');
    this.errorAlert = page.locator('.contact-error-msg');
  }

  async goto(url = '') {
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    await this.page.goto(cleanUrl);
  }

  async navigateToSection(linkLocator) {
    await linkLocator.click();
  }

  getExperienceCard(companyName) {
    return this.experienceCards.filter({ hasText: companyName });
  }

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
