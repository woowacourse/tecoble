export type WebsiteConfig = {
  title: string;
  description: string;
  coverImage?: string;
  logo: string;
  /**
   * Specifying a valid BCP 47 language helps screen readers announce text properly.
   * See: https://dequeuniversity.com/rules/axe/2.2/valid-lang
   */
  lang: string;
  /**
   * blog full path, no ending slash!
   */
  siteUrl: string;
  /**
   * full url, no username
   */
  facebook?: string;
  /**
   * full url, no username
   */
  twitter?: string;
  /**
  /**
   * Meta tag for Google Webmaster Tools
   */
  googleSiteVerification?: string;
  /**
  /**
   * Appears alongside the footer, after the credits
   */
  footer?: string;
};

const config: WebsiteConfig = {
  title: 'Tecoble',
  description: 'woowacourse code review & devlog',
  coverImage: 'img/wooteco.jpeg',
  logo: 'img/tecoble.png',
  lang: 'ko',
  siteUrl: 'https://tecoble.techcourse.co.kr',
  googleSiteVerification: 'GoogleCode',
  footer: 'is based on woowacourse',
};

export default config;
