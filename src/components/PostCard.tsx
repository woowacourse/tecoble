import { format } from 'date-fns';
import { Link } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import _ from 'lodash';
import { lighten } from 'polished';
import React from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { colors } from '../styles/colors';
import type { PageContext } from '../templates/post';
import { AuthorList } from './AuthorList';
import defaultImage from '../content/img/tecoble-background.png';

export type PostCardProps = {
  post: PageContext;
  isLarge?: boolean;
};

export function PostCard({ post, isLarge = false }: PostCardProps) {
  const { frontmatter, fields, excerpt, timeToRead } = post;
  const date = new Date(frontmatter.date);
  // 2018-08-20
  const datetime = format(date, 'yyyy-MM-dd');
  // 20 AUG 2018
  const displayDatetime = format(date, 'dd LLL yyyy');

  return (
    <article
      className={`post-card ${frontmatter.image ? '' : 'no-image'} ${
        isLarge ? 'post-card-isLarge' : ''
      }`}
      css={[PostCardStyles, isLarge && PostCardLarge]}
    >
      {frontmatter.image && (
        <Link className="post-card-image-link" css={PostCardImageLink} to={fields.slug}>
          <PostCardImage className="post-card-image">
            {frontmatter?.image && (
              <GatsbyImage
                image={getImage(post.frontmatter.image)!}
                alt={`${post.frontmatter.title} cover image`}
                style={{ height: '100%' }}
                loading={isLarge ? 'eager' : 'lazy'}
              />
            )}
          </PostCardImage>
        </Link>
      )}
      {!frontmatter.image && (
        <Link className="post-card-image-link" css={PostCardImageLink} to={fields.slug}>
          <PostCardImage className="post-card-image">
            <img
              alt={`${frontmatter.title} cover image`}
              style={{ height: '100%', width: '100%' }}
              src={defaultImage}
            />
          </PostCardImage>
        </Link>
      )}
      <PostCardContent className="post-card-content">
        <Link className="post-card-content-link" css={PostCardContentLink} to={fields.slug}>
          <PostCardHeader className="post-card-header">
            <PostCardPrimaryTag className="post-card-primary-tag">
              {frontmatter.tags.length > 0 && `#${frontmatter.tags[0]}`}
            </PostCardPrimaryTag>
            <PostCardTitle className="post-card-title">{frontmatter.title}</PostCardTitle>
          </PostCardHeader>
          <PostCardExcerpt className="post-card-excerpt">
            <p>{frontmatter.excerpt || excerpt}</p>
          </PostCardExcerpt>
        </Link>
        <PostCardMeta className="post-card-meta">
          <AuthorList authors={frontmatter.author} tooltip="small" />
          <PostCardBylineContent className="post-card-byline-content">
            <span>
              {frontmatter.author.map((author, index) => (
                <React.Fragment key={author.name}>
                  <Link to={`/author/${_.kebabCase(author.name)}/`}>{author.name}</Link>
                  {frontmatter.author.length - 1 > index && ', '}
                </React.Fragment>
              ))}
            </span>
            <span className="post-card-byline-date">
              <time dateTime={datetime}>{displayDatetime}</time>{' '}
              <span className="bull">&bull;</span> {timeToRead} min read
            </span>
          </PostCardBylineContent>
        </PostCardMeta>
      </PostCardContent>
    </article>
  );
}

const PostCardStyles = css`
  position: relative;
  flex: 1 1 301px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0 0 40px;
  padding: 0 20px 40px;
  min-height: 220px;
  /* border-bottom: 1px solid color(var(--lightgrey) l(+12%)); */
  border-bottom: 1px solid ${lighten('0.12', colors.lightgrey)};
  background-size: cover;

  @media (prefers-color-scheme: dark) {
    /* border-bottom-color: color(var(--darkmode) l(+8%)); */
    border-bottom-color: ${lighten('0.08', colors.darkmode)};
  }
`;

