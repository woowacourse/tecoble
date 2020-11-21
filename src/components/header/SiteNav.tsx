import { Link } from 'gatsby';
import { darken } from 'polished';
import React from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { colors } from '../../styles/colors';
import { SocialLink, SocialLinkFb } from '../../styles/shared';
import config from '../../website-config';
import { Facebook } from '../icons/facebook';
import { Twitter } from '../icons/twitter';
import { SubscribeModal } from '../subscribe/SubscribeModal';
import { SiteNavLogo } from './SiteNavLogo';

interface SiteNavProps {
  isHome?: boolean;
  isPost?: boolean;
  post?: any;
}

interface SiteNavState {
  showTitle: boolean;
}

class SiteNav extends React.Component<SiteNavProps, SiteNavState> {
  subscribe = React.createRef<SubscribeModal>();
  titleRef = React.createRef<HTMLSpanElement>();
  lastScrollY = 0;
  ticking = false;
  state = { showTitle: false };

  openModal = () => {
    if (this.subscribe.current) {
      this.subscribe.current.open();
    }
  };

  componentDidMount(): void {
    this.lastScrollY = window.scrollY;
    if (this.props.isPost) {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }
  }

  componentWillUnmount(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll = () => {
    if (!this.titleRef || !this.titleRef.current) {
      return;
    }

    if (!this.ticking) {
      requestAnimationFrame(this.update);
    }

    this.ticking = true;
  };

  update = () => {
    if (!this.titleRef || !this.titleRef.current) {
      return;
    }

    this.lastScrollY = window.scrollY;

    const trigger = this.titleRef.current.getBoundingClientRect().top;
    const triggerOffset = this.titleRef.current.offsetHeight + 35;

    // show/hide post title
    if (this.lastScrollY >= trigger + triggerOffset) {
      this.setState({ showTitle: true });
    } else {
      this.setState({ showTitle: false });
    }

    this.ticking = false;
  };

  render() {
    const { isHome = false, isPost = false, post = {} } = this.props;
    return (
      <>
        {config.showSubscribe && <SubscribeModal ref={this.subscribe} />}
        <nav css={SiteNavStyles}>
          <SiteNavLeft className="site-nav-left">
            {!isHome && <SiteNavLogo />}
            <SiteNavContent css={[this.state.showTitle ? HideNav : '']}>
              <ul css={NavStyles} role="menu">
                {/* TODO: mark current nav item - add class nav-current */}
                <li role="menuitem">
                  <Link to="/">Home</Link>
                </li>
                <li role="menuitem">
                  <Link to="/about">About</Link>
                </li>
                <li role="menuitem">
                  <Link to="/tags/getting-started/">Getting Started</Link>
                </li>
              </ul>
              {isPost && (
                <NavPostTitle ref={this.titleRef} className="nav-post-title">
                  {post.title}
                </NavPostTitle>
              )}
            </SiteNavContent>
          </SiteNavLeft>
          <SiteNavRight>
            <SocialLinks>
              {config.facebook && (
                <a
                  className="social-link-fb"
                  css={[SocialLink, SocialLinkFb]}
                  href={config.facebook}
                  target="_blank"
                  title="Facebook"
                  rel="noopener noreferrer"
                >
                  <Facebook />
                </a>
              )}
              {config.twitter && (
                <a
                  css={SocialLink}
                  href={config.twitter}
                  title="Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter />
                </a>
              )}
            </SocialLinks>
            {config.showSubscribe && (
              <SubscribeButton onClick={this.openModal}>Subscribe</SubscribeButton>
            )}
          </SiteNavRight>
        </nav>
      </>
    );
  }
}

export const SiteNavMain = css`
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1000;
  /* background: color(var(--darkgrey) l(-5%)) */
  background: ${darken('0.05', colors.darkgrey)};

  @media (max-width: 700px) {
    padding-right: 0;
    padding-left: 0;
  }
`;

const SiteNavStyles = css`
  position: relative;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  overflow-y: hidden;
  height: 64px;
  font-size: 1.3rem;
`;

const SiteNavLeft = styled.div`
  flex: 1 0 auto;
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  margin-right: 10px;
  padding: 10px 0 80px;
  font-weight: 500;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  white-space: nowrap;

  -ms-overflow-scrolling: touch;

  @media (max-width: 700px) {
    margin-right: 0;
    padding-left: 5vw;
  }
`;

const SiteNavContent = styled.div`
  position: relative;
  align-self: flex-start;
`;

const NavStyles = css`
  position: absolute;
  z-index: 1000;
  display: flex;
  margin: 0 0 0 -12px;
  padding: 0;
  list-style: none;
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);

  li {
    display: block;
    margin: 0;
    padding: 0;
  }

  li a {
    position: relative;
    display: block;
    padding: 12px 12px;
    color: #fff;
    opacity: 0.8;
    transition: opacity 0.35s ease-in-out;
  }

  li a:hover {
    text-decoration: none;
    opacity: 1;
  }

  li a:before {
    content: '';
    position: absolute;
    right: 100%;
    bottom: 8px;
    left: 12px;
    height: 1px;
    background: #fff;
    opacity: 0.25;
    transition: all 0.35s ease-in-out;
  }

  li a:hover:before {
    right: 12px;
    opacity: 0.5;
  }
`;

const SiteNavRight = styled.div`
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 0;
  height: 64px;

  @media (max-width: 700px) {
    display: none;
  }
`;

const SocialLinks = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const SubscribeButton = styled.a`
  display: block;
  padding: 4px 10px;
  margin: 0 0 0 10px;
  border: #fff 1px solid;
  color: #fff;
  line-height: 1em;
  border-radius: 10px;
  opacity: 0.8;

  :hover {
    text-decoration: none;
    opacity: 1;
    cursor: pointer;
  }
`;

const NavPostTitle = styled.span`
  visibility: hidden;
  position: absolute;
  top: 9px;
  color: #fff;
  font-size: 1.7rem;
  font-weight: 400;
  text-transform: none;
  opacity: 0;
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
  transform: translateY(175%);

  .dash {
    left: -25px;
  }

  .dash:before {
    content: '– ';
    opacity: 0.5;
  }
`;

const HideNav = css`
  ul {
    visibility: hidden;
    opacity: 0;
    transform: translateY(-175%);
  }
  .nav-post-title {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
`;

export default SiteNav;
