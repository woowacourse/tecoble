import { css } from '@emotion/react';
import { graphql } from 'gatsby';
import { getSrc, getImage } from 'gatsby-plugin-image';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Footer } from '../components/Footer';
import SiteNav from '../components/header/SiteNav';
import SiteNavBackground from '../components/header/SiteNavBackground';
import Pagination from '../components/Pagination';
import { PostCard } from '../components/PostCard';
import TagNav from '../components/TagNav';
import { Wrapper } from '../components/Wrapper';
import IndexLayout from '../layouts';
import {
  inner,
  outer,
  PostFeed,
  Posts,
  SiteDescription,
  SiteHeaderContent,
  SiteMain,
  SiteTitle,
} from '../styles/shared';
import config from '../website-config';
import type { PageContext } from './post';

export type IndexProps = {
  children: React.ReactNode;
  pageContext: {
    currentPage: number;
    numPages: number;
  };
  data: {
    logo: any;
    header: any;
    allMarkdownRemark: {
      edges: Array<{
        node: PageContext;
      }>;
    };
  };
};

function IndexPage(props: IndexProps) {
  const width = getImage(props.data.header)?.width;
  const height = getImage(props.data.header)?.height;

  return (
    <IndexLayout css={HomePosts}>
      <Helmet>
        <html lang={config.lang} />
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta property="og:site_name" content={config.title} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.description} />
        <meta property="og:url" content={config.siteUrl} />
        <meta property="og:image" content={`${config.siteUrl}${getSrc(props.data.header)}`} />
        {config.facebook && <meta property="article:publisher" content={config.facebook} />}
        {config.googleSiteVerification && (
          <meta name="google-site-verification" content={config.googleSiteVerification} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.title} />
        <meta name="twitter:description" content={config.description} />
        <meta name="twitter:url" content={config.siteUrl} />
        <meta name="twitter:image" content={`${config.siteUrl}${getSrc(props.data.header)}`} />
        {config.twitter && (
          <meta
            name="twitter:site"
            content={`@${config.twitter.split('https://twitter.com/')[1]}`}
          />
        )}
        <meta property="og:image:width" content={width?.toString()} />
        <meta property="og:image:height" content={height?.toString()} />
      </Helmet>
      <Wrapper>
        <SiteNavBackground>
          <div css={inner}>
            <SiteNav isHome />
            <SiteHeaderContent className="site-header-content">
              <SiteTitle className="site-title">
                {props.data.logo ? (
                  <img
                    style={{ maxHeight: '55px' }}
                    src={getSrc(props.data.logo)}
                    alt={config.title}
                  />
                ) : (
                  config.title
                )}
              </SiteTitle>
              <SiteDescription>{config.description}</SiteDescription>
            </SiteHeaderContent>
          </div>
        </SiteNavBackground>
        <main id="site-main" css={[SiteMain, outer]}>
          <TagNav className="tag-nav" />
          <div css={[inner, Posts]}>
            <div css={[PostFeed]}>
              {props.data.allMarkdownRemark.edges.map(
                (post, index) =>
                  // filter out drafts in production
                  (post.node.frontmatter.draft !== true ||
                    process.env.NODE_ENV !== 'production') && (
                    <PostCard key={post.node.fields.slug} post={post.node} isLarge={index === 0} />
                  ),
              )}
            </div>
          </div>
        </main>
        {props.children}
        {props.pageContext.numPages > 1 && (
          <Pagination
            currentPage={props.pageContext.currentPage}
            numPages={props.pageContext.numPages}
          />
        )}
        <Footer />
      </Wrapper>
    </IndexLayout>
  );
}

export const pageQuery = graphql`
  query blogPageQuery($skip: Int!, $limit: Int!) {
    logo: file(relativePath: { eq: "img/tecoble.png" }) {
      childImageSharp {
        gatsbyImageData(layout: FIXED)
      }
    }
    header: file(relativePath: { eq: "img/wooteco.jpeg" }) {
      childImageSharp {
        gatsbyImageData(width: 2000, quality: 100, layout: FIXED, formats: [AUTO, WEBP, AVIF])
      }
    }
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { draft: { ne: true } } }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          timeToRead
          excerpt(truncate: true)
          frontmatter {
            title
            date
            tags
            draft
            excerpt
            image {
              childImageSharp {
                gatsbyImageData(layout: FULL_WIDTH, formats: [AUTO, WEBP, AVIF])
              }
            }
            author {
              name
              bio
              avatar {
                childImageSharp {
                  gatsbyImageData(layout: FULL_WIDTH, breakpoints: [40, 80, 120])
                }
              }
            }
          }
          fields {
            layout
            slug
          }
        }
      }
    }
  }
`;

const HomePosts = css`
  .tag-nav {
    margin-top: 10px;
  }

  @media (min-width: 795px) {
    .post-card-large {
      flex: 1 1 100%;
      flex-direction: row;
      padding-bottom: 40px;
      min-height: 280px;
      border-top: 0;
    }

    .post-card-large .post-card-title {
      margin-top: 0;
      font-size: 3.2rem;
    }

    .post-card-large:not(.no-image) .post-card-header {
      margin-top: 0;
    }

    .post-card-large .post-card-image-link {
      position: relative;
      flex: 1 1 auto;
      margin-bottom: 0;
      min-height: 380px;
    }

    .post-card-large .post-card-image {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .post-card-large .post-card-content {
      flex: 0 1 361px;
      justify-content: center;
    }

    .post-card-large .post-card-title {
      margin-top: 0;
      font-size: 3.2rem;
    }

    .post-card-large .post-card-content-link {
      padding: 0 0 0 40px;
    }

    .post-card-large .post-card-meta {
      padding: 0 0 0 40px;
    }

    .post-card-large .post-card-excerpt p {
      margin-bottom: 1.5em;
      font-size: 1.8rem;
      line-height: 1.5em;
    }
  }
`;

export default IndexPage;