const PostCardLarge = css`
  @media (min-width: 795px) {
    flex: 1 1 100%;
    flex-direction: row;
    padding-bottom: 40px;
    min-height: 280px;
    border-top: 0;

    :not(.no-image) .post-card-header {
      margin-top: 0;
    }

    .post-card-image-link {
      position: relative;
      flex: 1 1 auto;
      margin-bottom: 0;
      min-height: 380px;
    }

    .post-card-image {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .post-card-content {
      flex: 0 1 361px;
      justify-content: center;
    }

    .post-card-title {
      margin-top: 0;
      font-size: 3.2rem;
    }

    .post-card-content-link {
      padding: 0 0 0 40px;
    }

    .post-card-meta {
      padding: 0 0 0 40px;
    }

    .post-card-excerpt p {
      margin-bottom: 1.5em;
      font-size: 1.8rem;
      line-height: 1.5em;
    }
  }
`;

const PostCardImageLink = css`
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 5px 5px 0 0;
`;

const PostCardImage = styled.div`
  width: auto;
  height: 200px;
  background: ${colors.lightgrey} no-repeat center center;
  background-size: cover;
`;

const PostCardContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const PostCardContentLink = css`
  position: relative;
  display: block;
  /* color: var(--darkgrey); */
  color: ${colors.darkgrey};

  :hover {
    text-decoration: none;
  }
`;

const PostCardPrimaryTag = styled.div`
  height: 25px;
  margin: 0 0 0.2em;
  /* color: var(--blue); */
  color: ${colors.blue};
  font-size: 1.7rem;
  font-weight: 500;
  letter-spacing: 0.2px;
  text-transform: uppercase;
`;

const PostCardTitle = styled.h2`
  margin: 0 0 0.4em;
  line-height: 1.15em;
  transition: color 0.2s ease-in-out;

  @media (prefers-color-scheme: dark) {
    color: rgba(255, 255, 255, 0.85);
  }
`;

const PostCardExcerpt = styled.section`
  font-family: Georgia, serif;

  @media (prefers-color-scheme: dark) {
    /* color: color(var(--midgrey) l(+10%)); */
    color: ${lighten('0.1', colors.midgrey)} !important;
  }
`;

const PostCardMeta = styled.footer`
  display: flex;
  align-items: flex-start;
  padding: 0;
`;

const PostCardBylineContent = styled.div`
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  margin: 4px 0 0 10px;
  /* color: color(var(--midgrey) l(+10%)); */
  color: ${lighten('0.1', colors.midgrey)};
  font-size: 1.2rem;
  line-height: 1.4em;
  font-weight: 400;
  letter-spacing: 0.2px;
  text-transform: uppercase;

  span {
    margin: 0;
  }

  a {
    /* color: color(var(--darkgrey) l(+20%)); */
    color: ${lighten('0.2', colors.darkgrey)};
    font-weight: 600;
  }

  @media (prefers-color-scheme: dark) {
    a {
      color: rgba(255, 255, 255, 0.75);
    }
  }
`;

const PostCardHeader = styled.header`
  margin: 15px 0 0;
`;

export const StaticAvatar = css`
  display: block;
  overflow: hidden;
  margin: 0 0 0 -6px;
  width: 34px;
  height: 34px;
  border: #fff 2px solid;
  border-radius: 100%;

  @media (prefers-color-scheme: dark) {
    /* border-color: color(var(--darkgrey) l(+2%)); */
    border-color: ${lighten('0.02', colors.darkgrey)};
  }
`;

export const AuthorProfileImage = css`
  display: block;
  width: 100%;
  height: 100%;
  /* background: color(var(--lightgrey) l(+10%)); */
  background: ${lighten('0.1', colors.lightgrey)};
  border-radius: 100%;
  object-fit: cover;

  @media (prefers-color-scheme: dark) {
    background: ${colors.darkmode};
  }
`;
