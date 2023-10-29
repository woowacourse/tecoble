import { graphql, Link } from 'gatsby';
import React from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';

import SiteNav from '../components/header/SiteNav';
import { PostCard } from '../components/PostCard';
import { Wrapper } from '../components/Wrapper';
import IndexLayout from '../layouts';
import { colors } from '../styles/colors';
import { inner, outer, PostFeed, SiteHeader, SiteNavMain } from '../styles/shared';
import type { PageContext } from '../templates/post';

type NotFoundTemplateProps = {
  data: {
    allMarkdownRemark: {
      totalCount: number;
      edges: Array<{
        node: PageContext;
      }>;
    };
  };
};

function NotFoundPage(props: NotFoundTemplateProps) {
  const { edges } = props.data.allMarkdownRemark;

  return (
    <IndexLayout>
      <Wrapper>
        <header css={[SiteHeader, outer]}>
          <div css={[outer, SiteNavMain]}>
            <div css={inner}>
              <SiteNav isHome={false} />
            </div>
          </div>
        </header>
        <main id="site-main" css={[outer, ErrorContent]} className="error-content">
          <div css={[inner]}>
            <section style={{ textAlign: 'center' }}>
              <ErrorCode>404</ErrorCode>
              <ErrorDescription>Page not found</ErrorDescription>
              <Link css={ErrorLink} to="/">
                Go to the front page →
              </Link>
            </section>

            <div css={PostFeed} className="post-feed">
              {edges.map(({ node }) => (
                <PostCard key={node.fields.slug} post={node} />
              ))}
            </div>
          </div>
        </main>
      </Wrapper>
    </IndexLayout>
  );
}

export const pageQuery = graphql`
  {
    allMarkdownRemark(limit: 3, sort: { frontmatter: { date: DESC } }) {
      edges {
        node {
          timeToRead
          frontmatter {
            title
            date
            tags
            image {
              childImageSharp {
                gatsbyImageData(layout: FULL_WIDTH)
              }
            }
            author {
              name
              bio
              avatar {
                children {
                  ... on ImageSharp {
                    gatsbyImageData(layout: FULL_WIDTH, breakpoints: [40, 80, 120])
                  }
                }
              }
            }
          }
          excerpt
          fields {
            layout
            slug
          }
        }
      }
    }
  }
`;

const ErrorContent = css`
  padding: 14vw 4vw 6vw;

  @media (max-width: 800px) {
    padding-top: 24vw;
  }

  @media (max-width: 500px) {
    padding-top: 28vw;
  }

  @media (min-width: 940px) {
    .post-card {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
  }
`;

const ErrorCode = styled.h1`
  margin: 0;
  /* color: var(--lightgrey); */
  color: ${colors.lightgrey};
  font-size: 12vw;
  line-height: 1em;
  letter-spacing: -5px;
  opacity: 0.75;

  @media (max-width: 800px) {
    font-size: 11.2rem;
  }
`;

const ErrorDescription = styled.p`
  margin: 0;
  /* color: var(--midgrey); */
  color: ${colors.midgrey};
  font-size: 3rem;
  line-height: 1.3em;
  font-weight: 400;

  @media (max-width: 800px) {
    margin: 5px 0 0 0;
    font-size: 1.8rem;
  }
`;

const ErrorLink = css`
  display: inline-block;
  margin-top: 5px;
`;

export default NotFoundPage;
