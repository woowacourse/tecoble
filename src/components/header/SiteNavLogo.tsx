import { graphql, Link, StaticQuery } from 'gatsby';
import React from 'react';
import { css } from '@emotion/react';
import { getSrc } from 'gatsby-plugin-image';

import config from '../../website-config';

type SiteNavLogoProps = {
  logo?: any;
};

export function SiteNavLogo() {
  return (
    <StaticQuery
      query={graphql`
        query HeadingQuery {
          logo: file(relativePath: { eq: "img/tecoble.png" }) {
            childImageSharp {
              gatsbyImageData(quality: 100, width: 500, layout: FIXED)
            }
          }
        }
      `}
      render={(data: SiteNavLogoProps) => (
        <Link className="site-nav-logo" css={SiteNavLogoStyles} to="/">
          {data.logo ? <img src={getSrc(data.logo)} alt={config.title} /> : config.title}
        </Link>
      )}
    />
  );
}

const SiteNavLogoStyles = css`
  position: relative;
  z-index: 100;
  flex-shrink: 0;
  display: inline-block;
  margin-right: 32px;
  padding: 12px 0;
  color: #fff;
  font-size: 1.7rem;
  line-height: 1.8rem;
  font-weight: bold;
  letter-spacing: -0.5px;
  text-transform: none;

  :hover {
    text-decoration: none;
  }

  img {
    display: block;
    width: auto;
    height: 21px;
  }
`;
