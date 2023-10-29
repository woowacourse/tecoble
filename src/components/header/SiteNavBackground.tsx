import { css } from '@emotion/react';
import { graphql, useStaticQuery } from 'gatsby';
import { getSrc } from 'gatsby-plugin-image';
import React, { type ReactNode, useEffect, useState } from 'react';
import { outer, SiteHeader, SiteHeaderStyles } from '../../styles/shared';

type SiteNavBackgroundProps = {
  children: ReactNode;
};

type SiteNavBackgroundQuery = {
  allImage: {
    edges: Array<{
      node: any;
    }>;
  };
};

function SiteNavBackground({ children }: SiteNavBackgroundProps) {
  const IMAGE_REMAINING_DURATION = 4000;
  const {
    allImage: { edges },
  } = useStaticQuery<SiteNavBackgroundQuery>(graphql`
    query navBackgroundQuery {
      allImage: allFile(filter: { relativePath: { regex: "/img/nav-background[0-9]+/i" } }) {
        edges {
          node {
            childImageSharp {
              gatsbyImageData(width: 2000, quality: 100, layout: FIXED)
            }
          }
        }
      }
    }
  `);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = edges.map(edge => getSrc(edge.node));

    setImageUrls(urls);
  }, [edges]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const [firstImageUrl, ...restImageUrls] = imageUrls;

      setImageUrls([...restImageUrls, firstImageUrl]);
    }, IMAGE_REMAINING_DURATION);

    return () => {
      clearInterval(intervalId);
    };
  }, [imageUrls]);

  return (
    <div css={[outer, SiteHeader, SiteHeaderStyles]} className="site-header-background">
      <div css={[backgroundImage]}>
        {imageUrls.map(url => (
          <div
            key={url}
            className="nav-background-image"
            css={css`
              background-image: url(${url});
            `}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

const backgroundImage = css`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;

  & > .nav-background-image {
    transition: opacity 0.5s ease-in-out;
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
  }

  & > .nav-background-image:first-child {
    opacity: 1;
  }

  & > .nav-background-image:last-child {
    opacity: 0;
  }
`;

export default SiteNavBackground;
